"""Chat endpoint routes for AI assistant functionality."""

from fastapi import APIRouter

from src.api.schemas.chat import ChatRequest, ChatResponse
from src.agent.llm_client import get_llm_client
from src.agent.prompts import CHAT_SYSTEM_PROMPT, create_chat_prompt

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "",
    response_model=ChatResponse,
    summary="Chat with AI assistant",
    description="Send a message to the AI assistant for help with student support questions.",
)
async def chat(request: ChatRequest) -> ChatResponse:
    """Chat with the AI assistant."""
    llm_client = get_llm_client()

    is_available = await llm_client.is_available()

    if not is_available:
        return ChatResponse(
            response="AI assistant unavailable. Start Ollama with: ollama serve",
            llm_available=False
        )

    # Build prompt using template
    prompt = create_chat_prompt(request.message, request.context)

    response = await llm_client.generate(
        prompt=prompt,
        system_prompt=CHAT_SYSTEM_PROMPT
    )

    if response is None:
        return ChatResponse(
            response="Error processing request. Please try again.",
            llm_available=True
        )

    return ChatResponse(
        response=response,
        llm_available=True
    )


@router.get(
    "/status",
    summary="Check AI assistant availability",
    description="Check if the AI assistant (Ollama LLM) is available.",
)
async def chat_status() -> dict:
    """Check if the AI assistant is available.

    Returns:
        Status indicating if the LLM is ready to respond
    """
    llm_client = get_llm_client()
    is_available = await llm_client.is_available()

    return {
        "available": is_available,
        "message": "AI assistant is ready" if is_available else "AI assistant is unavailable"
    }
