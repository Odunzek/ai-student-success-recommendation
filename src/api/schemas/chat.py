"""Chat request and response schemas."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request schema for chat endpoint."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User message to send to the AI assistant"
    )
    context: str | None = Field(
        None,
        max_length=1000,
        description="Optional context about a specific student or situation"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "What intervention strategies work best for students with low engagement?",
                    "context": None
                },
                {
                    "message": "How should I approach this student?",
                    "context": "Student has 45% completion rate and declining attendance"
                }
            ]
        }
    }


class ChatResponse(BaseModel):
    """Response schema for chat endpoint."""

    response: str = Field(
        ...,
        description="AI assistant's response to the user's message"
    )
    llm_available: bool = Field(
        ...,
        description="Whether the LLM was available to generate the response"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "response": "For students with low engagement, I recommend a multi-pronged approach...",
                    "llm_available": True
                }
            ]
        }
    }
