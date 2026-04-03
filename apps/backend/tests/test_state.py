from app.state import ResearchState


def test_research_state_has_required_keys():
    state: ResearchState = {
        "query": "test query",
        "sub_tasks": [],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "messages": [],
        "next_agent": "",
    }
    assert state["query"] == "test query"
