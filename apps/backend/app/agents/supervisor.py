from typing import Literal

from langgraph.graph import END
from langgraph.types import Command


def supervisor_node(
    state: dict,
) -> Command[Literal["planner", "researcher", "coder", "writer", "__end__"]]:
    done = set(state.get("completed_agents", []))

    if "planner" not in done:
        return Command(goto="planner", update={"next_agent": "planner"})

    if "researcher" not in done:
        return Command(goto="researcher", update={"next_agent": "researcher"})

    if "coder" not in done:
        return Command(goto="coder", update={"next_agent": "coder"})

    if "writer" not in done:
        return Command(goto="writer", update={"next_agent": "writer"})

    return Command(goto=END, update={"next_agent": "done"})
