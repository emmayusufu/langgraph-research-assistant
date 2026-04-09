from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.utils.token import create_token


def test_research_without_token_returns_401():
    client = TestClient(app, raise_server_exceptions=False)
    resp = client.post("/api/v1/research", json={"query": "test"})
    assert resp.status_code == 401


def test_research_with_valid_jwt_passes_auth():
    token = create_token("user123", "test@example.com", "org456", "Test User")
    mock_graph = MagicMock()
    mock_graph.ainvoke = AsyncMock(return_value={"output": "ok", "research_results": [], "code_results": []})
    with (
        patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False),
        patch("app.main.graph", mock_graph),
    ):
        client = TestClient(app, raise_server_exceptions=False)
        resp = client.post(
            "/api/v1/research",
            json={"query": "test"},
            cookies={"token": token},
        )
    assert resp.status_code == 200


def test_health_still_public():
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
