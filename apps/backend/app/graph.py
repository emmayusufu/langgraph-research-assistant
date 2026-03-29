from langgraph.graph import START, END, StateGraph

from app.agents.planner import planner_node
from app.agents.researcher import researcher_node
from app.agents.coder import coder_node
from app.agents.writer import writer_node
from app.state import ResearchState


def build_graph():
    builder = StateGraph(ResearchState)

    builder.add_node("planner", planner_node)
    builder.add_node("researcher", researcher_node)
    builder.add_node("coder", coder_node)
    builder.add_node("writer", writer_node)

    builder.add_edge(START, "planner")
    builder.add_edge("planner", "researcher")
    builder.add_edge("researcher", "coder")
    builder.add_edge("coder", "writer")
    builder.add_edge("writer", END)

    return builder.compile()
