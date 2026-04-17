from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user
from app.models.user import User


def _user(is_admin: bool = False):
    def _get():
        return User(id="u1", org_id="o1", email="a@b.com", name="A", is_admin=is_admin)
    return _get


def test_get_credentials_not_configured():
    app.dependency_overrides[current_user] = _user()
    try:
        empty = {"configured": False, "last_four": None, "updated_at": None}
        with patch(
            "app.routers.settings.creds_db.get_user_key_info",
            new_callable=AsyncMock,
            return_value=empty,
        ), patch(
            "app.routers.settings.creds_db.get_org_key_info",
            new_callable=AsyncMock,
            return_value=empty,
        ):
            resp = TestClient(app).get("/api/v1/settings/credentials")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["configured"] is False
    assert body["workspace"]["configured"] is False


def test_put_user_credential():
    app.dependency_overrides[current_user] = _user()
    try:
        with patch("app.routers.settings.creds_db.set_user_key", new_callable=AsyncMock) as m:
            resp = TestClient(app).put(
                "/api/v1/settings/credentials/user",
                json={"api_key": "sk-abc123"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with("u1", "sk-abc123")


def test_delete_user_credential():
    app.dependency_overrides[current_user] = _user()
    try:
        with patch("app.routers.settings.creds_db.delete_user_key", new_callable=AsyncMock) as m:
            resp = TestClient(app).delete("/api/v1/settings/credentials/user")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with("u1")


def test_put_workspace_credential_requires_admin():
    app.dependency_overrides[current_user] = _user(is_admin=False)
    try:
        resp = TestClient(app).put(
            "/api/v1/settings/credentials/workspace",
            json={"api_key": "sk-abcd1234"},
        )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 403


def test_put_workspace_credential_as_admin():
    app.dependency_overrides[current_user] = _user(is_admin=True)
    try:
        with patch("app.routers.settings.creds_db.set_org_key", new_callable=AsyncMock) as m:
            resp = TestClient(app).put(
                "/api/v1/settings/credentials/workspace",
                json={"api_key": "sk-org-1234"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with("o1", "sk-org-1234")


def test_delete_workspace_credential_requires_admin():
    app.dependency_overrides[current_user] = _user(is_admin=False)
    try:
        resp = TestClient(app).delete("/api/v1/settings/credentials/workspace")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 403


def test_delete_workspace_credential_as_admin():
    app.dependency_overrides[current_user] = _user(is_admin=True)
    try:
        with patch("app.routers.settings.creds_db.delete_org_key", new_callable=AsyncMock) as m:
            resp = TestClient(app).delete("/api/v1/settings/credentials/workspace")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with("o1")
