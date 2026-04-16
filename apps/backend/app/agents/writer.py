import json

from langchain_core.messages import AIMessage, SystemMessage

CHAT_PROMPT = """You are a technical writing assistant. Given research results and code examples, write a clear, conversational answer with inline citations.

Use [source title](url) format for citations. Be concise but thorough.

Research results:
{research_results}

Code examples:
{code_results}"""


def writer_node(state: dict, llm) -> dict:
    research_json = json.dumps(state["research_results"][:10], indent=2)
    code_json = json.dumps(state["code_results"][:10], indent=2)

    prompt = CHAT_PROMPT.format(research_results=research_json, code_results=code_json)

    response = llm.invoke(
        [
            SystemMessage(content=prompt),
            *state["messages"],
        ]
    )

    return {
        "output": response.content,
        "messages": [AIMessage(content=response.content, name="writer")],
        "completed_agents": ["writer"],
    }
