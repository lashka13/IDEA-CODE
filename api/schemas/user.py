from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    bio: str = ""
    tech_stack: list[str] = []


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    tech_stack: list[str] | None = None
    skills: dict[str, int] | None = None


class UserResponse(BaseModel):
    id: str
    name: str
    username: str
    avatar_url: str
    bio: str
    rating: float
    code_coins: int
    level: int
    level_title: str
    tech_stack: list[str]
    skills: dict[str, int]
    achievement_ids: list[str] = []
    joined_at: datetime
    uploads_count: int
    purchases_count: int

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
