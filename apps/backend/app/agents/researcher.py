from langchain_core.messages import AIMessage

from app.tools.web_search import search_web


def researcher_node(state: dict) -> dict:
    all_results = []

    for task in state["sub_tasks"][:3]:
        search_results = search_web.invoke({"query": task, "max_results": 3})
        for sr in search_results:
            all_results.append({
                "source_url": sr["url"],
                "title": sr.get("title", ""),
                "content_summary": sr.get("snippet", ""),
                "relevance_score": 1.0,
            })

    return {
        "research_results": all_results,
        "messages": [AIMessage(content=f"Found {len(all_results)} results.", name="researcher")],
    }
