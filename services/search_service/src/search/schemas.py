from pydantic import BaseModel


class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    score: float
    snippet: str
    source_type: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]
    total: int
