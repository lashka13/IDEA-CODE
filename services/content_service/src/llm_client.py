"""LLM chat: prefer OpenAI-compatible API (e.g. Pollinations); fallback to OpenRouter."""
import os

import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://gen.pollinations.ai/v1").rstrip("/")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "openai")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")


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
        return data["choices"][0]["message"]["content"]
