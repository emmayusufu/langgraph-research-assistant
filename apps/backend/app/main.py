import asyncio
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.graph import build_graph

app = FastAPI(title="Research Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()


class ResearchRequest(BaseModel):
    query: str
    output_mode: Literal["chat", "report"] = "chat"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(request: ResearchRequest):
    try:
        result = await asyncio.to_thread(
            graph.invoke,
            {
                "query": request.query,
                "sub_tasks": [],
                "research_results": [],
                "code_results": [],
                "synthesis": "",
                "output": "",
                "output_mode": request.output_mode,
                "messages": [HumanMessage(content=request.query)],
                "next_agent": "",
                "completed_agents": [],
            },
        )
        return {
            "output": result.get("output", ""),
            "research_results": result.get("research_results", []),
            "code_results": result.get("code_results", []),
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
