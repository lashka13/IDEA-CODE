import logging
import httpx
from src.conf import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """Ты — умный помощник по учебным материалам. Отвечай на вопросы пользователя, \
опираясь ТОЛЬКО на предоставленный контекст из документов. Если в контексте нет ответа, \
честно скажи об этом. Отвечай структурировано и по существу (без лишней воды). Используй markdown. \
Отвечай на том же языке, на котором задан вопрос."""


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
    """OpenAI-compatible POST .../chat/completions (e.g. Pollinations gen)."""
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise ValueError("OPENAI_API_KEY is empty")

    base = settings.OPENAI_BASE_URL.rstrip("/")
    url = f"{base}/chat/completions"
    model = model or settings.OPENAI_MODEL

    messages = _sanitize_llm_messages(messages)
    if not messages:
        raise ValueError("No valid messages (all contents empty)")

    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(
            url,
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
            logger.error("OpenAI-compatible LLM error %s: %s", resp.status_code, resp.text[:2000])
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


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
        return data["choices"][0]["message"]["content"]


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
            return data[0].get("generated_text", "")
        return str(data)


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
        if settings.OPENAI_API_KEY:
            return await call_openai_compatible_chat(messages)
        if settings.OPENROUTER_API_KEY:
            return await call_openrouter(messages)
        if settings.HUGGINGFACE_API_KEY:
            return await call_huggingface_llm(messages)
        return _fallback_response(messages)
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return f"Произошла ошибка при генерации ответа: {str(e)}"
