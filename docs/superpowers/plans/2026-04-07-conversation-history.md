# Conversation History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist research sessions and messages to PostgreSQL and surface them in a collapsible history sidebar.

**Architecture:** Session is created and user message saved before streaming begins; assistant message saved on stream completion. `app/db.py` becomes `app/db/__init__.py` (zero import changes), `app/db/sessions.py` holds all session/message queries, `app/routers/sessions.py` exposes REST endpoints. Frontend adds `useSessions` hook, `Sidebar`/`SessionItem` components, and wires everything through `page.tsx`.

**Tech Stack:** Python 3.11, FastAPI, asyncpg, pytest; TypeScript, Next.js 16, MUI, React

---

## File Map

| File | Action |
|---|---|
| `apps/backend/app/migrations/init.sql` | Add `sessions` + `messages` tables |
| `apps/backend/app/db.py` → `apps/backend/app/db/__init__.py` | Rename to package (zero content changes) |
| `apps/backend/app/db/sessions.py` | Create: session/message DB query functions |
| `apps/backend/app/routers/__init__.py` | Create: empty package marker |
| `apps/backend/app/routers/sessions.py` | Create: GET/DELETE session endpoints |
| `apps/backend/app/main.py` | Register sessions router; update stream endpoint |
| `apps/backend/tests/conftest.py` | No changes needed — patches still resolve |
| `apps/backend/tests/test_sessions_db.py` | Create: unit tests for DB layer |
| `apps/backend/tests/test_sessions_router.py` | Create: endpoint tests |
| `apps/backend/tests/test_api.py` | Update stream test: mock DB, assert session_id in done |
| `apps/web/src/lib/types.ts` | Add `Session`, `SessionDetail`, `SessionMessage` |
| `apps/web/src/lib/api.ts` | Add `fetchSessions`, `fetchSession`, `deleteSession`; add `session_id` to `StreamEvent` |
| `apps/web/src/hooks/useSessions.ts` | Create: fetch/refresh/delete sessions |
| `apps/web/src/hooks/useChat.ts` | Accept `onSessionSaved` callback; add `loadSession`; capture `session_id` from done event |
| `apps/web/src/components/layout/SessionItem.tsx` | Create: single session row |
| `apps/web/src/components/layout/Sidebar.tsx` | Create: collapsible drawer with grouped session list |
| `apps/web/src/components/layout/Header.tsx` | Add history icon button + `onHistoryToggle` prop |
| `apps/web/src/app/page.tsx` | Wire sidebar state, useSessions, loadSession |

---

### Task 1: DB migration

**Files:**
- Modify: `apps/backend/app/migrations/init.sql`

- [ ] **Step 1: Add sessions and messages tables to init.sql**

Append to `apps/backend/app/migrations/init.sql`:

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT NOT NULL REFERENCES user_profiles(zitadel_user_id),
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
```

- [ ] **Step 2: Verify the SQL is valid**

```bash
cd /Users/emmanuelkimaswa/Desktop/langgraph-research-assistant && cat apps/backend/app/migrations/init.sql
```

Expected: file contains `CREATE DATABASE zitadel`, `user_profiles`, `sessions`, and `messages` tables.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/migrations/init.sql
git commit -m "add sessions and messages tables"
```

---

### Task 2: Refactor db.py + create sessions DB layer

**Files:**
- Rename: `apps/backend/app/db.py` → `apps/backend/app/db/__init__.py`
- Create: `apps/backend/app/db/sessions.py`
- Create: `apps/backend/tests/test_sessions_db.py`

- [ ] **Step 1: Write failing tests for the DB layer**

Create `apps/backend/tests/test_sessions_db.py`:

```python
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.db.sessions import (
    bump_updated_at,
    create_session,
    delete_session,
    get_session,
    list_sessions,
    save_message,
)


def make_acquire(mock_conn):
    cm = AsyncMock()
    cm.__aenter__ = AsyncMock(return_value=mock_conn)
    cm.__aexit__ = AsyncMock(return_value=False)
    return cm


@pytest.mark.asyncio
async def test_create_session_returns_uuid():
    session_id = uuid.uuid4()
    mock_conn = AsyncMock()
    mock_conn.fetchrow.return_value = {"id": session_id}

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await create_session("user123", "Test title")

    assert result == session_id


@pytest.mark.asyncio
async def test_save_message_executes_insert():
    mock_conn = AsyncMock()

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        await save_message(uuid.uuid4(), "user", "hello")

    mock_conn.execute.assert_called_once()


@pytest.mark.asyncio
async def test_list_sessions_returns_rows():
    session_id = uuid.uuid4()
    mock_conn = AsyncMock()
    mock_conn.fetch.return_value = [
        {"id": session_id, "title": "Test", "updated_at": "2026-04-07T00:00:00+00:00"}
    ]

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await list_sessions("user123")

    assert len(result) == 1
    assert result[0]["id"] == session_id


@pytest.mark.asyncio
async def test_get_session_returns_none_when_missing():
    mock_conn = AsyncMock()
    mock_conn.fetchrow.return_value = None

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await get_session(uuid.uuid4(), "user123")

    assert result is None


@pytest.mark.asyncio
async def test_delete_session_returns_true_on_success():
    mock_conn = AsyncMock()
    mock_conn.execute.return_value = "DELETE 1"

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await delete_session(uuid.uuid4(), "user123")

    assert result is True


@pytest.mark.asyncio
async def test_delete_session_returns_false_when_not_found():
    mock_conn = AsyncMock()
    mock_conn.execute.return_value = "DELETE 0"

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await delete_session(uuid.uuid4(), "user123")

    assert result is False
```

- [ ] **Step 2: Run to confirm all fail (module doesn't exist yet)**

```bash
cd apps/backend && python -m pytest tests/test_sessions_db.py -v
```

Expected: `ImportError` — `app.db.sessions` not found.

- [ ] **Step 3: Rename db.py to db/__init__.py**

```bash
cd apps/backend/app && mkdir db && mv db.py db/__init__.py
```

- [ ] **Step 4: Create app/db/sessions.py**

```python
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
```

- [ ] **Step 5: Run tests — expect all pass**

```bash
cd apps/backend && python -m pytest tests/test_sessions_db.py -v
```

Expected: 6 tests `PASSED`.

- [ ] **Step 6: Run full suite to confirm nothing broke**

```bash
cd apps/backend && python -m pytest tests/ -v
```

Expected: All previously passing tests still pass. (The rename of db.py → db/__init__.py is transparent to all existing imports.)

- [ ] **Step 7: Commit**

```bash
git add apps/backend/app/db/ apps/backend/tests/test_sessions_db.py
git commit -m "add sessions DB layer"
```

---

### Task 3: Sessions router + tests

**Files:**
- Create: `apps/backend/app/routers/__init__.py`
- Create: `apps/backend/app/routers/sessions.py`
- Create: `apps/backend/tests/test_sessions_router.py`
- Modify: `apps/backend/app/main.py`

- [ ] **Step 1: Write failing router tests**

Create `apps/backend/tests/test_sessions_router.py`:

```python
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user as real_current_user
from app.models.user import User


def make_user():
    return User(id="user123", org_id="org1", email="t@t.com")


def test_list_sessions_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    assert client.get("/api/sessions").status_code == 401


def test_list_sessions_returns_sessions():
    session_id = uuid.uuid4()
    rows = [{"id": session_id, "title": "Test query", "updated_at": datetime(2026, 4, 7, tzinfo=timezone.utc)}]

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.sessions.db.list_sessions", new_callable=AsyncMock, return_value=rows):
            response = TestClient(app).get("/api/sessions")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test query"
    assert data[0]["id"] == str(session_id)


def test_get_session_returns_404_when_missing():
    session_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.sessions.db.get_session", new_callable=AsyncMock, return_value=None):
            response = TestClient(app).get(f"/api/sessions/{session_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 404


def test_get_session_returns_session_with_messages():
    session_id = uuid.uuid4()
    ts = datetime(2026, 4, 7, tzinfo=timezone.utc)
    session_data = {
        "id": session_id,
        "title": "Test",
        "updated_at": ts,
        "messages": [{"role": "user", "content": "hello", "created_at": ts}],
    }

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.sessions.db.get_session", new_callable=AsyncMock, return_value=session_data):
            response = TestClient(app).get(f"/api/sessions/{session_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test"
    assert len(data["messages"]) == 1
    assert data["messages"][0]["role"] == "user"


def test_delete_session_returns_204():
    session_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.sessions.db.delete_session", new_callable=AsyncMock, return_value=True):
            response = TestClient(app).delete(f"/api/sessions/{session_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 204


def test_delete_session_returns_404_when_missing():
    session_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.sessions.db.delete_session", new_callable=AsyncMock, return_value=False):
            response = TestClient(app).delete(f"/api/sessions/{session_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 404
```

- [ ] **Step 2: Run to confirm all fail**

```bash
cd apps/backend && python -m pytest tests/test_sessions_router.py -v
```

Expected: `FAILED` — `/api/sessions` routes don't exist yet.

- [ ] **Step 3: Create routers package and sessions router**

```bash
touch apps/backend/app/routers/__init__.py
```

Create `apps/backend/app/routers/sessions.py`:

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.db import sessions as db
from app.middleware.auth import current_user
from app.models.user import User

router = APIRouter(prefix="/api/sessions")


@router.get("")
async def list_sessions(user: User = Depends(current_user)):
    rows = await db.list_sessions(user.id)
    return [
        {"id": str(r["id"]), "title": r["title"], "updated_at": r["updated_at"].isoformat()}
        for r in rows
    ]


@router.get("/{session_id}")
async def get_session(session_id: uuid.UUID, user: User = Depends(current_user)):
    result = await db.get_session(session_id, user.id)
    if not result:
        raise HTTPException(status_code=404)
    return {
        "id": str(result["id"]),
        "title": result["title"],
        "updated_at": result["updated_at"].isoformat(),
        "messages": [
            {
                "role": m["role"],
                "content": m["content"],
                "created_at": m["created_at"].isoformat(),
            }
            for m in result["messages"]
        ],
    }


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: uuid.UUID, user: User = Depends(current_user)):
    deleted = await db.delete_session(session_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404)
```

- [ ] **Step 4: Register router in main.py**

In `apps/backend/app/main.py`, add after the existing imports:

```python
from app.routers.sessions import router as sessions_router
```

And after `graph = build_graph()`, add:

```python
app.include_router(sessions_router)
```

Full updated `main.py`:

```python
import json
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.db import close_pool, init_pool
from app.graph import build_graph
from app.middleware.auth import attach_user, current_user
from app.models.user import User
from app.routers.sessions import router as sessions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="Research Assistant", lifespan=lifespan)

app.middleware("http")(attach_user)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()
app.include_router(sessions_router)


def _initial_state(query: str) -> dict:
    return {
        "query": query,
        "sub_tasks": [],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "messages": [HumanMessage(content=query)],
        "next_agent": "",
        "completed_agents": [],
        "needs_code": False,
        "research_sufficient": False,
    }


class ResearchRequest(BaseModel):
    query: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(request: ResearchRequest, user: User = Depends(current_user)):
    try:
        result = await graph.ainvoke(_initial_state(request.query))
        return {
            "output": result.get("output", ""),
            "research_results": result.get("research_results", []),
            "code_results": result.get("code_results", []),
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


def _serialize_message(msg):
    if hasattr(msg, "content"):
        return {"content": msg.content, "name": getattr(msg, "name", "")}
    return {}


@app.post("/api/research/stream")
async def research_stream(request: ResearchRequest, user: User = Depends(current_user)):
    async def event_generator():
        async for event in graph.astream(_initial_state(request.query), stream_mode="updates"):
            for node_name, node_output in event.items():
                serializable = {}
                for k, v in node_output.items():
                    if k == "messages":
                        serializable[k] = [_serialize_message(m) for m in v]
                    else:
                        serializable[k] = v
                yield f"data: {json.dumps({'agent': node_name, 'data': serializable})}\n\n"
        yield 'data: {"type": "done"}\n\n'

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

- [ ] **Step 5: Run router tests — expect all pass**

```bash
cd apps/backend && python -m pytest tests/test_sessions_router.py -v
```

Expected: All `PASSED`.

- [ ] **Step 6: Run full test suite**

```bash
cd apps/backend && python -m pytest tests/ -v
```

Expected: All previously passing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/app/routers/ apps/backend/app/main.py apps/backend/tests/test_sessions_router.py
git commit -m "add sessions endpoints"
```

---

### Task 4: Update streaming endpoint to save sessions

**Files:**
- Modify: `apps/backend/app/main.py`
- Modify: `apps/backend/tests/test_api.py`

- [ ] **Step 1: Update test_api.py streaming test**

Replace `apps/backend/tests/test_api.py` with:

```python
import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.middleware.auth import current_user as real_current_user
from app.models.user import User


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_research_endpoint_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post("/api/research", json={"query": "test query"})
    assert response.status_code == 401


def test_stream_endpoint_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post("/api/research/stream", json={"query": "test query"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_stream_endpoint_yields_events_and_session_id():
    async def fake_astream(state, stream_mode):
        yield {"writer": {"output": "first chunk"}}
        yield {"supervisor": {"next_agent": "done"}}

    mock_graph = MagicMock()
    mock_graph.astream = fake_astream

    mock_user = MagicMock(spec=User)
    mock_user.id = "test-user-id"

    session_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = lambda: mock_user
    try:
        with (
            patch("app.main.graph", mock_graph),
            patch("app.middleware.auth._upsert_profile", new=AsyncMock()),
            patch("app.db.sessions.create_session", new=AsyncMock(return_value=session_id)),
            patch("app.db.sessions.save_message", new=AsyncMock()),
            patch("app.db.sessions.bump_updated_at", new=AsyncMock()),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post(
                    "/api/research/stream",
                    json={"query": "test query"},
                    headers={
                        "X-User-Id": "test-user-id",
                        "X-User-Org": "org",
                        "X-User-Email": "t@t.com",
                    },
                )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    lines = [line for line in response.text.splitlines() if line.startswith("data: ")]
    events = [json.loads(line[6:]) for line in lines]
    agents = [e.get("agent") for e in events if "agent" in e]
    assert "writer" in agents
    done_event = next(e for e in events if e.get("type") == "done")
    assert done_event["session_id"] == str(session_id)
```

- [ ] **Step 2: Run to confirm streaming test fails (done event has no session_id yet)**

```bash
cd apps/backend && python -m pytest tests/test_api.py::test_stream_endpoint_yields_events_and_session_id -v
```

Expected: `FAILED` — `KeyError: 'session_id'` or assertion failure.

- [ ] **Step 3: Update research_stream in main.py**

Replace the `research_stream` function and add the sessions import. Full updated `main.py`:

```python
import json
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.db import close_pool, init_pool
from app.db import sessions as db_sessions
from app.graph import build_graph
from app.middleware.auth import attach_user, current_user
from app.models.user import User
from app.routers.sessions import router as sessions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="Research Assistant", lifespan=lifespan)

app.middleware("http")(attach_user)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()
app.include_router(sessions_router)


def _initial_state(query: str) -> dict:
    return {
        "query": query,
        "sub_tasks": [],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "messages": [HumanMessage(content=query)],
        "next_agent": "",
        "completed_agents": [],
        "needs_code": False,
        "research_sufficient": False,
    }


class ResearchRequest(BaseModel):
    query: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(request: ResearchRequest, user: User = Depends(current_user)):
    try:
        result = await graph.ainvoke(_initial_state(request.query))
        return {
            "output": result.get("output", ""),
            "research_results": result.get("research_results", []),
            "code_results": result.get("code_results", []),
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


def _serialize_message(msg):
    if hasattr(msg, "content"):
        return {"content": msg.content, "name": getattr(msg, "name", "")}
    return {}


@app.post("/api/research/stream")
async def research_stream(request: ResearchRequest, user: User = Depends(current_user)):
    async def event_generator():
        session_id = None
        try:
            session_id = await db_sessions.create_session(user.id, request.query[:80])
            await db_sessions.save_message(session_id, "user", request.query)
        except Exception:
            pass

        output = ""
        async for event in graph.astream(_initial_state(request.query), stream_mode="updates"):
            for node_name, node_output in event.items():
                serializable = {}
                for k, v in node_output.items():
                    if k == "messages":
                        serializable[k] = [_serialize_message(m) for m in v]
                    else:
                        serializable[k] = v
                if node_output.get("output"):
                    output = node_output["output"]
                yield f"data: {json.dumps({'agent': node_name, 'data': serializable})}\n\n"

        if session_id and output:
            try:
                await db_sessions.save_message(session_id, "assistant", output)
                await db_sessions.bump_updated_at(session_id)
            except Exception:
                pass

        done: dict = {"type": "done"}
        if session_id:
            done["session_id"] = str(session_id)
        yield f"data: {json.dumps(done)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

- [ ] **Step 4: Run full test suite**

```bash
cd apps/backend && python -m pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/app/main.py apps/backend/tests/test_api.py
git commit -m "save sessions on research stream completion"
```

---

### Task 5: Frontend types and API functions

**Files:**
- Modify: `apps/web/src/lib/types.ts`
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Update types.ts**

Replace `apps/web/src/lib/types.ts` with:

```typescript
export interface ResearchResult {
  source_url: string;
  title: string;
  content_summary: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  title: string;
  updated_at: string;
}

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SessionDetail extends Session {
  messages: SessionMessage[];
}
```

- [ ] **Step 2: Update api.ts**

Replace `apps/web/src/lib/api.ts` with:

```typescript
import type { Session, SessionDetail } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8742";

export async function postResearch(query: string) {
  const response = await fetch(`${API_BASE}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error(`Research request failed: ${response.statusText}`);
  }
  return response.json();
}

export interface StreamEvent {
  agent?: string;
  type?: string;
  session_id?: string;
  data?: {
    output?: string;
    research_results?: Array<{
      source_url: string;
      title: string;
      content_summary: string;
    }>;
    completed_agents?: string[];
    next_agent?: string;
  };
}

export async function streamResearch(
  query: string,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/research/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Research request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event: StreamEvent = JSON.parse(line.slice(6));
          onEvent(event);
        } catch {
          // skip malformed events
        }
      }
    }
  }
}

export async function fetchSessions(): Promise<Session[]> {
  const response = await fetch(`${API_BASE}/api/sessions`);
  if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  return response.json();
}

export async function fetchSession(id: string): Promise<SessionDetail> {
  const response = await fetch(`${API_BASE}/api/sessions/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch session: ${response.statusText}`);
  return response.json();
}

export async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/sessions/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete session: ${response.statusText}`);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/types.ts apps/web/src/lib/api.ts
git commit -m "add session types and API functions"
```

---

### Task 6: useSessions hook + useChat updates

**Files:**
- Create: `apps/web/src/hooks/useSessions.ts`
- Modify: `apps/web/src/hooks/useChat.ts`

- [ ] **Step 1: Create useSessions.ts**

Create `apps/web/src/hooks/useSessions.ts`:

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Session } from "@/lib/types";
import { fetchSessions, deleteSession as apiDeleteSession } from "@/lib/api";

interface UseSessionsReturn {
  sessions: Session[];
  refresh: () => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeSession = useCallback(
    async (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      try {
        await apiDeleteSession(id);
      } catch {
        await refresh();
      }
    },
    [refresh],
  );

  return { sessions, refresh, removeSession };
}
```

- [ ] **Step 2: Update useChat.ts**

Replace `apps/web/src/hooks/useChat.ts` with:

```typescript
"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, ResearchResult } from "@/lib/types";
import { streamResearch, fetchSession, type StreamEvent } from "@/lib/api";

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sources: ResearchResult[];
  activeAgent: string;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  loadSession: (id: string) => Promise<void>;
}

export function useChat(onSessionSaved?: () => void): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<ResearchResult[]>([]);
  const [activeAgent, setActiveAgent] = useState("");

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setActiveAgent("");

      let finalOutput = "";
      let finalSources: ResearchResult[] = [];

      try {
        await streamResearch(content, (event: StreamEvent) => {
          if (event.type === "done") {
            if (event.session_id) {
              onSessionSaved?.();
            }
            return;
          }

          if (event.agent) {
            setActiveAgent(event.agent);
          }

          if (event.data?.output) {
            finalOutput = event.data.output;
          }

          if (event.data?.research_results) {
            finalSources = [
              ...finalSources,
              ...event.data.research_results.map((r) => ({
                source_url: r.source_url,
                title: r.title,
                content_summary: r.content_summary,
                relevance_score: 1.0,
              })),
            ];
          }
        });

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: finalOutput || "No results found.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setSources(finalSources);
      } catch (error) {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setActiveAgent("");
      }
    },
    [onSessionSaved],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSources([]);
  }, []);

  const loadSession = useCallback(async (id: string) => {
    const session = await fetchSession(id);
    const loaded: ChatMessage[] = session.messages.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at),
    }));
    setMessages(loaded);
    setSources([]);
  }, []);

  return {
    messages,
    isLoading,
    sources,
    activeAgent,
    sendMessage,
    clearMessages,
    loadSession,
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/useSessions.ts apps/web/src/hooks/useChat.ts
git commit -m "add useSessions hook and session loading to useChat"
```

---

### Task 7: SessionItem and Sidebar components

**Files:**
- Create: `apps/web/src/components/layout/SessionItem.tsx`
- Create: `apps/web/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create SessionItem.tsx**

Create `apps/web/src/components/layout/SessionItem.tsx`:

```typescript
"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { Session } from "@/lib/types";

interface SessionItemProps {
  session: Session;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SessionItem({ session, onSelect, onDelete }: SessionItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <ListItem
      disablePadding
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      secondaryAction={
        hovered ? (
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        ) : undefined
      }
    >
      <ListItemButton onClick={() => onSelect(session.id)} sx={{ py: 0.75, px: 2 }}>
        <ListItemText
          primary={session.title}
          primaryTypographyProps={{ noWrap: true, fontSize: "0.8rem", fontWeight: 500 }}
        />
      </ListItemButton>
    </ListItem>
  );
}
```

- [ ] **Step 2: Create Sidebar.tsx**

Create `apps/web/src/components/layout/Sidebar.tsx`:

```typescript
"use client";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import { SessionItem } from "./SessionItem";
import type { Session } from "@/lib/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  sessions: Session[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

function groupByDate(sessions: Session[]): {
  today: Session[];
  yesterday: Session[];
  older: Session[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  return sessions.reduce(
    (acc, s) => {
      const d = new Date(s.updated_at);
      if (d >= todayStart) acc.today.push(s);
      else if (d >= yesterdayStart) acc.yesterday.push(s);
      else acc.older.push(s);
      return acc;
    },
    { today: [] as Session[], yesterday: [] as Session[], older: [] as Session[] },
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{ px: 2, py: 0.5, display: "block", color: "text.disabled", fontSize: "0.7rem" }}
    >
      {label}
    </Typography>
  );
}

export function Sidebar({
  open,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  const groups = groupByDate(sessions);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{ "& .MuiDrawer-paper": { width: 280, pt: 8 } }}
    >
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          History
        </Typography>
      </Box>

      {groups.today.length > 0 && (
        <>
          <SectionLabel label="Today" />
          <List dense disablePadding>
            {groups.today.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
              />
            ))}
          </List>
        </>
      )}

      {groups.yesterday.length > 0 && (
        <>
          <SectionLabel label="Yesterday" />
          <List dense disablePadding>
            {groups.yesterday.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
              />
            ))}
          </List>
        </>
      )}

      {groups.older.length > 0 && (
        <>
          <SectionLabel label="Older" />
          <List dense disablePadding>
            {groups.older.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
              />
            ))}
          </List>
        </>
      )}

      {sessions.length === 0 && (
        <Typography variant="body2" sx={{ px: 2, mt: 2, color: "text.disabled" }}>
          No history yet
        </Typography>
      )}
    </Drawer>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/SessionItem.tsx apps/web/src/components/layout/Sidebar.tsx
git commit -m "add Sidebar and SessionItem components"
```

---

### Task 8: Wire Header and page.tsx

**Files:**
- Modify: `apps/web/src/components/layout/Header.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Update Header.tsx**

Replace `apps/web/src/components/layout/Header.tsx` with:

```typescript
"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onClear: () => void;
  onHistoryToggle: () => void;
  activeAgent?: string;
  isLoading?: boolean;
}

const AGENT_LABELS: Record<string, string> = {
  supervisor: "Routing",
  planner: "Planning",
  researcher: "Searching",
  coder: "Finding code",
  writer: "Writing",
};

export function Header({ onClear, onHistoryToggle, activeAgent, isLoading }: HeaderProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: "flex",
        justifyContent: "center",
        pt: 1.5,
        px: 2,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          height: 44,
          pl: 1.5,
          pr: 1,
          borderRadius: "22px",
          pointerEvents: "auto",
          border: 1,
          borderColor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(19, 28, 49, 0.92)"
              : "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 4px 24px rgba(0,0,0,0.5)"
              : "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "8px",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <TravelExploreIcon
            sx={{
              color: "white",
              fontSize: 15,
              animation: isLoading ? "spin 1.5s linear infinite" : "none",
              "@keyframes spin": {
                from: { transform: "rotate(0deg)" },
                to: { transform: "rotate(360deg)" },
              },
            }}
          />
        </Box>

        <Typography
          noWrap
          sx={{ fontWeight: 700, fontSize: "0.82rem", letterSpacing: "-0.01em", color: "text.primary" }}
        >
          Research
        </Typography>

        {isLoading && activeAgent && (
          <Chip
            label={AGENT_LABELS[activeAgent] || activeAgent}
            size="small"
            sx={{
              height: 22,
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(45,212,191,0.15)"
                  : "rgba(13,148,136,0.1)",
              color: "primary.main",
              "& .MuiChip-label": { px: 1 },
            }}
          />
        )}

        <Box
          sx={{
            width: "1px",
            height: 18,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            mx: 0.25,
          }}
        />

        <Tooltip title="History" arrow>
          <IconButton
            onClick={onHistoryToggle}
            size="small"
            sx={{ width: 28, height: 28, color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            <HistoryRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear chat" arrow>
          <IconButton
            onClick={onClear}
            size="small"
            sx={{ width: 28, height: 28, color: "text.secondary", "&:hover": { color: "error.main" } }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>

        <ThemeToggle />

        <Tooltip title="Sign out" arrow>
          <IconButton
            onClick={() => signOut({ callbackUrl: "/login" })}
            size="small"
            sx={{ width: 28, height: 28, color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Update page.tsx**

Replace `apps/web/src/app/page.tsx` with:

```typescript
"use client";

import { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { useSessions } from "@/hooks/useSessions";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sessions, refresh, removeSession } = useSessions();
  const { messages, isLoading, activeAgent, sendMessage, clearMessages, loadSession } = useChat(refresh);

  const handleSelectSession = useCallback(
    async (id: string) => {
      await loadSession(id);
      setSidebarOpen(false);
    },
    [loadSession],
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Header
        onClear={clearMessages}
        onHistoryToggle={() => setSidebarOpen(true)}
        activeAgent={activeAgent}
        isLoading={isLoading}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={removeSession}
      />
      {isLoading && (
        <LinearProgress
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 1300,
            bgcolor: "transparent",
            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
          }}
        />
      )}
      <Box sx={{ height: 56 }} />
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </Box>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/Header.tsx apps/web/src/app/page.tsx
git commit -m "wire history sidebar into layout"
```

---

### Task 9: Lint and final verification

- [ ] **Step 1: Lint backend**

```bash
cd apps/backend && ruff check . && ruff format --check .
```

If errors: `ruff check --fix . && ruff format .`

- [ ] **Step 2: Lint frontend**

```bash
cd apps/web && npm run lint
```

- [ ] **Step 3: Run full backend test suite**

```bash
cd apps/backend && python -m pytest tests/ -v
```

Expected: All tests pass (except the pre-existing `test_research_with_user_headers_passes_auth` which requires a real LLM).

- [ ] **Step 4: Confirm no stale references**

```bash
grep -r "output_mode\|REPORT_PROMPT" apps/backend/app apps/web/src --include="*.py" --include="*.ts" --include="*.tsx"
```

Expected: No matches.

- [ ] **Step 5: Commit lint fixes if needed**

```bash
git add -A && git commit -m "fix lint issues"
```
