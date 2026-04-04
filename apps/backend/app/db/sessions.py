import uuid

from app.db import Acquire


async def create_session(user_id: str, title: str) -> uuid.UUID:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO sessions (user_id, title) VALUES ($1, $2) RETURNING id",
            user_id,
            title,
        )
        return row["id"]


async def save_message(session_id: uuid.UUID, role: str, content: str) -> None:
    async with Acquire() as conn:
        await conn.execute(
            "INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)",
            session_id,
            role,
            content,
        )


async def bump_updated_at(session_id: uuid.UUID) -> None:
    async with Acquire() as conn:
        await conn.execute(
            "UPDATE sessions SET updated_at = NOW() WHERE id = $1",
            session_id,
        )


async def list_sessions(user_id: str) -> list[dict]:
    async with Acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title, updated_at FROM sessions WHERE user_id = $1 ORDER BY updated_at DESC",
            user_id,
        )
        return [dict(r) for r in rows]


async def get_session(session_id: uuid.UUID, user_id: str) -> dict | None:
    async with Acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, title, updated_at FROM sessions WHERE id = $1 AND user_id = $2",
            session_id,
            user_id,
        )
        if not session:
            return None
        messages = await conn.fetch(
            "SELECT role, content, created_at FROM messages WHERE session_id = $1 ORDER BY created_at ASC",
            session_id,
        )
        return {
            "id": session["id"],
            "title": session["title"],
            "updated_at": session["updated_at"],
            "messages": [dict(m) for m in messages],
        }


async def delete_session(session_id: uuid.UUID, user_id: str) -> bool:
    async with Acquire() as conn:
        result = await conn.execute(
            "DELETE FROM sessions WHERE id = $1 AND user_id = $2",
            session_id,
            user_id,
        )
        return result == "DELETE 1"
