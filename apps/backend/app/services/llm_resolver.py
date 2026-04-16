from fastapi import HTTPException
from langchain_openai import ChatOpenAI

from app.config import settings
from app.db import credentials


async def get_user_llm(user_id: str, org_id: str) -> ChatOpenAI:
    user_key = await credentials.get_user_key(user_id)
    if user_key:
        return _build_llm(user_key)
    org_key = await credentials.get_org_key(org_id)
    if org_key:
        return _build_llm(org_key)
    raise HTTPException(
        status_code=400,
        detail={
            "code": "no_credentials",
            "message": "Configure your DeepSeek API key in Settings.",
        },
    )


def _build_llm(api_key: str) -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.deepseek_model,
        api_key=api_key,
        base_url=settings.deepseek_base_url,
        temperature=0.3,
        streaming=True,
    )
