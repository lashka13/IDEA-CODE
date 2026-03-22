import asyncio
import logging
import httpx
from src.conf import get_settings
from src.assistant.llm_utils import ensure_non_empty_llm_output

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """Ты — умный помощник по учебным материалам. Отвечай на вопросы пользователя, \
опираясь ТОЛЬКО на предоставленный контекст из документов. Если в контексте нет ответа, \
честно скажи об этом. Отвечай подробно и структурированно. Используй markdown для форматирования. \
Отвечай на том же языке, на котором задан вопрос."""


def _normalize_openai_content(content: object) -> str:
    """OpenAI-style message.content: str, null, or list of {type,text} parts."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict):
                t = block.get("text")
                if t is not None:
                    parts.append(str(t))
                elif block.get("type") == "text" and "content" in block:
                    parts.append(str(block["content"]))
            elif isinstance(block, str):
                parts.append(block)
        return "".join(parts)
    return str(content)


def _chat_completion_text(data: dict) -> str:
    """Extract assistant message text; APIs may omit content or return null."""
    try:
        choices = data.get("choices") or []
        if not choices:
            return ""
        ch0 = choices[0]
        msg = ch0.get("message") or {}
        raw = msg.get("content")
        text = _normalize_openai_content(raw)
        if text.strip():
            return text
        for key in ("reasoning_content", "reasoning"):
            r = msg.get(key)
            if r and str(r).strip():
                return str(r)
        # Refusal / policy (Azure-style)
        refusal = msg.get("refusal")
        if refusal:
            return str(refusal)
        # Legacy completions
        legacy = ch0.get("text")
        if legacy:
            return str(legacy)
        return ""
    except (KeyError, IndexError, TypeError, AttributeError):
        return ""


def _sanitize_llm_messages(messages: list[dict]) -> list[dict]:
    """Some providers reject messages with empty string content."""
    out: list[dict] = []
    for m in messages:
        content = m.get("content")
        if not isinstance(content, str):
            continue
        text = content.strip()
        if not text:
            continue
        out.append({"role": m["role"], "content": text})
    return out


def build_context(chunks: list[dict]) -> str:
    """Build context string from document chunks (optional truncation for faster LLM prefill)."""
    max_chars = settings.RAG_MAX_CHUNK_CHARS
    parts = []
    for i, chunk in enumerate(chunks, 1):
        title = chunk.get("title", "Документ")
        text = chunk.get("text", "")
        if max_chars > 0 and len(text) > max_chars:
            text = text[:max_chars].rstrip() + "…"
        parts.append(f"[Источник {i}: {title}]\n{text}")
    return "\n\n---\n\n".join(parts)


async def call_openai_compatible_chat(messages: list[dict], model: str | None = None) -> str:
    """OpenAI-compatible POST .../chat/completions (e.g. Pollinations gen).

    Retries once on transient HTTP/network errors or empty body — free tiers are flaky.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise ValueError("OPENAI_API_KEY is empty")

    base = settings.OPENAI_BASE_URL.rstrip("/")
    url = f"{base}/chat/completions"
    model = model or settings.OPENAI_MODEL

    messages = _sanitize_llm_messages(messages)
    if not messages:
        raise ValueError("No valid messages (all contents empty)")

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": settings.LLM_MAX_TOKENS,
        "temperature": settings.LLM_TEMPERATURE,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    last_text = ""
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
            if resp.is_error:
                logger.error(
                    "OpenAI-compatible LLM error %s: %s",
                    resp.status_code,
                    resp.text[:2000],
                )
            resp.raise_for_status()
            data = resp.json()
            text = _chat_completion_text(data)
            if text.strip():
                return text
            last_text = text
            logger.warning(
                "OpenAI-compatible LLM empty content (attempt %s/2); keys=%s",
                attempt + 1,
                list(data.keys()) if isinstance(data, dict) else type(data),
            )
        except httpx.HTTPStatusError as e:
            code = e.response.status_code
            logger.warning(
                "OpenAI-compatible HTTP %s (attempt %s/2): %s",
                code,
                attempt + 1,
                (e.response.text or "")[:500],
            )
            if code not in (429, 502, 503, 504) or attempt >= 1:
                raise
        except httpx.RequestError as e:
            logger.warning(
                "OpenAI-compatible request error (attempt %s/2): %s",
                attempt + 1,
                e,
            )
            if attempt >= 1:
                raise
        except ValueError as e:
            # httpx resp.json() can raise JSONDecodeError (subclass of ValueError)
            logger.warning("OpenAI-compatible bad JSON (attempt %s/2): %s", attempt + 1, e)
            if attempt >= 1:
                raise

        if attempt < 1:
            await asyncio.sleep(0.75 + 0.35 * attempt)

    return last_text


async def call_openrouter(messages: list[dict], model: str | None = None) -> str:
    """Call OpenRouter chat completions API (LLM fallback)."""
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return _fallback_response(messages)

    model = model or settings.LLM_MODEL

    messages = _sanitize_llm_messages(messages)
    if not messages:
        raise ValueError("No valid messages to send to OpenRouter (all contents empty)")

    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": settings.LLM_MAX_TOKENS,
                "temperature": settings.LLM_TEMPERATURE,
            },
        )
        if resp.is_error:
            logger.error(
                "OpenRouter error %s: %s",
                resp.status_code,
                resp.text[:2000],
            )
        resp.raise_for_status()
        data = resp.json()
        text = _chat_completion_text(data)
        if not text.strip():
            logger.warning("OpenRouter returned empty content")
        return text


async def call_huggingface_llm(messages: list[dict]) -> str:
    """Fallback: call HuggingFace Inference API for text generation."""
    api_key = settings.HUGGINGFACE_API_KEY
    if not api_key:
        return _fallback_response(messages)

    prompt = "\n".join(f"{m['role']}: {m['content']}" for m in messages)

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api-inference.huggingface.co/models/google/gemma-2-2b-it",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": settings.LLM_MAX_TOKENS,
                    "temperature": settings.LLM_TEMPERATURE,
                },
            },
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and data:
            return data[0].get("generated_text", "") or ""
        return str(data) if data else ""


def _fallback_response(messages: list[dict]) -> str:
    """Fallback when no API keys are configured."""
    user_msg = ""
    for m in reversed(messages):
        if m["role"] == "user":
            user_msg = m["content"]
            break
    return (
        "К сожалению, API ключ для LLM не настроен. "
        "Укажите OPENAI_API_KEY (Pollinations и др.) или OPENROUTER_API_KEY для чата, "
        "либо HUGGINGFACE_API_KEY как запасной вариант. "
        "Для семантического поиска по-прежнему нужен OPENROUTER_API_KEY (эмбеддинги).\n\n"
        f"Ваш вопрос: {user_msg}"
    )


async def generate_answer(
    query: str,
    context_chunks: list[dict],
    history: list[dict] | None = None,
) -> str:
    """Generate RAG answer using document context."""
    context = build_context(context_chunks)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Контекст из документов:\n\n{context}"},
    ]

    if history:
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": query})

    try:
        text = ""
        if settings.OPENAI_API_KEY:
            try:
                text = await call_openai_compatible_chat(messages)
            except Exception as e:
                logger.warning(
                    "Primary LLM (OpenAI-compatible) failed, will try OpenRouter if configured: %s",
                    e,
                )
                if not settings.OPENROUTER_API_KEY:
                    raise
                text = ""
            if not (text or "").strip() and settings.OPENROUTER_API_KEY:
                logger.warning(
                    "Primary LLM empty or unavailable; using OpenRouter for this request",
                )
                text = await call_openrouter(messages)
        elif settings.OPENROUTER_API_KEY:
            text = await call_openrouter(messages)
        elif settings.HUGGINGFACE_API_KEY:
            text = await call_huggingface_llm(messages)
        else:
            return ensure_non_empty_llm_output(_fallback_response(messages))

        return ensure_non_empty_llm_output(text)
    except Exception as e:
        logger.exception("LLM call failed: %s", e)
        return ensure_non_empty_llm_output(
            f"Произошла ошибка при генерации ответа: {str(e)}"
        )
