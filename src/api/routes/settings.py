"""Settings endpoint routes for LLM configuration."""

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.config import get_settings

router = APIRouter(prefix="/settings", tags=["Settings"])


class LLMConfig(BaseModel):
    """LLM configuration response."""
    model: str
    base_url: str
    enabled: bool
    timeout: float


class LLMModelUpdate(BaseModel):
    """Request to update LLM model."""
    model: str


class AvailableModelsResponse(BaseModel):
    """Response listing available Ollama models."""
    models: list[str]
    current_model: str


# Store for runtime model override (not persisted across restarts)
_runtime_model_override: str | None = None


def get_current_model() -> str:
    """Get the current LLM model, respecting runtime override."""
    global _runtime_model_override
    if _runtime_model_override:
        return _runtime_model_override
    return get_settings().ollama_model


def set_runtime_model(model: str) -> None:
    """Set a runtime model override."""
    global _runtime_model_override
    _runtime_model_override = model


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
        model=get_current_model(),
        base_url=settings.ollama_base_url,
        enabled=settings.llm_enabled,
        timeout=settings.llm_timeout,
    )


@router.put(
    "/llm/model",
    response_model=LLMConfig,
    summary="Update LLM model",
    description="Change the LLM model used for interventions and chat.",
)
async def update_llm_model(request: LLMModelUpdate):
    """Update the LLM model.

    Note: This is a runtime change and won't persist across server restarts.
    For permanent changes, update the .env file or OLLAMA_MODEL environment variable.
    """
    settings = get_settings()

    # Verify the model exists in Ollama
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
            response.raise_for_status()
            data = response.json()

            models = data.get("models", [])
            model_names = [m.get("name", "") for m in models]

            # Check if model exists (with or without tag)
            model_base = request.model.split(":")[0]
            found = False
            for name in model_names:
                if name == request.model or name.startswith(model_base):
                    found = True
                    break

            if not found:
                raise HTTPException(
                    status_code=400,
                    detail=f"Model '{request.model}' not found. Available models: {model_names}"
                )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Make sure it's running."
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama error: {e.response.text}"
        )

    # Set runtime override
    set_runtime_model(request.model)

    return LLMConfig(
        model=get_current_model(),
        base_url=settings.ollama_base_url,
        enabled=settings.llm_enabled,
        timeout=settings.llm_timeout,
    )


@router.get(
    "/llm/models",
    response_model=AvailableModelsResponse,
    summary="List available models",
    description="List all models available in Ollama.",
)
async def list_available_models():
    """List all available Ollama models."""
    settings = get_settings()

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
            response.raise_for_status()
            data = response.json()

            models = data.get("models", [])
            model_names = [m.get("name", "") for m in models]

            return AvailableModelsResponse(
                models=model_names,
                current_model=get_current_model(),
            )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Make sure it's running."
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error fetching models: {str(e)}"
        )
