from app.db import Acquire


async def get_user_by_email(email: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT zitadel_user_id, display_name, email FROM user_profiles WHERE email = $1",
            email,
        )
        return dict(row) if row else None
