from pydantic import BaseModel
from datetime import datetime


class MaterialCreate(BaseModel):
    title: str
    description: str
    cover_url: str = ""
    content_url: str | None = None
    price: int = 0
    language: str
    technology: list[str] = []
    difficulty: str
    format: str
    task_type: str
    tags: list[str] = []
    table_of_contents: list[str] = []
    community_id: str | None = None


class MaterialUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    cover_url: str | None = None
    price: int | None = None
    tags: list[str] | None = None
    table_of_contents: list[str] | None = None


class MaterialResponse(BaseModel):
    id: str
    title: str
    description: str
    author_id: str
    cover_url: str
    content_url: str | None = None
    price: int
    rating: float
    rating_count: int
    purchase_count: int
    language: str
    technology: list[str]
    difficulty: str
    format: str
    task_type: str
    tags: list[str]
    table_of_contents: list[str]
    community_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MaterialListResponse(BaseModel):
    items: list[MaterialResponse]
    total: int
    page: int
    per_page: int
