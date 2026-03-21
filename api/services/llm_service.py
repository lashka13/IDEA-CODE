"""
LLM service for RAG-chat (answer questions about documents).

Modes:
  1. OpenRouter (OpenAI-compatible) — production mode when OPENROUTER_API_KEY is set.
     Automatically retries on 429 and falls back to alternative free models.
  2. Mock — development mode without any API key; shows retrieved chunks.
"""
import asyncio
import logging
from typing import Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

FALLBACK_MODELS = [
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
]

SYSTEM_PROMPT = """Ты — учебный ассистент образовательной платформы IT-RE:SOURCE.
Тебе предоставлены фрагменты из учебных материалов (конспектов, лекций, документов).
Отвечай на вопросы пользователя ТОЛЬКО на основе предоставленных фрагментов.
Если информации в фрагментах недостаточно — честно скажи об этом.
Отвечай подробно, структурированно. Используй примеры из текста.
Пиши на том языке, на котором задан вопрос."""


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        mat_id = chunk.get("metadata", {}).get("material_id", "?")
        parts.append(f"[Фрагмент {i} из материала {mat_id}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def _build_messages(question: str, context: str, chat_history: list[dict]) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context:
        messages.append({"role": "user", "content": f"Вот фрагменты из документов:\n\n{context}"})
        messages.append({"role": "assistant", "content": "Понял, изучил предоставленные материалы. Задайте вопрос."})
    for turn in chat_history[-6:]:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": question})
    return messages


async def _try_model(model: str, messages: list[dict], headers: dict) -> Optional[str]:
    """Try a single model with retry on 429."""
    payload = {"model": model, "messages": messages, "max_tokens": 1024, "temperature": 0.3}

    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{OPENROUTER_BASE_URL}/chat/completions",
                    json=payload,
                    headers=headers,
                )
                if resp.status_code == 429:
                    wait = 5 * (attempt + 1)
                    logger.info("Model %s rate-limited (429), retry %d in %ds", model, attempt + 1, wait)
                    await asyncio.sleep(wait)
                    continue
                if resp.status_code in (404, 400):
                    logger.warning("Model %s unavailable (%s), skipping", model, resp.status_code)
                    return None
                resp.raise_for_status()
                data = resp.json()
                answer = data["choices"][0]["message"]["content"]
                logger.info("Got answer from model %s", model)
                return answer
        except httpx.HTTPStatusError as exc:
            logger.warning("Model %s HTTP error %s: %s", model, exc.response.status_code, exc.response.text[:200])
            return None
        except Exception as exc:
            logger.warning("Model %s call failed: %s", model, exc)
            return None
    return None


async def _openrouter_chat(messages: list[dict]) -> Optional[str]:
    if not settings.OPENROUTER_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://it-resource.app",
        "X-Title": "IT-RE:SOURCE",
    }

    # Try primary model first
    primary = settings.OPENROUTER_MODEL
    result = await _try_model(primary, messages, headers)
    if result:
        return result

    # Fallback through alternative models
    for model in FALLBACK_MODELS:
        if model == primary:
            continue
        logger.info("Trying fallback model: %s", model)
        result = await _try_model(model, messages, headers)
        if result:
            return result

    logger.warning("All models exhausted — no response")
    return None


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
            "```\nOPENROUTER_API_KEY=sk-or-...\n```"
        )
    return (
        f"**[Mock-режим: OPENROUTER_API_KEY не задан]**\n\n"
        f"Вопрос: *{question}*\n\n"
        "По указанным материалам PDF-контент не проиндексирован. "
        "Загрузите PDF через форму создания материала — он будет проиндексирован автоматически."
    )


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
