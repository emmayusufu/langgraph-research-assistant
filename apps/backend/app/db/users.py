import bcrypt

from app.db import Acquire


async def get_user_by_id(user_id: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, is_admin FROM users WHERE id = $1",
            user_id,
        )
        return dict(row) if row else None


async def get_user_by_email(email: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email FROM users WHERE email = $1",
            email.lower(),
        )
        return dict(row) if row else None


async def get_user_for_auth(email: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email, org_id, password_hash, is_admin FROM users WHERE email = $1",
            email.lower(),
        )
        return dict(row) if row else None


async def create_org(name: str) -> str:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO orgs (name) VALUES ($1) RETURNING id",
            name,
        )
        return row["id"]


async def create_user(email: str, password_hash: str, name: str, org_id: str) -> str:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO users (email, password_hash, name, org_id) VALUES ($1, $2, $3, $4) RETURNING id",
            email.lower(),
            password_hash,
            name,
            org_id,
        )
        return row["id"]


async def create_org_and_user(org_name: str, email: str, password_hash: str, name: str) -> tuple[str, str]:
    async with Acquire() as conn:
        async with conn.transaction():
            org_row = await conn.fetchrow(
                "INSERT INTO orgs (name) VALUES ($1) RETURNING id",
                org_name,
            )
            org_id = org_row["id"]
            user_row = await conn.fetchrow(
                "INSERT INTO users (email, password_hash, name, org_id, is_admin) VALUES ($1, $2, $3, $4, true) RETURNING id",
                email.lower(),
                password_hash,
                name,
                org_id,
            )
            return org_id, user_row["id"]


async def update_profile(user_id: str, name: str | None, email: str | None) -> None:
    async with Acquire() as conn:
        if name is not None and email is not None:
            await conn.execute(
                "UPDATE users SET name = $1, email = $2 WHERE id = $3",
                name, email.lower(), user_id,
            )
        elif name is not None:
            await conn.execute("UPDATE users SET name = $1 WHERE id = $2", name, user_id)
        elif email is not None:
            await conn.execute("UPDATE users SET email = $1 WHERE id = $2", email.lower(), user_id)


async def verify_password(user_id: str, password: str) -> bool:
    async with Acquire() as conn:
        row = await conn.fetchrow("SELECT password_hash FROM users WHERE id = $1", user_id)
    if not row:
        return False
    return bcrypt.checkpw(password.encode(), row["password_hash"].encode())


async def update_password(user_id: str, new_password: str) -> None:
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(12)).decode()
    async with Acquire() as conn:
        await conn.execute(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            hashed, user_id,
        )


async def email_exists_for_other_user(email: str, user_id: str) -> bool:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1 AND id != $2",
            email.lower(), user_id,
        )
    return row is not None
