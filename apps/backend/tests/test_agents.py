from unittest.mock import MagicMock, patch

from langchain_core.messages import AIMessage

from app.agents.coder import coder_node
from app.agents.planner import planner_node
from app.agents.researcher import researcher_node
from app.agents.writer import writer_node
from app.state import ResearchState


def _mock_llm(content: str):
    llm = MagicMock()
    llm.invoke = MagicMock(return_value=AIMessage(content=content))
    return llm


def test_planner_produces_sub_tasks():
    llm = _mock_llm(
        "1. Search FastAPI WebSocket docs\n2. Find WebSocket code examples\n3. Compare WebSocket vs SSE"
    )

    state: ResearchState = {
        "query": "How does FastAPI handle WebSockets?",
        "sub_tasks": [],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "messages": [],
        "next_agent": "",
    }

    result = planner_node(state, llm)

    assert "sub_tasks" in result
    assert len(result["sub_tasks"]) > 0


def test_researcher_produces_results():
    mock_search = MagicMock()
    mock_search.invoke = MagicMock(
        return_value=[
            {
                "title": "FastAPI Docs",
                "url": "https://fastapi.tiangolo.com",
                "snippet": "FastAPI framework",
            }
        ]
    )

    state: ResearchState = {
        "query": "FastAPI WebSocket",
        "sub_tasks": ["FastAPI WebSocket documentation"],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "messages": [],
        "next_agent": "",
    }

    with patch("app.agents.researcher.search_web", mock_search):
        result = researcher_node(state)

    assert "research_results" in result
    assert len(result["research_results"]) > 0


def test_coder_produces_code_results():
    mock_github = MagicMock()
    mock_github.invoke = MagicMock(
        return_value=[
            {
                "repo": "user/repo",
                "path": "main.py",
                "url": "https://github.com/user/repo/blob/main/main.py",
                "name": "main.py",
            }
        ]
    )

    state: ResearchState = {
        "query": "FastAPI WebSocket example",
        "sub_tasks": ["FastAPI WebSocket code examples"],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "messages": [],
        "next_agent": "",
    }

    with patch("app.agents.coder.search_github_code", mock_github):
        result = coder_node(state)

    assert "code_results" in result
    assert len(result["code_results"]) > 0


def test_writer_produces_output():
    llm = _mock_llm("FastAPI supports WebSockets natively [1](https://fastapi.tiangolo.com).")

    state: ResearchState = {
        "query": "How does FastAPI handle WebSockets?",
        "sub_tasks": [],
        "research_results": [
            {
                "source_url": "https://fastapi.tiangolo.com",
                "title": "FastAPI",
                "content_summary": "WebSocket support",
                "relevance_score": 1.0,
            }
        ],
        "code_results": [
            {
                "source_url": "https://github.com/example",
                "language": "python",
                "code_snippet": "async def ws():",
                "description": "example",
            }
        ],
        "synthesis": "",
        "output": "",
        "messages": [],
        "next_agent": "",
    }

    result = writer_node(state, llm)

    assert "output" in result
    assert len(result["output"]) > 0
