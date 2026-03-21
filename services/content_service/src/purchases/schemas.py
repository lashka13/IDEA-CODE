from pydantic import BaseModel
from datetime import datetime


class PurchaseResponse(BaseModel):
    id: int
    user_id: str
    material_id: str
    price_paid: int
    created_at: datetime

    model_config = {"from_attributes": True}
