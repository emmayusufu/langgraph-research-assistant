import httpx
from fastapi import HTTPException

from app.config import OPA_URL


async def authorize(role: str | None, action: str) -> None:
    if not role:
        raise HTTPException(status_code=403)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{OPA_URL}/v1/data/authz/allow",
            json={"input": {"role": role, "action": action}},
            timeout=5.0,
        )
        resp.raise_for_status()
        allowed = resp.json().get("result", False)
    if not allowed:
        raise HTTPException(status_code=403)
