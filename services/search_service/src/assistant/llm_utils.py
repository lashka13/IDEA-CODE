"""Shared helpers for LLM response shaping (no httpx / provider logic)."""

LLM_EMPTY_ANSWER_FALLBACK = (
    "Не удалось получить ответ: модель вернула пустой текст. "
    "Попробуйте переформулировать вопрос или повторить запрос позже."
)


def ensure_non_empty_llm_output(text: str | None) -> str:
    """API contract: never expose whitespace-only or missing LLM text to clients."""
    t = (text or "").strip()
    return t if t else LLM_EMPTY_ANSWER_FALLBACK
