"""LLM chat: prefer OpenAI-compatible API (e.g. Pollinations); fallback to OpenRouter."""
import os

import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://gen.pollinations.ai/v1").rstrip("/")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "openai")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")

_LLM_EMPTY_FALLBACK = (
    "Не удалось получить ответ: модель вернула пустой текст. "
    "Попробуйте переформулировать вопрос или повторить запрос позже."
)


def _normalize_openai_content(content: object) -> str:
    """message.content: str, null, or list of {type,text} parts (OpenAI / some gateways)."""
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
    try:
        choices = data.get("choices") or []
        if not choices:
            return ""
        ch0 = choices[0]
        msg = ch0.get("message") or {}
        text = _normalize_openai_content(msg.get("content"))
        if text.strip():
            return text
        for key in ("reasoning_content", "reasoning"):
            r = msg.get(key)
            if r and str(r).strip():
                return str(r)
        refusal = msg.get("refusal")
        if refusal:
            return str(refusal)
        legacy = ch0.get("text")
        if legacy:
            return str(legacy)
        return ""
    except (KeyError, IndexError, TypeError, AttributeError):
        return ""


def _ensure_nonempty(text: str | None) -> str:
    t = (text or "").strip()
    return t if t else _LLM_EMPTY_FALLBACK


def llm_chat_configured() -> bool:
    return bool(OPENAI_API_KEY) or bool(OPENROUTER_API_KEY)


async def chat_completion(
    messages: list[dict],
    *,
    max_tokens: int,
    temperature: float,
    timeout: float = 60.0,
    model: str | None = None,
) -> str:
    """POST /v1/chat/completions (OpenAI-compatible)."""
    if OPENAI_API_KEY:
        url = f"{OPENAI_BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        m = model or OPENAI_MODEL
    elif OPENROUTER_API_KEY:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
        m = model or LLM_MODEL
    else:
        raise RuntimeError("No LLM API key (OPENAI_API_KEY or OPENROUTER_API_KEY)")

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            url,
            headers=headers,
            json={
                "model": m,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return _ensure_nonempty(_chat_completion_text(data))
