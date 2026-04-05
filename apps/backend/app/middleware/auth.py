from collections.abc import Callable

from fastapi import HTTPException, Request
from fastapi.responses import Response

from app.db import Acquire
from app.models.user import User


async def attach_user(request: Request, call_next: Callable) -> Response:
    user_id = request.headers.get("X-User-Id", "")
    request.state.user = User(
        id=user_id,
        org_id=request.headers.get("X-User-Org", ""),
        email=request.headers.get("X-User-Email", ""),
    )
    if user_id:
        await _upsert_profile(request.state.user)
    return await call_next(request)


async def _upsert_profile(user: User) -> None:
    async with Acquire() as conn:
        await conn.execute(
            """
            INSERT INTO user_profiles (zitadel_user_id, display_name, email)
            VALUES ($1, $2, $3)
            ON CONFLICT (zitadel_user_id) DO UPDATE
                SET email = EXCLUDED.email,
                    display_name = EXCLUDED.display_name
            """,
            user.id,
            user.email.split("@")[0] or None,
            user.email or None,
        )


def current_user(request: Request) -> User:
    if not request.state.user.id:
        raise HTTPException(status_code=401)
    return request.state.user
