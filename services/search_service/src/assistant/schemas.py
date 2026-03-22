from pydantic import BaseModel, field_validator

from src.assistant.llm_utils import ensure_non_empty_llm_output


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

    @field_validator("content")
    @classmethod
    def content_strip(cls, v: str) -> str:
        """Allow empty strings — UI may send placeholders; router filters before LLM."""
        return v.strip() if isinstance(v, str) else ""


class AskRequest(BaseModel):
    query: str
    document_ids: list[str] = []
    history: list[ChatMessage] = []

    @field_validator("query")
    @classmethod
    def query_stripped(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("query must not be empty or whitespace-only")
        return s


class AskResponse(BaseModel):
    answer: str
    sources: list[str]

    @field_validator("answer")
    @classmethod
    def answer_never_empty(cls, v: str) -> str:
        return ensure_non_empty_llm_output(v)
