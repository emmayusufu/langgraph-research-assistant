# Research Assistant

Multi-agent research assistant with a private docs platform. Ask a technical question and get a cited, well-organised response in ~30 seconds. Write and collaborate on documents with the AI research panel built in.

## How It Works

A supervisor agent coordinates four specialised agents through a LangGraph state graph:

```
START → supervisor → planner → supervisor → researcher → supervisor → [coder] → supervisor → writer → END
```

1. **Supervisor** reads shared state and routes to the next agent. Skips the coder for non-code queries. Retries the researcher if results are thin.
2. **Planner** calls DeepSeek to break the query into 2–5 focused sub-tasks.
3. **Researcher** runs a DuckDuckGo search per sub-task and collects titles, URLs, and snippets.
4. **Coder** (code queries only) searches GitHub for relevant repositories and files.
5. **Writer** calls DeepSeek with all results and produces a markdown response with inline citations.

Each agent writes to shared state and adds itself to `completed_agents`. The supervisor uses this list to decide what runs next — no LLM calls wasted on routing.

### Streaming

The `/api/research/stream` endpoint uses Server-Sent Events. The frontend shows which agent is active ("Planning research…", "Searching the web…", "Writing answer…") in real time.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- DeepSeek API key ([platform.deepseek.com](https://platform.deepseek.com))

### First-time setup

```bash
cp .env.example .env
# Fill in DEEPSEEK_API_KEY at minimum
```

Start the core stack:

```bash
docker compose up --build
```

Then, in a separate terminal, run the Zitadel initialiser **once** to register the OAuth app:

```bash
docker compose --profile init up zitadel-init
```

Copy the three values it prints to your `.env`:

```
ZITADEL_CLIENT_ID=...
ZITADEL_CLIENT_SECRET=...
ZITADEL_LOGIN_CLIENT_TOKEN=...
```

Restart the web container to pick them up:

```bash
docker compose restart web
```

The app is now available at **http://localhost** (port 80 via Traefik).

> **After a volume reset** (e.g. `docker compose down -v`), repeat the `zitadel-init` step and update `.env` with the new values.

### Ports (internal)

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3847 |
| Backend (FastAPI) | 8742 |
| Zitadel | 8085 |
| Traefik (public entry) | 80 |

### Run locally (without Docker)

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
npm run dev  # http://localhost:3847
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
pytest tests/ -v
```

### Lint & Format

```bash
# Backend
cd apps/backend && ruff check . && ruff format .

# Frontend
cd apps/web && npm run lint
```

## Project Structure

```
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── agents/          # supervisor, planner, researcher, coder, writer
│   │   │   ├── db/              # asyncpg layer: sessions, docs, users
│   │   │   ├── middleware/      # auth (Zitadel JWT via Traefik headers)
│   │   │   ├── migrations/      # init.sql, 002_docs.sql
│   │   │   ├── models/          # User dataclass
│   │   │   ├── routers/         # sessions, docs, users
│   │   │   ├── tools/           # web_search, doc_reader, github_search
│   │   │   ├── graph.py         # LangGraph state graph
│   │   │   └── main.py          # FastAPI app
│   │   └── tests/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/      # login, signup pages
│   │       │   ├── auth/        # Zitadel login V2 flow
│   │       │   ├── docs/        # /docs and /docs/[id] pages
│   │       │   └── api/         # NextAuth + zitadel-session routes
│   │       ├── components/
│   │       │   ├── chat/        # ChatInput, MessageBubble, MessageList
│   │       │   ├── docs/        # DocCard, DocEditor, CollaboratorList, DocResearchPanel
│   │       │   └── layout/      # Header, ThemeToggle
│   │       ├── hooks/           # useChat, useDocs, useDoc
│   │       └── lib/             # api client, types, auth config
│   └── zitadel-init/            # One-time OAuth app registration script
├── policies/                    # OPA Rego policy (JWT revocation)
├── traefik/                     # Traefik dynamic config (JWT middleware)
├── docker-compose.yml
└── .env.example
```

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPSEEK_API_KEY` | DeepSeek API key | Yes |
| `DEEPSEEK_BASE_URL` | DeepSeek API base URL | No (default: `https://api.deepseek.com`) |
| `DEEPSEEK_MODEL` | Model name | No (default: `deepseek-chat`) |
| `GITHUB_TOKEN` | GitHub token for code search (raises rate limit from 60→5000 req/hr) | No |
| `POSTGRES_PASSWORD` | PostgreSQL password | Yes |
| `ZITADEL_MASTERKEY` | 32-char Zitadel master key | Yes |
| `ZITADEL_DOMAIN` | Public domain for Zitadel | No (default: `localhost`) |
| `ZITADEL_ADMIN_PASSWORD` | Zitadel admin console password | Yes |
| `ZITADEL_CLIENT_ID` | OAuth app client ID (from `zitadel-init`) | Yes |
| `ZITADEL_CLIENT_SECRET` | OAuth app client secret (from `zitadel-init`) | Yes |
| `ZITADEL_LOGIN_CLIENT_TOKEN` | Login client PAT (from `zitadel-init`) | Yes |
| `ZITADEL_ISSUER` | Public Zitadel URL | No (default: `http://localhost:8085`) |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret | Yes |
| `NEXTAUTH_URL` | Public app URL | No (default: `http://localhost`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth for Zitadel social login | No |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth for Zitadel social login | No |

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/research` | POST | Run research, return JSON |
| `/api/research/stream` | POST | Run research, stream SSE events |
| `/api/sessions` | GET | List chat sessions |
| `/api/sessions/:id` | GET / DELETE | Get or delete a session |
| `/api/content/docs` | GET / POST | List or create docs |
| `/api/content/docs/:id` | GET / PATCH / DELETE | Get, update, or delete a doc |
| `/api/content/docs/:id/collaborators` | GET / POST | List or add collaborators |
| `/api/content/docs/:id/collaborators/:userId` | DELETE | Remove a collaborator |
| `/api/users/search?email=` | GET | Look up a user by email |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | DeepSeek (OpenAI-compatible API) |
| Agent orchestration | LangGraph |
| Backend | Python 3.11+, FastAPI, asyncpg, SSE streaming |
| Frontend | Next.js 16, Material UI 7, TypeScript |
| Auth | Zitadel (OIDC), NextAuth.js, Traefik JWT middleware, OPA |
| Database | PostgreSQL |
| Web search | DuckDuckGo (no API key) |
| Code search | GitHub REST API |
| Monorepo | Turborepo |
| Containers | Docker, Docker Compose |

## License

MIT
