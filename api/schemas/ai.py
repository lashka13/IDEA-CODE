from typing import Any, Optional
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Search query in any language")
    limit: int = Field(10, ge=1, le=50, description="Maximum number of results")


class MaterialSearchResult(BaseModel):
    material_id: str
    score: float = Field(description="Relevance score 0..1")
    snippet: str = Field(description="Short excerpt from indexed text")
    material: Optional[dict[str, Any]] = Field(None, description="Full material object if available")


class SearchResponse(BaseModel):
    query: str
    results: list[MaterialSearchResult]
    total: int


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    material_ids: list[str] = Field(default_factory=list, description="Material IDs to ground the answer in")
    chat_history: list[ChatMessage] = Field(default_factory=list, description="Previous turns in the conversation")


class SourceChunk(BaseModel):
    material_id: str
    text: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class IndexRequest(BaseModel):
    material_id: str = Field(..., description="Material ID to index, or 'all' to reindex everything")


class IndexResponse(BaseModel):
    material_id: str
    success: bool
    chunks_indexed: int
    message: str
