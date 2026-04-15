# Lumen

A quiet workspace for thinking, researching, and writing well. Lumen is a rich-text document editor with two distinct AI systems baked in: **inline AI** for one-shot rewrites and continuations (Notion-style), and a **research panel** that runs a multi-agent web research pipeline without leaving the doc.

## Features

- **Rich-text editor** — Tiptap v3 with headings, lists, quotes, and GitHub-style code blocks with ~35 languages, language picker, copy button, and auto-detection
- **Inline AI** — select text and the bubble menu shows an Ask AI button, or type `/` and pick Ask AI from the slash menu. Streams rewrites (Improve / Shorter / Longer / Fix grammar / Change tone / Summarize) and generations (Continue writing / Write outline) in real time with Replace / Insert below / Try again / Discard
- **Research panel** — a separate `⌘K` drawer that runs a four-agent LangGraph supervisor pipeline (planner → researcher → optional coder → writer) across web search + GitHub, producing a markdown response with inline citations
- **Live metadata** — word count, read time, and save indicator update as you type, all pulled from real editor state
- **Collaboration** — share docs with other workspace members as editor or viewer, enforced by an OPA Rego policy
- **Custom auth** — email/password signup with bcrypt + JWT session cookies, no external OIDC dependency
- **Dark mode** — fully supported via MUI's CSS-variables-based `CssVarsProvider`, no flicker on navigation
- **Markdown rendering** — AI output containing `##` headings, `**bold**`, bullet lists, and inline `code` is parsed by `marked`, sanitized by DOMPurify, and inserted as real ProseMirror nodes

## Architecture

Lumen runs as a Turborepo monorepo with a Python backend and a Next.js frontend, backed by PostgreSQL and an OPA policy engine.

```
┌─────────────────────────────────────────────────────────────────┐
│                           Browser                                │
│  Next.js 16 (App Router) · React 19 · Material UI 7 · Tiptap v3 │
└─────────────────┬───────────────────────────────────────────────┘
                  │ HTTP + SSE
┌─────────────────▼───────────────────────────────────────────────┐
│                    FastAPI (port 8742)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Auth + CRUD │  │  Inline AI   │  │   Research Pipeline  │   │
│  │ docs, users, │  │  writer →    │  │ planner → researcher │   │
│  │ collabs, …   │  │  editor      │  │  → coder → writer    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                     │               │
│         └────────┬────────┴─────────────────────┘               │
│                  │                                              │
│  ┌───────────────▼────┐       ┌───────────────┐                 │
│  │  PostgreSQL (docs, │       │  OPA Rego     │                 │
│  │  users, sessions)  │       │  (authz only) │                 │
│  └────────────────────┘       └───────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### The two AI systems

They share the DeepSeek LLM client and nothing else. They're optimized for different latencies and jobs:

| | **Inline AI** | **Research panel** |
|---|---|---|
| Graph | writer → (editor) | planner → researcher → (coder) → writer |
| Latency target | <2s | 10-30s |
| Web tools | No | Yes (DuckDuckGo + GitHub) |
| Input | Selection or cursor + context | Free-form question |
| Output | Replacement string, streamed | Markdown report with citations |
| Endpoint | `POST /api/v1/ai/inline` | `POST /api/v1/research/stream` |
| State | Transient, in-memory | Persisted as a session |

### Inline AI multi-agent pipeline

```
state → writer ─► (conditional) ─► editor ─► done
        (stream tokens live)      (quality-check, optional)
```

- **Writer** — streams tokens from DeepSeek using an action-specific system prompt
- **Editor** — runs for `improve / shorter / longer / tone / summarize / custom`, skips for `grammar / continue / outline`. Checks grammar, tone adherence, meaning preservation, and length sanity. Returns a JSON verdict `{ok, issues, revised}` and emits a `revision` event only if anything changed
- **Extensibility** — v2 can add a fact-checker node with a single conditional edge on the graph

### Research supervisor pipeline

```
START → supervisor → planner → supervisor → researcher → supervisor → [coder] → supervisor → writer → END
```

The supervisor reads shared state (including `completed_agents`) and routes to the next node deterministically — no LLM calls wasted on routing. Retries the researcher once if results are thin; skips the coder for non-code queries.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- DeepSeek API key (from [platform.deepseek.com](https://platform.deepseek.com))
- GitHub token (optional, raises code search rate limit from 60 → 5000 req/hr)

### First-time setup

```bash
cp .env.example .env
# Fill in DEEPSEEK_API_KEY, POSTGRES_PASSWORD, and SECRET_KEY
docker compose up --build
```

The app is available at **http://localhost:3847**. Create an account at `/signup` or log in at `/login`.

### Environment variables

| Variable | Description | Required |
|---|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek API key | Yes |
| `DEEPSEEK_BASE_URL` | DeepSeek API base URL | No (default: `https://api.deepseek.com`) |
| `DEEPSEEK_MODEL` | Model name | No (default: `deepseek-chat`) |
| `GITHUB_TOKEN` | GitHub token for code search | No |
| `SECRET_KEY` | JWT signing secret (generate with `openssl rand -base64 32`) | Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password | Yes |
| `DATABASE_URL` | Postgres connection string | Yes |

### Ports

| Service | Port |
|---|---|
| Frontend (Next.js) | 3847 |
| Backend (FastAPI) | 8742 |
| PostgreSQL | 5434 |
| OPA | 8181 |

### Run locally without Docker

**Backend:**
```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
ENV_FILE=../../.env uvicorn app.main:app --reload --port 8742
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev
```

**Both via Turborepo:**
```bash
npm install
npm run dev
```

### Tests

```bash
cd apps/backend
source .venv/bin/activate
pytest -v
```

Frontend has a TypeScript strict mode check:

```bash
cd apps/web
npm run build
```

### Lint & format

```bash
cd apps/backend && ruff check . && ruff format .
cd apps/web && npm run lint
```

## API

All endpoints live under `/api/v1/`. Authenticated routes require a session cookie set by `/api/v1/auth/login`.

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/signup` | POST | Create workspace + user |
| `/api/v1/auth/login` | POST | Email/password login, sets session cookie |
| `/api/v1/auth/logout` | POST | Revoke session |
| `/api/v1/auth/me` | GET | Current user |
| `/api/v1/ai/inline` | POST | Inline AI SSE stream (writer + editor) |
| `/api/v1/research` | POST | Research, returns JSON |
| `/api/v1/research/stream` | POST | Research, streams SSE events per agent |
| `/api/v1/sessions` | GET | List research sessions |
| `/api/v1/sessions/:id` | GET / DELETE | Get or delete a session |
| `/api/v1/content/docs` | GET / POST | List or create docs |
| `/api/v1/content/docs/:id` | GET / PATCH / DELETE | Get, update, or delete a doc |
| `/api/v1/content/docs/:id/collaborators` | GET / POST | List or add collaborators |
| `/api/v1/content/docs/:id/collaborators/:userId` | DELETE | Remove a collaborator |
| `/api/v1/users/search?email=` | GET | Look up a user by email |

### Inline AI request shape

```json
{
  "action": "improve" | "shorter" | "longer" | "grammar" | "tone" | "summarize" | "continue" | "outline" | "custom",
  "tone": "casual",              // required when action == "tone"
  "prompt": "make this sassier", // required when action == "custom"
  "selection": "the highlighted text",
  "context": "surrounding paragraphs",
  "topic": "outline topic"       // required when action == "outline"
}
```

SSE event stream: `status` → `token` (repeated) → `draft_complete` → `status (refining)` → `revision` (if editor changes anything) → `done`.

## Project Structure

```
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── agents/
│   │   │   │   ├── inline/            # Inline AI: writer, editor, graph, prompts, state
│   │   │   │   ├── planner.py         # Research supervisor agents
│   │   │   │   ├── researcher.py
│   │   │   │   ├── coder.py
│   │   │   │   ├── writer.py
│   │   │   │   └── supervisor.py
│   │   │   ├── db/                    # asyncpg: docs, users, sessions
│   │   │   ├── middleware/            # auth (session cookie + JWT), OPA client
│   │   │   ├── migrations/            # init.sql
│   │   │   ├── models/                # User dataclass
│   │   │   ├── routers/               # ai, auth, docs, sessions, users
│   │   │   ├── tools/                 # web_search, doc_reader, github_search
│   │   │   ├── graph.py               # Research supervisor graph
│   │   │   └── main.py                # FastAPI app
│   │   └── tests/                     # pytest suite
│   └── web/
│       └── src/
│           ├── app/
│           │   ├── (auth)/            # login, signup pages
│           │   ├── api/backend/       # proxy route to FastAPI
│           │   ├── docs/[id]/         # editor page
│           │   ├── layout.tsx
│           │   ├── providers.tsx      # CssVarsProvider, emotion cache
│           │   └── globals.css        # scrollbar, autofill, syntax highlighting
│           ├── components/
│           │   ├── docs/
│           │   │   ├── ai/            # AIPanel, PresetList, PromptInput,
│           │   │   │                  # ToneSubmenu, StreamingPreview, PreviewActions
│           │   │   ├── CodeBlock.tsx  # React NodeView with language picker
│           │   │   ├── DocEditor.tsx  # Tiptap + bubble/slash menus + AI wiring
│           │   │   ├── DocSidebar.tsx
│           │   │   ├── DocResearchPanel.tsx
│           │   │   ├── CollaboratorList.tsx
│           │   │   └── ShareButton.tsx
│           │   ├── chat/              # ChatInput, MessageBubble, MessageList
│           │   ├── layout/            # Header, ThemeToggle
│           │   └── shared/            # FormInput, FormSelect
│           ├── hooks/                 # useInlineAI, useChat, useDoc, useDocs,
│           │                          # useCurrentUser, useSessions
│           └── lib/
│               ├── api.ts             # streamInlineAI, streamResearch, CRUD
│               ├── editor-context.ts  # cursor/selection context extraction
│               ├── markdown.ts        # marked + DOMPurify pipeline
│               └── types.ts
├── policies/                          # OPA Rego (authz + revocation)
├── docker-compose.yml
└── .env.example
```

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | DeepSeek (OpenAI-compatible API) |
| Agent orchestration | LangGraph (supervisor pattern for research, custom graph for inline) |
| Backend | Python 3.11+, FastAPI, asyncpg, SSE streaming |
| Frontend | Next.js 16 (App Router), React 19, Material UI 7 (`CssVarsProvider`), TypeScript strict |
| Editor | Tiptap v3 (StarterKit, Placeholder, CodeBlockLowlight, React NodeView) |
| Syntax highlighting | lowlight + highlight.js common pack, GitHub Primer color palette |
| Markdown | marked + DOMPurify |
| Auth | Custom email/password with bcrypt + JWT session cookie |
| Authorization | Open Policy Agent (Rego) |
| Database | PostgreSQL |
| Web search | DuckDuckGo (no API key) |
| Code search | GitHub REST API |
| Monorepo | Turborepo |
| Containers | Docker, Docker Compose |

## How to use the inline AI

### On selected text

1. Highlight any text in the editor
2. The bubble menu appears above the selection with an **AI** button on the left
3. Click it — the panel opens anchored to the selection
4. Pick a preset (Improve writing, Make shorter, Make longer, Fix grammar, Change tone → submenu, Summarize) or type a custom instruction in the input at the bottom
5. Watch tokens stream into the preview
6. **Replace** swaps the selection with the AI output; **Insert below** appends it as a new block; **Try again** re-runs the same request; **Discard** closes the panel

### On a blank line

1. Type `/` on an empty line to open the slash menu
2. Pick **Ask AI** from the top group
3. Choose **Continue writing** (uses the surrounding text as context to extend what you were writing) or **Write outline** (structured markdown outline with H2s and bullets) or type a custom prompt
4. **Accept** inserts the output at the cursor

Markdown in AI output is automatically parsed into real editor nodes — headings become `<h2>`, bullet lists become real list items, `**bold**` and `` `code` `` become proper marks.

## License

MIT
