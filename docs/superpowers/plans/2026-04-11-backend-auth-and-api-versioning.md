# Backend Auth & API Versioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Zitadel + NextAuth with backend-issued JWTs, remove Zitadel/Traefik infrastructure, add OPA doc RBAC, and version all API routes under `/api/v1/`.

**Architecture:** FastAPI issues HS256 JWTs on login/signup stored in httpOnly cookies. The Next.js proxy forwards the cookie header to the backend unchanged and passes `Set-Cookie` back to the browser. Auth middleware decodes the JWT and calls OPA on every authenticated request (revocation check). Doc endpoints additionally call OPA authz for RBAC. Frontend never touches the token — all auth logic lives in FastAPI.

**Tech Stack:** Python 3.11+, FastAPI, PyJWT, bcrypt, asyncpg, httpx. Next.js 16, TypeScript. OPA: `jwt.rego` (revocation) + `authz.rego` (RBAC).

---

## Prerequisites

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## File Map

**New files**
- `apps/backend/app/utils/__init__.py`
- `apps/backend/app/utils/token.py`
- `apps/backend/app/routers/auth.py`
- `apps/backend/app/middleware/opa.py`
- `policies/authz.rego`
- `apps/backend/tests/test_token.py`
- `apps/backend/tests/test_middleware.py`
- `apps/backend/tests/test_auth.py`
- `apps/web/src/hooks/useCurrentUser.ts`

**Modified files**
- `apps/backend/requirements.txt`
- `apps/backend/app/models/user.py`
- `apps/backend/app/middleware/auth.py`
- `apps/backend/app/db/users.py`
- `apps/backend/app/db/docs.py`
- `apps/backend/app/routers/docs.py`
- `apps/backend/app/routers/sessions.py`
- `apps/backend/app/routers/users.py`
- `apps/backend/app/main.py`
- `apps/backend/app/migrations/init.sql`
- `apps/backend/tests/test_docs_router.py`
- `apps/web/package.json`
- `apps/web/src/app/api/backend/[...path]/route.ts`
- `apps/web/src/proxy.ts`
- `apps/web/src/app/providers.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/signup/page.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/components/layout/Header.tsx`
- `.env.example`
- `docker-compose.yml`

**Deleted files**
- `apps/web/src/lib/auth.ts`
- `apps/web/src/types/next-auth.d.ts`
- `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- `apps/web/src/app/api/org/route.ts`

**Deleted directories**
- `apps/zitadel-init/`
- `docker-proxy/`
- `traefik/`

---

## Task 1: JWT Token Utility

**Files:**
- Create: `apps/backend/app/utils/__init__.py`
- Create: `apps/backend/app/utils/token.py`
- Modify: `apps/backend/app/models/user.py`
- Modify: `apps/backend/requirements.txt`
- Create: `apps/backend/tests/test_token.py`

- [ ] **Step 1: Add PyJWT and bcrypt to requirements.txt**

```
# apps/backend/requirements.txt  (append these two lines)
PyJWT>=2.9.0
bcrypt>=4.0.0
```

Install them:
```bash
cd apps/backend && pip install PyJWT bcrypt
```

- [ ] **Step 2: Write the failing tests**

Create `apps/backend/tests/test_token.py`:

```python
from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.utils.token import _ALGORITHM, _SECRET, create_token, decode_token


def test_create_and_decode_roundtrip():
    token = create_token("u1", "a@a.com", "org1", "Alice")
    payload = decode_token(token)
    assert payload["sub"] == "u1"
    assert payload["email"] == "a@a.com"
    assert payload["org_id"] == "org1"
    assert payload["name"] == "Alice"
    assert "jti" in payload
    assert "exp" in payload


def test_each_token_has_unique_jti():
    t1 = decode_token(create_token("u1", "a@a.com", "org1", "Alice"))
    t2 = decode_token(create_token("u1", "a@a.com", "org1", "Alice"))
    assert t1["jti"] != t2["jti"]


def test_expired_token_raises():
    payload = {
        "sub": "u1",
        "email": "a@a.com",
        "org_id": "org1",
        "name": "Alice",
        "jti": "x",
        "iat": datetime.now(UTC) - timedelta(days=8),
        "exp": datetime.now(UTC) - timedelta(days=1),
    }
    expired = jwt.encode(payload, _SECRET, algorithm=_ALGORITHM)
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(expired)


def test_tampered_token_raises():
    token = create_token("u1", "a@a.com", "org1", "Alice")
    with pytest.raises(jwt.PyJWTError):
        decode_token(token + "tampered")
```

- [ ] **Step 3: Run tests — expect failure**

```bash
cd apps/backend && pytest tests/test_token.py -v
```

Expected: `ImportError` — `app.utils.token` does not exist yet.

- [ ] **Step 4: Create `apps/backend/app/utils/__init__.py`** (empty)

```python
```

- [ ] **Step 5: Create `apps/backend/app/utils/token.py`**

```python
import os
import uuid
from datetime import UTC, datetime, timedelta

import jwt

_SECRET = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
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


def decode_token(token: str) -> dict:
    return jwt.decode(token, _SECRET, algorithms=[_ALGORITHM])
```

- [ ] **Step 6: Add `name` field to the User model**

`apps/backend/app/models/user.py`:

```python
from dataclasses import dataclass, field


@dataclass
class User:
    id: str
    org_id: str
    email: str
    name: str = field(default="")
```

- [ ] **Step 7: Run tests — expect pass**

```bash
cd apps/backend && pytest tests/test_token.py -v
```

Expected:
```
tests/test_token.py::test_create_and_decode_roundtrip PASSED
tests/test_token.py::test_each_token_has_unique_jti PASSED
tests/test_token.py::test_expired_token_raises PASSED
tests/test_token.py::test_tampered_token_raises PASSED
4 passed
```

- [ ] **Step 8: Commit**

```bash
git add apps/backend/app/utils/ apps/backend/app/models/user.py apps/backend/requirements.txt apps/backend/tests/test_token.py
git commit -m "add JWT token utility"
```

---

## Task 2: JWT Cookie Middleware

**Files:**
- Modify: `apps/backend/app/middleware/auth.py`
- Create: `apps/backend/tests/test_middleware.py`

- [ ] **Step 1: Write failing middleware tests**

Create `apps/backend/tests/test_middleware.py`:

```python
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.middleware.auth import attach_user, current_user
from app.models.user import User
from app.utils.token import create_token

mini_app = FastAPI()
mini_app.middleware("http")(attach_user)


@mini_app.get("/protected")
def protected(user: User = Depends(current_user)):
    return {"id": user.id, "email": user.email, "name": user.name}


def test_no_token_returns_401():
    resp = TestClient(mini_app, raise_server_exceptions=False).get("/protected")
    assert resp.status_code == 401


def test_valid_cookie_authenticates_user():
    token = create_token("u1", "a@a.com", "org1", "Alice")
    with patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False):
        resp = TestClient(mini_app).get("/protected", cookies={"token": token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "u1"
    assert data["email"] == "a@a.com"
    assert data["name"] == "Alice"


def test_bearer_token_authenticates_user():
    token = create_token("u2", "b@b.com", "org1", "Bob")
    with patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False):
        resp = TestClient(mini_app).get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["id"] == "u2"


def test_revoked_token_returns_401():
    token = create_token("u1", "a@a.com", "org1", "Alice")
    with patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=True):
        resp = TestClient(mini_app, raise_server_exceptions=False).get(
            "/protected", cookies={"token": token}
        )
    assert resp.status_code == 401


def test_invalid_token_returns_401():
    with patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False):
        resp = TestClient(mini_app, raise_server_exceptions=False).get(
            "/protected", cookies={"token": "not.a.jwt"}
        )
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/backend && pytest tests/test_middleware.py -v
```

Expected: Tests fail because `attach_user` currently reads headers, not JWT cookies.

- [ ] **Step 3: Rewrite `apps/backend/app/middleware/auth.py`**

```python
import os
from collections.abc import Callable

import httpx
import jwt
from fastapi import HTTPException, Request
from fastapi.responses import Response

from app.models.user import User
from app.utils.token import decode_token

OPA_URL = os.environ.get("OPA_URL", "http://opa:8181")


async def attach_user(request: Request, call_next: Callable) -> Response:
    token = request.cookies.get("token") or _bearer(request)
    user = User(id="", org_id="", email="")
    if token:
        try:
            payload = decode_token(token)
            if not await _is_revoked(payload["jti"]):
                user = User(
                    id=payload["sub"],
                    org_id=payload["org_id"],
                    email=payload["email"],
                    name=payload.get("name", ""),
                )
        except jwt.PyJWTError:
            pass
    request.state.user = user
    return await call_next(request)


def current_user(request: Request) -> User:
    if not request.state.user.id:
        raise HTTPException(status_code=401)
    return request.state.user


def _bearer(request: Request) -> str | None:
    auth = request.headers.get("authorization", "")
    return auth[7:] if auth.startswith("Bearer ") else None


async def _is_revoked(jti: str) -> bool:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{OPA_URL}/v1/data/jwt/allow",
                json={"input": {"jti": jti}},
                timeout=3.0,
            )
            return not resp.json().get("result", True)
    except Exception:
        return False
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd apps/backend && pytest tests/test_middleware.py -v
```

Expected:
```
tests/test_middleware.py::test_no_token_returns_401 PASSED
tests/test_middleware.py::test_valid_cookie_authenticates_user PASSED
tests/test_middleware.py::test_bearer_token_authenticates_user PASSED
tests/test_middleware.py::test_revoked_token_returns_401 PASSED
tests/test_middleware.py::test_invalid_token_returns_401 PASSED
5 passed
```

- [ ] **Step 5: Run full test suite — existing docs tests must still pass**

```bash
cd apps/backend && pytest tests/ -v
```

Expected: All existing `test_docs_router.py` tests still pass. They use dependency overrides and have no token in requests, so the new middleware sets empty user and dependency override provides the mock user.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/middleware/auth.py apps/backend/tests/test_middleware.py
git commit -m "replace header-based auth with JWT cookie middleware"
```

---

## Task 3: DB Layer

**Files:**
- Modify: `apps/backend/app/db/users.py`
- Modify: `apps/backend/app/db/docs.py`
- Modify: `apps/backend/app/routers/docs.py`
- Modify: `apps/backend/tests/test_docs_router.py`

- [ ] **Step 1: Update mock data in `tests/test_docs_router.py`**

Find and replace two occurrences of Zitadel field names in the collaborator tests:

```python
# Line ~173 — change this:
target_user = {
    "zitadel_user_id": "other-user",
    "display_name": "Other",
    "email": "other@test.com",
}

# To this:
target_user = {"id": "other-user", "name": "Other", "email": "other@test.com"}
```

```python
# Line ~201 — change this:
self_user = {"zitadel_user_id": "user123", "display_name": "Self", "email": "t@t.com"}

# To this:
self_user = {"id": "user123", "name": "Self", "email": "t@t.com"}
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/backend && pytest tests/test_docs_router.py -v
```

Expected: `test_add_collaborator_succeeds` and `test_add_collaborator_owner_cannot_add_self` fail with `KeyError: 'zitadel_user_id'` because `docs.py` router still uses `target["zitadel_user_id"]`.

- [ ] **Step 3: Rewrite `apps/backend/app/db/users.py`**

```python
from app.db import Acquire


async def get_user_by_email(email: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email FROM users WHERE email = $1",
            email,
        )
        return dict(row) if row else None


async def get_user_for_auth(email: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email, org_id, password_hash FROM users WHERE email = $1",
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
```

- [ ] **Step 4: Update `list_collaborators` in `apps/backend/app/db/docs.py`**

Find the `list_collaborators` function and replace it:

```python
async def list_collaborators(doc_id: uuid.UUID) -> list[dict]:
    async with Acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT dc.user_id, dc.role, u.name AS display_name, u.email
            FROM doc_collaborators dc
            JOIN users u ON u.id = dc.user_id
            WHERE dc.doc_id = $1
            """,
            doc_id,
        )
        return [dict(r) for r in rows]
```

- [ ] **Step 5: Fix field references in `apps/backend/app/routers/docs.py`**

Find the `add_collaborator` endpoint. Change two references from `zitadel_user_id` to `id`:

```python
# Change this:
if target["zitadel_user_id"] == user.id:
    raise HTTPException(status_code=422, detail="Cannot add owner as collaborator")
await db.add_collaborator(doc_id, target["zitadel_user_id"], body.role)

# To this:
if target["id"] == user.id:
    raise HTTPException(status_code=422, detail="Cannot add owner as collaborator")
await db.add_collaborator(doc_id, target["id"], body.role)
```

- [ ] **Step 6: Run tests — expect pass**

```bash
cd apps/backend && pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/app/db/users.py apps/backend/app/db/docs.py apps/backend/app/routers/docs.py apps/backend/tests/test_docs_router.py
git commit -m "add user and org write methods to db layer"
```

---

## Task 4: Auth Endpoints

**Files:**
- Create: `apps/backend/app/routers/auth.py`
- Modify: `apps/backend/app/main.py`
- Create: `apps/backend/tests/test_auth.py`

- [ ] **Step 1: Write failing auth tests**

Create `apps/backend/tests/test_auth.py`:

```python
from unittest.mock import AsyncMock, patch

import bcrypt
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user as real_current_user
from app.models.user import User


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(4)).decode()


def test_signup_creates_user_and_sets_cookie():
    with (
        patch("app.routers.auth.db.create_org", new_callable=AsyncMock, return_value="org1"),
        patch("app.routers.auth.db.create_user", new_callable=AsyncMock, return_value="user1"),
    ):
        resp = TestClient(app).post(
            "/api/v1/auth/signup",
            json={
                "orgName": "Acme",
                "firstName": "Alice",
                "lastName": "Smith",
                "email": "alice@acme.com",
                "password": "password123",
            },
        )
    assert resp.status_code == 201
    assert resp.json()["email"] == "alice@acme.com"
    assert resp.json()["name"] == "Alice Smith"
    assert "token" in resp.cookies


def test_signup_duplicate_email_returns_400():
    from asyncpg import UniqueViolationError

    with (
        patch("app.routers.auth.db.create_org", new_callable=AsyncMock, return_value="org1"),
        patch(
            "app.routers.auth.db.create_user",
            new_callable=AsyncMock,
            side_effect=UniqueViolationError("duplicate"),
        ),
    ):
        resp = TestClient(app).post(
            "/api/v1/auth/signup",
            json={
                "orgName": "Acme",
                "firstName": "Alice",
                "lastName": "Smith",
                "email": "alice@acme.com",
                "password": "password123",
            },
        )
    assert resp.status_code == 400


def test_login_valid_credentials_sets_cookie():
    user_data = {
        "id": "user1",
        "email": "alice@acme.com",
        "name": "Alice Smith",
        "org_id": "org1",
        "password_hash": _hash("password123"),
    }
    with patch("app.routers.auth.db.get_user_for_auth", new_callable=AsyncMock, return_value=user_data):
        resp = TestClient(app).post(
            "/api/v1/auth/login",
            json={"email": "alice@acme.com", "password": "password123"},
        )
    assert resp.status_code == 200
    assert resp.json()["email"] == "alice@acme.com"
    assert "token" in resp.cookies


def test_login_user_not_found_returns_401():
    with patch("app.routers.auth.db.get_user_for_auth", new_callable=AsyncMock, return_value=None):
        resp = TestClient(app, raise_server_exceptions=False).post(
            "/api/v1/auth/login",
            json={"email": "nobody@acme.com", "password": "password123"},
        )
    assert resp.status_code == 401


def test_login_wrong_password_returns_401():
    user_data = {
        "id": "user1",
        "email": "alice@acme.com",
        "name": "Alice Smith",
        "org_id": "org1",
        "password_hash": _hash("correct-password"),
    }
    with patch("app.routers.auth.db.get_user_for_auth", new_callable=AsyncMock, return_value=user_data):
        resp = TestClient(app, raise_server_exceptions=False).post(
            "/api/v1/auth/login",
            json={"email": "alice@acme.com", "password": "wrong-password"},
        )
    assert resp.status_code == 401


def test_me_returns_current_user():
    app.dependency_overrides[real_current_user] = lambda: User(
        id="user1", org_id="org1", email="alice@acme.com", name="Alice Smith"
    )
    try:
        resp = TestClient(app).get("/api/v1/auth/me")
    finally:
        app.dependency_overrides.pop(real_current_user, None)
    assert resp.status_code == 200
    data = resp.json()
    assert data == {"id": "user1", "email": "alice@acme.com", "name": "Alice Smith", "org_id": "org1"}


def test_logout_without_cookie_returns_204():
    resp = TestClient(app).post("/api/v1/auth/logout")
    assert resp.status_code == 204


def test_logout_with_cookie_revokes_and_clears():
    from app.utils.token import create_token

    token = create_token("user1", "alice@acme.com", "org1", "Alice Smith")
    with (
        patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False),
        patch("app.routers.auth._revoke", new_callable=AsyncMock),
    ):
        resp = TestClient(app).post("/api/v1/auth/logout", cookies={"token": token})
    assert resp.status_code == 204
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/backend && pytest tests/test_auth.py -v
```

Expected: `ImportError` — `app.routers.auth` does not exist yet.

- [ ] **Step 3: Create `apps/backend/app/routers/auth.py`**

```python
import os

import bcrypt
import httpx
from asyncpg import UniqueViolationError
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from app.db import users as db
from app.middleware.auth import current_user
from app.models.user import User
from app.utils.token import create_token, decode_token
from fastapi import Depends

OPA_URL = os.environ.get("OPA_URL", "http://opa:8181")
_COOKIE = "token"
_COOKIE_MAX_AGE = 7 * 24 * 60 * 60

router = APIRouter(prefix="/api/v1/auth")


class SignupRequest(BaseModel):
    orgName: str
    firstName: str
    lastName: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=_COOKIE_MAX_AGE,
    )


@router.post("/signup", status_code=201)
async def signup(body: SignupRequest, response: Response):
    name = f"{body.firstName} {body.lastName}".strip()
    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt(12)).decode()
    try:
        org_id = await db.create_org(body.orgName)
        user_id = await db.create_user(body.email, password_hash, name, org_id)
    except UniqueViolationError:
        raise HTTPException(status_code=400, detail="Email already in use")
    token = create_token(user_id, body.email.lower(), org_id, name)
    _set_cookie(response, token)
    return {"id": user_id, "email": body.email.lower(), "name": name}


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    user = await db.get_user_for_auth(body.email)
    if not user or not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"], user["org_id"], user["name"])
    _set_cookie(response, token)
    return {"id": user["id"], "email": user["email"], "name": user["name"]}


@router.post("/logout", status_code=204)
async def logout(request: Request, response: Response):
    raw = request.cookies.get(_COOKIE)
    if raw:
        try:
            payload = decode_token(raw)
            await _revoke(payload["jti"], int(payload["exp"]))
        except Exception:
            pass
    response.delete_cookie(key=_COOKIE, path="/")


@router.get("/me")
async def me(user: User = Depends(current_user)):
    return {"id": user.id, "email": user.email, "name": user.name, "org_id": user.org_id}


async def _revoke(jti: str, exp: int) -> None:
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{OPA_URL}/v1/data/revoked_tokens",
            headers={"Content-Type": "application/json-patch+json"},
            content=f'[{{"op":"add","path":"/{jti}","value":{exp}}}]',
            timeout=3.0,
        )
```

- [ ] **Step 4: Register the auth router in `apps/backend/app/main.py`**

Add two lines — one import and one `include_router` call:

```python
# Add to imports (after existing router imports):
from app.routers.auth import router as auth_router

# Add after existing app.include_router calls:
app.include_router(auth_router)
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd apps/backend && pytest tests/test_auth.py -v
```

Expected:
```
tests/test_auth.py::test_signup_creates_user_and_sets_cookie PASSED
tests/test_auth.py::test_signup_duplicate_email_returns_400 PASSED
tests/test_auth.py::test_login_valid_credentials_sets_cookie PASSED
tests/test_auth.py::test_login_user_not_found_returns_401 PASSED
tests/test_auth.py::test_login_wrong_password_returns_401 PASSED
tests/test_auth.py::test_me_returns_current_user PASSED
tests/test_auth.py::test_logout_without_cookie_returns_204 PASSED
tests/test_auth.py::test_logout_with_cookie_revokes_and_clears PASSED
8 passed
```

- [ ] **Step 6: Run full test suite**

```bash
cd apps/backend && pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/app/routers/auth.py apps/backend/app/main.py apps/backend/tests/test_auth.py
git commit -m "add auth endpoints: signup, login, logout, me"
```

---

## Task 5: Version All API Routes Under `/api/v1`

**Files:**
- Modify: `apps/backend/app/main.py`
- Modify: `apps/backend/app/routers/sessions.py`
- Modify: `apps/backend/app/routers/docs.py`
- Modify: `apps/backend/app/routers/users.py`
- Modify: `apps/backend/tests/test_docs_router.py`

- [ ] **Step 1: Update route URLs in `tests/test_docs_router.py`**

Replace every occurrence of `/api/content/docs` with `/api/v1/content/docs`, and `/api/users/` with `/api/v1/users/`:

```bash
cd apps/backend
sed -i 's|/api/content/docs|/api/v1/content/docs|g' tests/test_docs_router.py
sed -i 's|/api/users/|/api/v1/users/|g' tests/test_docs_router.py
```

Verify the replacements:
```bash
grep -n "api/" tests/test_docs_router.py
```

Expected: All paths now read `/api/v1/content/docs` and `/api/v1/users/search`.

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/backend && pytest tests/test_docs_router.py -v
```

Expected: Tests fail with 404 because router prefixes still use the old paths.

- [ ] **Step 3: Update router prefixes**

`apps/backend/app/routers/sessions.py` line 9:
```python
router = APIRouter(prefix="/api/v1/sessions")
```

`apps/backend/app/routers/docs.py` line 12:
```python
router = APIRouter(prefix="/api/v1/content/docs")
```

`apps/backend/app/routers/users.py` line 7:
```python
router = APIRouter(prefix="/api/v1/users")
```

- [ ] **Step 4: Update research routes in `apps/backend/app/main.py`**

Change both research route decorators:

```python
@app.post("/api/v1/research")
async def research(...):
    ...

@app.post("/api/v1/research/stream")
async def research_stream(...):
    ...
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd apps/backend && pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/main.py apps/backend/app/routers/sessions.py apps/backend/app/routers/docs.py apps/backend/app/routers/users.py apps/backend/tests/test_docs_router.py
git commit -m "version all API routes under /api/v1"
```

---

## Task 6: OPA Doc Authz Policy

**Files:**
- Create: `policies/authz.rego`
- Create: `apps/backend/app/middleware/opa.py`
- Modify: `apps/backend/app/routers/docs.py`
- Modify: `apps/backend/tests/test_docs_router.py`

- [ ] **Step 1: Add OPA mocks to tests that hit guarded doc endpoints**

In `tests/test_docs_router.py`, the endpoints `get_doc`, `delete_doc`, and all collaborator management endpoints call OPA. Add `patch("app.middleware.opa.httpx.AsyncClient")` to those tests.

Find `test_get_doc_returns_content` and add the OPA patch:

```python
def test_get_doc_returns_content():
    doc_id = uuid.uuid4()
    ts = datetime(2026, 4, 7, tzinfo=UTC)
    doc_data = {
        "id": doc_id,
        "owner_id": "user123",
        "title": "Test",
        "content": "# Hello",
        "created_at": ts,
        "updated_at": ts,
    }

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch("app.middleware.opa.httpx.AsyncClient"),
            patch("app.routers.docs.db.get_doc", new_callable=AsyncMock, return_value=doc_data),
            patch("app.routers.docs.db.list_collaborators", new_callable=AsyncMock, return_value=[]),
        ):
            response = TestClient(app).get(f"/api/v1/content/docs/{doc_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "# Hello"
    assert data["role"] == "owner"
```

Add `patch("app.middleware.opa.httpx.AsyncClient")` to `test_delete_doc_returns_204_for_owner`:

```python
def test_delete_doc_returns_204_for_owner():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch("app.middleware.opa.httpx.AsyncClient"),
            patch("app.routers.docs.db.delete_doc", new_callable=AsyncMock, return_value=True),
        ):
            response = TestClient(app).delete(f"/api/v1/content/docs/{doc_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 204
```

Add `patch("app.middleware.opa.httpx.AsyncClient")` to `test_add_collaborator_user_not_found`, `test_add_collaborator_succeeds`, `test_add_collaborator_owner_cannot_add_self`, `test_add_collaborator_invalid_role_returns_422`. Each uses the same pattern — add the patch alongside the existing `get_role` mock.

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/backend && pytest tests/test_docs_router.py -v
```

Expected: Tests that hit guarded endpoints fail because `app.middleware.opa` does not exist yet.

- [ ] **Step 3: Create `policies/authz.rego`**

```rego
package authz

default allow = false

allow if input.role == "owner"
allow if {
	input.role == "editor"
	input.action in {"read", "write"}
}
allow if {
	input.role == "viewer"
	input.action == "read"
}
```

- [ ] **Step 4: Create `apps/backend/app/middleware/opa.py`**

```python
import os

import httpx
from fastapi import HTTPException

OPA_URL = os.environ.get("OPA_URL", "http://opa:8181")


async def authorize(role: str | None, action: str) -> None:
    if not role:
        raise HTTPException(status_code=403)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{OPA_URL}/v1/data/authz/allow",
            json={"input": {"role": role, "action": action}},
            timeout=5.0,
        )
        allowed = resp.json().get("result", False)
    if not allowed:
        raise HTTPException(status_code=403)
```

- [ ] **Step 5: Wire `authorize` into `apps/backend/app/routers/docs.py`**

Replace the inline role checks with `authorize` calls. The full updated router:

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import docs as db
from app.db import users as users_db
from app.middleware.auth import current_user
from app.middleware.opa import authorize
from app.models.user import User

router = APIRouter(prefix="/api/v1/content/docs")


class CreateDocRequest(BaseModel):
    title: str = "Untitled"


class UpdateDocRequest(BaseModel):
    title: str | None = None
    content: str | None = None


class AddCollaboratorRequest(BaseModel):
    email: str
    role: str


@router.post("", status_code=201)
async def create_doc(body: CreateDocRequest, user: User = Depends(current_user)):
    doc_id = await db.create_doc(user.id, body.title)
    return {"id": str(doc_id)}


@router.get("")
async def list_docs(user: User = Depends(current_user)):
    rows = await db.list_docs(user.id)
    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "updated_at": r["updated_at"].isoformat(),
            "owner_id": r["owner_id"],
            "role": r["role"],
        }
        for r in rows
    ]


@router.get("/{doc_id}")
async def get_doc(doc_id: uuid.UUID, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "read")
    doc = await db.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404)
    collaborators = await db.list_collaborators(doc_id)
    return {
        "id": str(doc["id"]),
        "title": doc["title"],
        "content": doc["content"],
        "owner_id": doc["owner_id"],
        "updated_at": doc["updated_at"].isoformat(),
        "role": role,
        "collaborators": [
            {
                "user_id": c["user_id"],
                "role": c["role"],
                "display_name": c["display_name"],
                "email": c["email"],
            }
            for c in collaborators
        ],
    }


@router.patch("/{doc_id}", status_code=204)
async def update_doc(doc_id: uuid.UUID, body: UpdateDocRequest, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "write")
    await db.update_doc(doc_id, body.title, body.content)


@router.delete("/{doc_id}", status_code=204)
async def delete_doc(doc_id: uuid.UUID, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "delete")
    await db.delete_doc(doc_id)


@router.post("/{doc_id}/collaborators", status_code=201)
async def add_collaborator(
    doc_id: uuid.UUID, body: AddCollaboratorRequest, user: User = Depends(current_user)
):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "delete")
    if body.role not in ("editor", "viewer"):
        raise HTTPException(status_code=422, detail="role must be 'editor' or 'viewer'")
    target = await users_db.get_user_by_email(body.email)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["id"] == user.id:
        raise HTTPException(status_code=422, detail="Cannot add owner as collaborator")
    await db.add_collaborator(doc_id, target["id"], body.role)


@router.delete("/{doc_id}/collaborators/{collab_user_id}", status_code=204)
async def remove_collaborator(
    doc_id: uuid.UUID, collab_user_id: str, user: User = Depends(current_user)
):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "delete")
    await db.remove_collaborator(doc_id, collab_user_id)
```

- [ ] **Step 6: Run tests — expect pass**

```bash
cd apps/backend && pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add policies/authz.rego apps/backend/app/middleware/opa.py apps/backend/app/routers/docs.py apps/backend/tests/test_docs_router.py
git commit -m "add OPA doc authz policy and wire into docs router"
```

---

## Task 7: Replace DB Schema

**Files:**
- Modify: `apps/backend/app/migrations/init.sql`

No unit tests for SQL migrations. The schema is verified by spinning up the stack.

- [ ] **Step 1: Rewrite `apps/backend/app/migrations/init.sql`**

```sql
CREATE DATABASE app;

\c app

CREATE TABLE IF NOT EXISTS orgs (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL DEFAULT '',
    org_id        TEXT NOT NULL REFERENCES orgs(id),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT NOT NULL REFERENCES users(id),
    title      TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS docs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id   TEXT NOT NULL REFERENCES users(id),
    title      TEXT NOT NULL DEFAULT 'Untitled',
    content    TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doc_collaborators (
    doc_id  UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    role    TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    PRIMARY KEY (doc_id, user_id)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER docs_updated_at
BEFORE UPDATE ON docs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS docs_owner_id_idx ON docs(owner_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_org_id_idx ON users(org_id);
```

- [ ] **Step 2: Run full test suite to confirm nothing broke**

```bash
cd apps/backend && pytest tests/ -v
```

Expected: All tests pass (they mock DB calls, so schema changes don't affect unit tests).

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/migrations/init.sql
git commit -m "replace Zitadel schema with orgs and users tables"
```

---

## Task 8: Remove Zitadel and Traefik Directories

**Files:**
- Delete: `apps/zitadel-init/`
- Delete: `docker-proxy/`
- Delete: `traefik/`

- [ ] **Step 1: Delete the directories**

```bash
rm -rf apps/zitadel-init docker-proxy traefik
```

- [ ] **Step 2: Commit**

```bash
git add -A apps/zitadel-init docker-proxy traefik
git commit -m "remove Zitadel and Traefik service directories"
```

---

## Task 9: Remove NextAuth from Frontend

**Files:**
- Modify: `apps/web/package.json` (uninstall packages)
- Delete: `apps/web/src/lib/auth.ts`
- Delete: `apps/web/src/types/next-auth.d.ts`
- Delete: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Delete: `apps/web/src/app/api/org/route.ts`
- Modify: `apps/web/src/app/api/backend/[...path]/route.ts`
- Modify: `apps/web/src/proxy.ts`
- Modify: `apps/web/src/app/providers.tsx`

- [ ] **Step 1: Uninstall NextAuth and related packages**

```bash
cd apps/web && npm uninstall next-auth pg @types/pg jwt-decode
```

- [ ] **Step 2: Delete NextAuth files**

```bash
rm apps/web/src/lib/auth.ts
rm apps/web/src/types/next-auth.d.ts
rm -rf apps/web/src/app/api/auth
rm apps/web/src/app/api/org/route.ts
rmdir apps/web/src/app/api/org
```

- [ ] **Step 3: Rewrite the backend proxy**

`apps/web/src/app/api/backend/[...path]/route.ts`:

```typescript
import type { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8742";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = `${BACKEND}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : null;

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: body && body.byteLength > 0 ? body : null,
  });

  const responseHeaders = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/json",
  });

  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) responseHeaders.set("set-cookie", setCookie);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
```

- [ ] **Step 4: Rewrite Next.js middleware**

`apps/web/src/proxy.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (!req.cookies.get("token")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)",
  ],
};
```

- [ ] **Step 5: Remove `SessionProvider` from providers**

`apps/web/src/app/providers.tsx`:

```typescript
"use client";

import { useState, useMemo, createContext, useContext } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { lightTheme, darkTheme } from "@/theme";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);
  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeContext.Provider value={{ isDark, toggleTheme }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeContext.Provider>
    </AppRouterCacheProvider>
  );
}
```

- [ ] **Step 6: Verify the frontend builds without type errors**

```bash
cd apps/web && npm run lint
```

Expected: No errors related to `next-auth` imports.

- [ ] **Step 7: Commit**

```bash
cd /path/to/repo/root
git add apps/web/package.json apps/web/package-lock.json \
  apps/web/src/app/api/backend apps/web/src/proxy.ts \
  apps/web/src/app/providers.tsx
git add -A apps/web/src/lib/auth.ts apps/web/src/types/next-auth.d.ts \
  apps/web/src/app/api/auth apps/web/src/app/api/org
git commit -m "remove NextAuth: update proxy, middleware, providers"
```

---

## Task 10: Update Auth Pages and API Paths

**Files:**
- Modify: `apps/web/src/app/(auth)/login/page.tsx`
- Modify: `apps/web/src/app/(auth)/signup/page.tsx`
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Rewrite the login page**

`apps/web/src/app/(auth)/login/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/backend/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.detail ?? "Invalid credentials");
      setLoading(false);
      return;
    }
    window.location.href = "/";
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px", fontSize: "0.9rem" },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: "20px",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? "0 8px 40px rgba(0,0,0,0.4)"
              : "0 8px 40px rgba(0,0,0,0.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(30,58,138,0.35)",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "white", fontSize: 18 }} />
          </Box>
          <Typography fontWeight={800} fontSize="1.1rem" letterSpacing="-0.02em">
            Lumen
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to your workspace
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}

        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            endIcon={loading ? undefined : <ArrowForwardIcon />}
            disabled={loading}
            sx={{
              py: 1.5,
              mt: 1,
              fontSize: "0.95rem",
              fontWeight: 700,
              borderRadius: "14px",
              boxShadow: "0 4px 20px rgba(30,58,138,0.3)",
              "&:hover:not(:disabled)": {
                boxShadow: "0 6px 24px rgba(30,58,138,0.4)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Sign in"}
          </Button>
        </Stack>

        <Box sx={{ mt: 4, pt: 4, borderTop: 1, borderColor: "divider", textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don&apos;t have an account?{" "}
            <Box
              component="a"
              href="/signup"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Create workspace
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Update the signup page**

In `apps/web/src/app/(auth)/signup/page.tsx`, the `handleSubmit` function currently calls `/api/org`. Replace it:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  const res = await fetch("/api/backend/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const data = await res.json();
  if (!res.ok) {
    setError(data.detail ?? "Something went wrong");
    setLoading(false);
    return;
  }
  window.location.href = "/";
};
```

Also remove the `signIn` import from `next-auth/react` at the top of the file since it is no longer used.

- [ ] **Step 3: Update all API paths in `apps/web/src/lib/api.ts`**

Change every path string from `/api/` to `/api/v1/`:

```typescript
// Research
`${API_BASE}/api/v1/research`
`${API_BASE}/api/v1/research/stream`

// Sessions
`${API_BASE}/api/v1/sessions`
`${API_BASE}/api/v1/sessions/${id}`

// Docs
`${API_BASE}/api/v1/content/docs`
`${API_BASE}/api/v1/content/docs/${id}`
`${API_BASE}/api/v1/content/docs/${docId}/collaborators`
`${API_BASE}/api/v1/content/docs/${docId}/collaborators/${userId}`

// Users
`${API_BASE}/api/v1/users/search?email=${encodeURIComponent(email)}`
```

- [ ] **Step 4: Lint**

```bash
cd apps/web && npm run lint
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(auth\)/login/page.tsx apps/web/src/app/\(auth\)/signup/page.tsx apps/web/src/lib/api.ts
git commit -m "replace NextAuth login/signup with backend auth calls"
```

---

## Task 11: `useCurrentUser` Hook and Header Sign-out

**Files:**
- Create: `apps/web/src/hooks/useCurrentUser.ts`
- Modify: `apps/web/src/components/layout/Header.tsx`

- [ ] **Step 1: Create `apps/web/src/hooks/useCurrentUser.ts`**

```typescript
import { useEffect, useState } from "react";

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  org_id: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/backend/api/v1/auth/me")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {});
  }, []);

  return user;
}
```

- [ ] **Step 2: Update `apps/web/src/components/layout/Header.tsx`**

Replace the `signOut` import and usage:

```typescript
// Remove this import:
// import { signOut } from "next-auth/react";

// Add this handler inside the Header component:
const handleSignOut = async () => {
  await fetch("/api/backend/api/v1/auth/logout", { method: "POST" });
  window.location.href = "/login";
};
```

Change the sign-out button `onClick`:
```typescript
// Change:
onClick={() => signOut({ callbackUrl: "/login" })}

// To:
onClick={handleSignOut}
```

- [ ] **Step 3: Lint**

```bash
cd apps/web && npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/useCurrentUser.ts apps/web/src/components/layout/Header.tsx
git commit -m "add useCurrentUser hook, update Header sign-out"
```

---

## Task 12: Update Env and Docker Config

**Files:**
- Modify: `.env.example`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Rewrite `.env.example`**

```bash
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
GITHUB_TOKEN=

POSTGRES_PASSWORD=changeme_in_production
SECRET_KEY=generate-with-openssl-rand-base64-32
```

Generate a `SECRET_KEY`:
```bash
openssl rand -base64 32
```

- [ ] **Step 2: Update `docker-compose.yml`**

Remove services `zitadel`, `zitadel-init`, `traefik`, `docker-proxy` (already done in Task 8 — dirs deleted, but compose still references them if not yet updated).

Full updated file:

```yaml
services:
  postgres:
    image: postgres:18.3-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./apps/backend/app/migrations/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5434:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  opa:
    image: openpolicyagent/opa:latest-debug
    command: run --server --addr :8181 /policies
    volumes:
      - ./policies:/policies
    ports:
      - "8181:8181"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8181/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  research-api:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    expose:
      - "8742"
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/app
      - OPA_URL=http://opa:8181
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - ./apps/backend/app:/app/app
      - ./apps/backend/tests:/app/tests
    command: uvicorn app.main:app --host 0.0.0.0 --port 8742 --reload
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8742/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    depends_on:
      postgres:
        condition: service_healthy
      opa:
        condition: service_healthy
    restart: unless-stopped

  web:
    image: node:24-alpine
    working_dir: /app
    ports:
      - "80:3847"
    volumes:
      - ./apps/web:/app
      - /app/node_modules
    command: sh -c "npm install && npm run dev"
    environment:
      - BACKEND_URL=http://research-api:8742
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3847/ || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 60s
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

- [ ] **Step 3: Commit**

```bash
git add .env.example docker-compose.yml
git commit -m "update env and docker config"
```

---

## End-to-End Verification

After all 12 commits, verify the full stack:

```bash
cp .env.example .env
# Fill in DEEPSEEK_API_KEY, POSTGRES_PASSWORD, and SECRET_KEY
docker compose down -v && docker compose up --build
```

1. Visit `http://localhost/signup` — create an org + user
2. You should be redirected to `/docs` or `/` (logged in)
3. Visit `http://localhost/login` with the credentials — should work
4. Create a doc, edit it, save it
5. Click sign out — cookie cleared, redirected to `/login`
6. Verify OPA revocation: `curl http://localhost:8181/v1/data/revoked_tokens` — should show the jti
7. Verify authz: `curl -s http://localhost:8181/v1/data/authz/allow -d '{"input":{"role":"viewer","action":"write"}}' | python3 -m json.tool` — should show `{"result": false}`
