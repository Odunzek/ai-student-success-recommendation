"""Settings endpoint routes for LLM configuration."""

from fastapi import APIRouter
from pydantic import BaseModel

from src.config import get_settings

router = APIRouter(prefix="/settings", tags=["Settings"])


class LLMConfig(BaseModel):
    """LLM configuration response."""
    model: str
    base_url: str
    enabled: bool
    timeout: float


@router.get(
    "/llm",
    response_model=LLMConfig,
    summary="Get LLM configuration",
    description="Get current LLM configuration settings.",
)
async def get_llm_config():
    """Get current LLM configuration."""
    settings = get_settings()
    return LLMConfig(
        model=settings.openai_model,
        base_url=settings.openai_base_url or "https://api.openai.com/v1",
        enabled=settings.llm_enabled,
        timeout=settings.llm_timeout,
    )
