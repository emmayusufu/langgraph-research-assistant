import os
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

_SECRET = os.environ.get("SECRET_KEY", "dev-secret-change-in-production!")
_ALGORITHM = "HS256"
_TTL_DAYS = 7


def create_token(user_id: str, email: str, org_id: str, name: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "email": email,
        "org_id": org_id,
        "name": name,
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + timedelta(days=_TTL_DAYS),
    }
    return jwt.encode(payload, _SECRET, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, _SECRET, algorithms=[_ALGORITHM])
