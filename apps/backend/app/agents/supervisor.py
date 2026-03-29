from typing import Literal

from langgraph.graph import END
from langgraph.types import Command

CODE_KEYWORDS = {
    "code",
    "example",
    "implement",
    "function",
    "class",
    "library",
    "package",
    "module",
    "api",
    "sdk",
    "syntax",
    "snippet",
    "build",
    "create",
    "write",
    "program",
    "script",
    "tutorial",
    "how to",
}

MIN_RESEARCH_RESULTS = 3


def supervisor_node(
    state: dict,
) -> Command[Literal["planner", "researcher", "coder", "writer", "__end__"]]:
    done = set(state.get("completed_agents", []))
    query = state.get("query", "").lower()

    if "planner" not in done:
        needs_code = any(kw in query for kw in CODE_KEYWORDS)
        return Command(
            goto="planner",
            update={"next_agent": "planner", "needs_code": needs_code},
        )

    if "researcher" not in done:
        return Command(goto="researcher", update={"next_agent": "researcher"})

    research_count = len(state.get("research_results", []))
    if research_count < MIN_RESEARCH_RESULTS and "researcher_retry" not in done:
        return Command(
            goto="researcher",
            update={"next_agent": "researcher", "completed_agents": ["researcher_retry"]},
        )

    if state.get("needs_code") and "coder" not in done:
        return Command(goto="coder", update={"next_agent": "coder"})

    if "coder" not in done:
        return Command(
            goto="writer",
            update={"next_agent": "writer", "completed_agents": ["coder"]},
        )

    if "writer" not in done:
        return Command(goto="writer", update={"next_agent": "writer"})

    return Command(goto=END, update={"next_agent": "done"})
