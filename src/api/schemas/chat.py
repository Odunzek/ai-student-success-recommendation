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
    session_id: str | None = Field(
        None,
        description="Optional session ID for conversation continuity. A new session will be created if not provided."
    )
    student_id: str | None = Field(
        None,
        description="Optional student ID to load student data into context automatically"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "What intervention strategies work best for students with low engagement?",
                    "context": None,
                    "session_id": None,
                    "student_id": None
                },
                {
                    "message": "How should I approach this student?",
                    "context": "Student has 45% completion rate and declining attendance",
                    "session_id": "abc123-session-id",
                    "student_id": None
                },
                {
                    "message": "What interventions would help this student?",
                    "context": None,
                    "session_id": None,
                    "student_id": "12345"
                }
            ]
        }
    }


class ChatMessage(BaseModel):
    """A single chat message."""

    role: str = Field(
        ...,
        description="Message role: 'user' or 'assistant'"
    )
    content: str = Field(
        ...,
        description="Message content"
    )
    timestamp: str | None = Field(
        None,
        description="ISO timestamp of the message"
    )


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
    session_id: str = Field(
        ...,
        description="Session ID for conversation continuity"
    )
    flagged: bool = Field(
        False,
        description="Whether the input was flagged for potential issues"
    )
    flag_reason: str | None = Field(
        None,
        description="Reason for flagging, if applicable"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "response": "For students with low engagement, I recommend a multi-pronged approach...",
                    "llm_available": True,
                    "session_id": "abc123-session-id",
                    "flagged": False,
                    "flag_reason": None
                }
            ]
        }
    }


class ChatHistoryResponse(BaseModel):
    """Response schema for chat history endpoint."""

    session_id: str = Field(
        ...,
        description="Session ID"
    )
    messages: list[ChatMessage] = Field(
        default_factory=list,
        description="List of messages in the session"
    )
    message_count: int = Field(
        ...,
        description="Total number of messages"
    )


class ChatSessionInfo(BaseModel):
    """Information about a chat session."""

    session_id: str
    message_count: int
    created_at: str
    last_activity: str


class ChatStoreStats(BaseModel):
    """Statistics about the chat store."""

    total_sessions: int
    max_sessions: int
    session_timeout_hours: int
    rate_limit: str
