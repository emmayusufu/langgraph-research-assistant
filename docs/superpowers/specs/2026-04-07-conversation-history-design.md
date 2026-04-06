# Conversation History Design

**Date:** 2026-04-07

## Problem

All chat state is in-memory. A page refresh wipes every message. Users have no way to revisit past research.

## Scope

- Persist sessions and messages to PostgreSQL
- List past sessions in a collapsible sidebar
- Load a past session's messages into the chat view
- Delete sessions

## Data Model

```sql
CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL REFERENCES user_profiles(zitadel_user_id),
    title       TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

- `sessions.title` is set from the first query, truncated to 80 chars
- `sessions.updated_at` is bumped when the assistant message is saved
- Sessions are sorted by `updated_at DESC` in the sidebar
- Deleting a session cascades to its messages

## Architecture

### Save Strategy

Session and user message are created immediately when the query is sent (before streaming begins). The assistant message is written once the stream completes. The `done` SSE event includes `session_id` so the frontend can refresh its session list.

This means: the query is always persisted even if the browser closes mid-stream. The stream itself has no DB writes inside the loop.

### Backend File Layout

```
app/
  db/
    pool.py        ← pool init/close/acquire (moved from db.py)
    sessions.py    ← create_session, save_message, list_sessions, get_session, delete_session, bump_updated_at
  routers/
    sessions.py    ← GET /api/sessions, GET /api/sessions/{id}, DELETE /api/sessions/{id}
  main.py          ← register sessions router, update stream endpoint
```

`db.py` is replaced by `app/db/pool.py`. All imports of `app.db` update to `app.db.pool`.

### Backend Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/sessions` | List user's sessions `[{id, title, updated_at}]` ordered by `updated_at DESC` |
| GET | `/api/sessions/{id}` | Get session with messages `{id, title, messages: [{role, content, created_at}]}` |
| DELETE | `/api/sessions/{id}` | Delete session + cascade messages |

All endpoints require auth via `current_user` dependency. A user can only access their own sessions.

### Changes to `/api/research/stream`

1. Before yielding first event: `session_id = await create_session(user.id, query[:80])`
2. Save user message: `await save_message(session_id, "user", query)`
3. Collect `output` from stream events as before
4. After stream ends: `await save_message(session_id, "assistant", output)` + `await bump_updated_at(session_id)`
5. Modify `done` event: `{"type": "done", "session_id": str(session_id)}`

### Frontend File Layout

```
src/
  lib/
    api.ts          ← add fetchSessions, fetchSession, deleteSession
    types.ts        ← add Session, SessionMessage types
  hooks/
    useChat.ts      ← capture session_id from done event, add loadSession(id)
    useSessions.ts  ← fetch/refresh session list, delete session
  components/
    layout/
      Header.tsx        ← add history icon button
      Sidebar.tsx       ← MUI Drawer, session list grouped by date
      SessionItem.tsx   ← session row with title, time, delete on hover
  app/
    page.tsx        ← sidebar open state, wire up Sidebar + Header
```

### Frontend Behaviour

- Sidebar opens via history icon in Header (hidden by default, `variant="temporary"` MUI Drawer)
- Sessions grouped: Today / Yesterday / Older
- Clicking a session loads its messages (read-only — no re-research)
- Deleting a session from the sidebar removes it immediately (optimistic)
- After a new research completes, session list refreshes automatically (triggered by `session_id` in `done` event)

## Error Handling

- DB errors during session creation are non-fatal — stream proceeds, session just won't be saved (log the error)
- If `GET /api/sessions/{id}` returns 404 or the session belongs to another user, return 404
- Frontend delete: on failure, re-add the session to the list

## Testing

**Backend:**
- `test_sessions.py`: create session, list sessions (own only), get session with messages, delete session, verify cascade
- `test_api.py`: update streaming test to assert `done` event includes `session_id`

**Frontend:**
- TypeScript strict mode catches type mismatches at build time
- `npx tsc --noEmit` as verification step

## Success Criteria

- Research queries are persisted and visible in the sidebar after page refresh
- Past sessions load correctly with full message history
- No `output_mode` or report references remain (already done)
- Auth enforced: users only see their own sessions
