import logging
import httpx
from src.conf import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """Ты — умный помощник по учебным материалам. Отвечай на вопросы пользователя, \
опираясь ТОЛЬКО на предоставленный контекст из документов. Если в контексте нет ответа, \
честно скажи об этом. Отвечай подробно и структурированно. Используй markdown для форматирования. \
Отвечай на том же языке, на котором задан вопрос."""


def build_context(chunks: list[dict]) -> str:
    """Build context string from document chunks."""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        title = chunk.get("title", "Документ")
        text = chunk.get("text", "")
        parts.append(f"[Источник {i}: {title}]\n{text}")
    return "\n\n---\n\n".join(parts)


async def call_openrouter(messages: list[dict], model: str | None = None) -> str:
    """Call OpenRouter chat completions API."""
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return _fallback_response(messages)

    model = model or settings.LLM_MODEL

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
                "max_tokens": 1024,
                "temperature": 0.7,
            },
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
                "parameters": {"max_new_tokens": 1024, "temperature": 0.7},
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
        "Пожалуйста, установите OPENROUTER_API_KEY или HUGGINGFACE_API_KEY "
        "в переменных окружения для работы AI-помощника.\n\n"
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
        if settings.OPENROUTER_API_KEY:
            return await call_openrouter(messages)
        elif settings.HUGGINGFACE_API_KEY:
            return await call_huggingface_llm(messages)
        else:
            return _fallback_response(messages)
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return f"Произошла ошибка при генерации ответа: {str(e)}"
