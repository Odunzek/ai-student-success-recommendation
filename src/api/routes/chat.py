"""Chat endpoint routes for AI assistant functionality."""

from fastapi import APIRouter

from src.api.schemas.chat import ChatRequest, ChatResponse
from src.agent.llm_client import get_llm_client

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "",
    response_model=ChatResponse,
    summary="Chat with AI assistant",
    description="Send a message to the AI assistant for help with student support questions.",
)
async def chat(request: ChatRequest) -> ChatResponse:
    """Chat with the AI assistant.

    The assistant can help with questions about student support,
    intervention strategies, and academic advising.

    Args:
        request: User message and optional context

    Returns:
        AI assistant response and LLM availability status
    """
    llm_client = get_llm_client()

    # Check if LLM is available
    is_available = await llm_client.is_available()

    if not is_available:
        return ChatResponse(
            response="I'm sorry, but the AI assistant is currently unavailable. "
                     "Please ensure Ollama is running with the DeepSeek model. "
                     "You can start it with: ollama run deepseek-r1:1.5b",
            llm_available=False
        )

    # Build the prompt with optional context
    user_prompt = request.message
    if request.context:
        user_prompt = f"Context: {request.context}\n\nQuestion: {request.message}"

    # Generate response
    response = await llm_client.generate(
        prompt=user_prompt,
        system_prompt=None
    )

    if response is None:
        return ChatResponse(
            response="I encountered an error while processing your request. "
                     "Please try again in a moment.",
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
