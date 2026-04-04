import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.middleware.auth import current_user as real_current_user


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_research_endpoint_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/api/research",
        json={"query": "test query"},
    )
    assert response.status_code == 401


def test_stream_endpoint_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/api/research/stream",
        json={"query": "test query"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_stream_endpoint_yields_events_as_produced():
    async def fake_astream(state, stream_mode):
        yield {"writer": {"output": "first chunk"}}
        yield {"supervisor": {"next_agent": "done"}}

    mock_graph = MagicMock()
    mock_graph.astream = fake_astream

    mock_user = MagicMock()
    mock_user.id = "test-user-id"

    app.dependency_overrides[real_current_user] = lambda: mock_user
    try:
        with (
            patch("app.main.graph", mock_graph),
            patch("app.middleware.auth._upsert_profile", new=AsyncMock()),
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
    assert any(e.get("type") == "done" for e in events)
