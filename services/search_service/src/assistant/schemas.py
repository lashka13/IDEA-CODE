from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AskRequest(BaseModel):
    query: str
    document_ids: list[str] = []
    history: list[ChatMessage] = []


class AskResponse(BaseModel):
    answer: str
    sources: list[str]
