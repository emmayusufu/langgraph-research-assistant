import operator
from typing import Annotated

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class ResearchState(TypedDict):
    query: str
    sub_tasks: list[str]
    research_results: Annotated[list[dict], operator.add]
    code_results: Annotated[list[dict], operator.add]
    synthesis: str
    output: str
    messages: Annotated[list[AnyMessage], add_messages]
    next_agent: str
    completed_agents: Annotated[list[str], operator.add]
    needs_code: bool
    research_sufficient: bool
