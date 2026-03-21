import httpx
from src.conf import get_settings

settings = get_settings()


class AuthServiceClient:
    def __init__(self):
        self.base_url = settings.AUTH_SERVICE_URL

    async def get_user(self, user_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/api/internal/users/{user_id}")
            resp.raise_for_status()
            return resp.json()

    async def deduct_coins(self, user_id: str, amount: int, description: str = ""):
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/api/internal/users/{user_id}/deduct-coins",
                json={"amount": amount, "description": description},
            )
            if resp.status_code == 400:
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail=resp.json().get("detail", "Insufficient CodeCoins"))
            resp.raise_for_status()
            return resp.json()

    async def add_coins(self, user_id: str, amount: int, description: str = ""):
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/api/internal/users/{user_id}/add-coins",
                json={"amount": amount, "description": description},
            )
            resp.raise_for_status()
            return resp.json()
