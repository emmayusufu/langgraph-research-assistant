from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app.services.llm_resolver import get_user_llm


@pytest.mark.asyncio
async def test_resolver_uses_user_key_when_set():
    with patch(
        "app.services.llm_resolver.credentials.get_user_key",
        AsyncMock(return_value="sk-user"),
    ), patch(
        "app.services.llm_resolver.credentials.get_org_key",
        AsyncMock(return_value="sk-org"),
    ) as mock_org:
        llm = await get_user_llm("u1", "o1")
    assert llm.openai_api_key.get_secret_value() == "sk-user"
    mock_org.assert_not_awaited()


@pytest.mark.asyncio
async def test_resolver_falls_back_to_org_key():
    with patch(
        "app.services.llm_resolver.credentials.get_user_key",
        AsyncMock(return_value=None),
    ), patch(
        "app.services.llm_resolver.credentials.get_org_key",
        AsyncMock(return_value="sk-org"),
    ):
        llm = await get_user_llm("u1", "o1")
    assert llm.openai_api_key.get_secret_value() == "sk-org"


@pytest.mark.asyncio
async def test_resolver_raises_400_when_no_keys():
    with patch(
        "app.services.llm_resolver.credentials.get_user_key",
        AsyncMock(return_value=None),
    ), patch(
        "app.services.llm_resolver.credentials.get_org_key",
        AsyncMock(return_value=None),
    ):
        with pytest.raises(HTTPException) as exc:
            await get_user_llm("u1", "o1")
    assert exc.value.status_code == 400
    assert exc.value.detail["code"] == "no_credentials"
