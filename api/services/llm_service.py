"""
LLM service for RAG-chat (answer questions about documents).

Modes:
  1. OpenRouter (OpenAI-compatible) — production mode when OPENROUTER_API_KEY is set.
     Supports hundreds of models: GPT-4o, Gemini Flash, Llama 3, Mistral, DeepSeek, etc.
  2. Mock — development mode without any API key; shows retrieved chunks and instructions.

OpenRouter API: https://openrouter.ai/docs
Available models: https://openrouter.ai/models
"""
import logging
from typing import Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

SYSTEM_PROMPT = """Ты — учебный ассистент образовательной платформы IT-RE:SOURCE.
Тебе предоставлены фрагменты из учебных материалов (конспектов, лекций, документов).
Отвечай на вопросы пользователя ТОЛЬКО на основе предоставленных фрагментов.
Если информации в фрагментах недостаточно — честно скажи об этом.
Отвечай подробно, структурированно. Используй примеры из текста.
Пиши на том языке, на котором задан вопрос."""


# ---------------------------------------------------------------------------
# Message builders
# ---------------------------------------------------------------------------

def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        mat_id = chunk.get("metadata", {}).get("material_id", "?")
        parts.append(f"[Фрагмент {i} из материала {mat_id}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def _build_messages(
    question: str,
    context: str,
    chat_history: list[dict],
) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context:
        messages.append({
            "role": "user",
            "content": f"Вот фрагменты из документов:\n\n{context}",
        })
        messages.append({
            "role": "assistant",
            "content": "Понял, изучил предоставленные материалы. Задайте вопрос.",
        })
    # Include last 6 messages (3 turns) to stay within context window
    for turn in chat_history[-6:]:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": question})
    return messages


# ---------------------------------------------------------------------------
# OpenRouter chat (standard OpenAI-compatible format)
# ---------------------------------------------------------------------------

async def _openrouter_chat(messages: list[dict]) -> Optional[str]:
    if not settings.OPENROUTER_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        # Recommended by OpenRouter for analytics / rate-limit allowlisting
        "HTTP-Referer": "https://it-resource.app",
        "X-Title": "IT-RE:SOURCE",
    }
    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            # Standard OpenAI response: {"choices": [{"message": {"content": "..."}}]}
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "OpenRouter HTTP error %s: %s",
            exc.response.status_code,
            exc.response.text[:300],
        )
    except Exception as exc:
        logger.warning("OpenRouter call failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# Mock response (no API key)
# ---------------------------------------------------------------------------

def _mock_response(question: str, chunks: list[dict]) -> str:
    if chunks:
        sources = list({c.get("metadata", {}).get("material_id", "?") for c in chunks})
        snippet = chunks[0]["text"][:300] + ("…" if len(chunks[0]["text"]) > 300 else "")
        return (
            f"**[Mock-режим: OPENROUTER_API_KEY не задан]**\n\n"
            f"Вопрос: *{question}*\n\n"
            f"Найдено **{len(chunks)}** релевантных фрагментов из: {', '.join(sources)}.\n\n"
            f"Первый фрагмент:\n> {snippet}\n\n"
            "Для реальных ответов добавьте в `.env`:\n"
            "```\nOPENROUTER_API_KEY=sk-or-...\n"
            f"OPENROUTER_MODEL={settings.OPENROUTER_MODEL}\n```"
        )
    return (
        f"**[Mock-режим: OPENROUTER_API_KEY не задан]**\n\n"
        f"Вопрос: *{question}*\n\n"
        "По указанным материалам PDF-контент не проиндексирован. "
        "Загрузите PDF через форму создания материала — он будет проиндексирован автоматически.\n\n"
        "Для реальных ответов добавьте в `.env`:\n"
        "```\nOPENROUTER_API_KEY=sk-or-...\n"
        f"OPENROUTER_MODEL={settings.OPENROUTER_MODEL}\n```"
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def answer_question(
    question: str,
    context_chunks: list[dict],
    chat_history: list[dict],
) -> str:
    """Generate an answer grounded in the provided chunks via OpenRouter."""
    context = _build_context(context_chunks)
    messages = _build_messages(question, context, chat_history)

    answer = await _openrouter_chat(messages)
    if answer:
        return answer

    return _mock_response(question, context_chunks)
