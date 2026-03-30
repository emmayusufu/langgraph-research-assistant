# Research Assistant

Multi-agent research assistant that searches the web, finds code examples, and synthesizes findings into structured answers. Ask a technical question and get a cited, well-organized response in about 30 seconds.

## How It Works

A supervisor agent coordinates four specialized agents through a LangGraph state graph:

```
START → supervisor → planner → supervisor → researcher → supervisor → [coder] → supervisor → writer → END
```

1. **Supervisor** reads the shared state and routes to the next agent that hasn't run yet. Skips the coder for non-code queries. Can retry the researcher if results are thin.
2. **Planner** calls DeepSeek to break the query into 2-5 focused, searchable sub-tasks.
3. **Researcher** runs a DuckDuckGo search for each sub-task and collects titles, URLs, and snippets.
4. **Coder** (code queries only) searches the GitHub API for relevant repositories and files.
5. **Writer** calls DeepSeek with all collected results and produces a markdown response with inline citations.

Each agent writes its results to shared state and adds itself to `completed_agents`. The supervisor uses this list to decide what runs next — no LLM calls wasted on routing.

### Smart Routing

The supervisor classifies the query at the start. If the query contains keywords like "code", "example", "implement", "api", etc., the coder agent runs. Otherwise it's skipped, saving ~10 seconds.

If the researcher returns fewer than 3 results, the supervisor sends it back for a second pass before moving on.

### Streaming

The `/api/research/stream` endpoint uses Server-Sent Events. The frontend shows which agent is currently active ("Planning research...", "Searching the web...", "Writing answer...") so you're not staring at a blank screen for 30 seconds.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- DeepSeek API key ([platform.deepseek.com](https://platform.deepseek.com))

### Run with Docker Compose

```bash
cp .env.example .env
# add your DEEPSEEK_API_KEY to .env

docker compose up --build
```

- Frontend: http://localhost:3200
- Backend API: http://localhost:8010
- Health check: http://localhost:8010/health

### Run Locally

**Backend:**
```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
ENV_FILE=../../.env uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev
```

**Both (via Turborepo):**
```bash
npm install
npx turbo dev
```

### Run Tests

```bash
cd apps/backend
source .venv/bin/activate
pytest tests/ -v
```

### Lint & Format

**Backend (ruff):**
```bash
cd apps/backend
ruff check .
ruff format .
```

**Frontend (eslint + prettier):**
```bash
cd apps/web
npm run lint
npm run format
```

## Project Structure

```
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── agents/          # supervisor, planner, researcher, coder, writer
│   │   │   ├── tools/           # web_search, doc_reader, github_search
│   │   │   ├── config.py        # env var loading
│   │   │   ├── graph.py         # LangGraph state graph definition
│   │   │   ├── main.py          # FastAPI server (REST + SSE streaming)
│   │   │   └── state.py         # shared ResearchState TypedDict
│   │   ├── tests/
│   │   ├── pyproject.toml       # ruff config
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── web/
│       ├── src/
│       │   ├── app/             # Next.js layout, page, providers
│       │   ├── components/
│       │   │   ├── chat/        # ChatInput, MessageBubble, MessageList
│       │   │   ├── layout/      # Header, Sidebar, ThemeToggle
│       │   │   └── report/      # ReportView, ReportSection, SourceList
│       │   ├── hooks/           # useChat (SSE streaming)
│       │   ├── lib/             # api client, types
│       │   └── theme.ts         # MUI light/dark themes
│       ├── Dockerfile
│       └── package.json
├── packages/
│   └── tsconfig/                # shared TypeScript config
├── docker-compose.yml
├── turbo.json
├── package.json
└── .env.example
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DEEPSEEK_API_KEY` | DeepSeek API key | (required) |
| `DEEPSEEK_BASE_URL` | DeepSeek API base URL | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | Model name | `deepseek-chat` |
| `GITHUB_TOKEN` | GitHub token for code search (optional, increases rate limit from 60 to 5000 req/hr) | |

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/research` | POST | Run research, return full result as JSON |
| `/api/research/stream` | POST | Run research, stream agent updates as SSE events |

Request body for both research endpoints:
```json
{
  "query": "What is FastAPI?",
  "output_mode": "chat"
}
```

`output_mode` is either `"chat"` (conversational with inline citations) or `"report"` (structured markdown with sections).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | DeepSeek (via OpenAI-compatible API) |
| Agent orchestration | LangGraph |
| Backend | Python 3.13, FastAPI, SSE streaming |
| Frontend | Next.js 16, Material UI 7, TypeScript |
| Web search | DuckDuckGo (free, no API key) |
| Code search | GitHub REST API |
| Monorepo | Turborepo |
| Linting | Ruff (backend), ESLint + Prettier (frontend) |
| Containers | Docker, Docker Compose |

## License

MIT
