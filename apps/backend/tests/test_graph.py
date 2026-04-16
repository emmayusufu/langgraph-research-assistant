from unittest.mock import MagicMock

from app.graph import build_graph


def _mock_llm():
    llm = MagicMock()
    llm.invoke = MagicMock(return_value=MagicMock(content=""))
    return llm


def test_graph_compiles():
    graph = build_graph(_mock_llm())
    assert graph is not None


def test_graph_has_all_nodes():
    graph = build_graph(_mock_llm())
    node_names = set(graph.get_graph().nodes.keys())
    expected = {
        "__start__",
        "__end__",
        "supervisor",
        "planner",
        "researcher",
        "coder",
        "writer",
    }
    assert expected.issubset(node_names)
