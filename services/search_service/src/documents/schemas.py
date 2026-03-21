from pydantic import BaseModel
from datetime import datetime


class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    text: str
    metadata_json: dict = {}

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: str
    title: str
    source_type: str
    source_id: str | None = None
    file_url: str | None = None
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetailResponse(DocumentResponse):
    content_text: str
    chunks: list[DocumentChunkResponse] = []


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
