from pydantic import BaseModel, field_validator


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("history message content must not be empty")
        return s


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
