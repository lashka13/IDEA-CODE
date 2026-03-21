from pydantic import BaseModel
from datetime import datetime


class TransactionCreate(BaseModel):
    type: str
    amount: int
    description: str
    material_id: str | None = None


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    type: str
    amount: int
    description: str
    material_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
