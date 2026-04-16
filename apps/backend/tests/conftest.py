from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def mock_infrastructure():
    mock_graph = MagicMock()
    mock_graph.ainvoke = AsyncMock(return_value={
        "output": "test output",
        "research_results": [],
        "code_results": [],
    })
    with (
        patch("app.main.build_graph", return_value=mock_graph),
        patch("app.db.init_pool", new_callable=AsyncMock),
        patch("app.db.close_pool", new_callable=AsyncMock),
    ):
        yield
