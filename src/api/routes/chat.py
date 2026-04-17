"""
Chat endpoint routes for AI assistant functionality.

This module provides REST API endpoints for the AI chat assistant feature.
It handles:
    - Chat message processing with LLM integration
    - Session management for conversation continuity
    - Rate limiting to prevent abuse
    - Input validation and prompt injection detection

Endpoints:
    POST /chat           - Send a message and receive AI response
    GET  /chat/status    - Check if AI assistant is available
    POST /chat/session   - Create a new chat session
    GET  /chat/history/{id}    - Get chat history for a session
    DELETE /chat/history/{id}  - Clear chat history for a session
    GET  /chat/stats     - Get chat store statistics (admin)

Security Features:
    - Rate limiting: 20 requests per minute per session
    - Prompt injection detection with logging
    - Input sanitization before LLM processing

Usage:
    # In FastAPI app
    from src.api.routes.chat import router
    app.include_router(router, prefix="/api/v1")
"""

import logging

from fastapi import APIRouter, HTTPException

from src.api.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ChatMessage,
    ChatStoreStats,
)
from src.agent.llm_client import get_llm_client
from src.agent.prompts import (
    CHAT_SYSTEM_PROMPT,
    create_chat_prompt,
    detect_injection_attempt,
    sanitize_input,
)
from src.services.chat_store import get_chat_store
from src.etl.loader import get_data_loader
from src.models.predictor import get_predictor
from src.models.explainer import get_explainer

# Configure logger for this module
logger = logging.getLogger(__name__)

# Create router with prefix and tags for OpenAPI documentation
router = APIRouter(prefix="/chat", tags=["Chat"])


# =============================================================================
# MAIN CHAT ENDPOINT
# =============================================================================

@router.post(
    "",
    response_model=ChatResponse,
    summary="Chat with AI assistant",
    description="Send a message to the AI assistant for help with student support questions.",
)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Process a chat message and return an AI-generated response.

    This is the main endpoint for the chat feature. It handles the complete
    request lifecycle:
        1. Session management - get existing or create new session
        2. Rate limiting - prevent abuse (20 req/min per session)
        3. Input validation - sanitize and check for injection attempts
        4. LLM processing - generate response with conversation context
        5. Storage - save messages for future context

    Args:
        request: ChatRequest containing:
            - message: The user's question (required, 1-2000 chars)
            - context: Optional context about a specific student
            - session_id: Optional session ID for conversation continuity

    Returns:
        ChatResponse containing:
            - response: The AI assistant's response text
            - llm_available: Whether the LLM was used (True if Ollama running)
            - session_id: Session ID for future requests
            - flagged: Whether the input was flagged as suspicious
            - flag_reason: Reason for flagging (if applicable)

    Rate Limiting:
        Maximum 20 requests per minute per session. If exceeded, returns
        a rate limit message instead of processing the request.

    Injection Detection:
        Suspicious inputs matching known injection patterns are flagged
        and logged but still processed (to avoid blocking legitimate requests).
    """
    # Get singleton instances for session storage and LLM client
    chat_store = get_chat_store()
    llm_client = get_llm_client()

    # -------------------------------------------------------------------------
    # STEP 1: SESSION MANAGEMENT
    # Get existing session or create new one for conversation continuity
    # -------------------------------------------------------------------------
    session_id, session = chat_store.get_or_create_session(request.session_id)

    # -------------------------------------------------------------------------
    # STEP 2: RATE LIMITING
    # Prevent abuse by limiting requests per session (20/min default)
    # -------------------------------------------------------------------------
    is_allowed, rate_message = chat_store.check_rate_limit(session_id)
    if not is_allowed:
        # Return rate limit message without processing the request
        return ChatResponse(
            response=rate_message,
            llm_available=True,
            session_id=session_id,
            flagged=True,
            flag_reason="rate_limit"
        )

    # Record this request for rate limiting tracking
    chat_store.record_request(session_id)

    # -------------------------------------------------------------------------
    # STEP 2.5: FETCH STUDENT DATA IF STUDENT_ID PROVIDED
    # Automatically load student context from uploaded data
    # -------------------------------------------------------------------------
    student_context = ""
    if request.student_id:
        loader = get_data_loader()
        predictor = get_predictor()

        if loader.is_loaded:
            student = loader.get_student(request.student_id)
            if student:
                # Get prediction for the student
                risk_probability = None
                risk_level = None
                shap_context = ""
                try:
                    if predictor.is_loaded:
                        prediction = predictor.predict(student)
                        risk_probability = prediction.get("risk_probability")   # correct key
                        risk_level = prediction.get("risk_level", "unknown")

                        # Get SHAP factors so the AI understands WHY the student is at risk
                        explainer = get_explainer()
                        if explainer.is_loaded:
                            features_df = predictor._prepare_features(student)
                            shap_factors = explainer.explain(features_df)
                            total_abs = sum(abs(f["impact"]) for f in shap_factors)
                            lines = []
                            for f in shap_factors[:4]:
                                pct = round(abs(f["impact"]) / total_abs * 100) if total_abs > 0 else 0
                                arrow = "↑ raises risk" if f["impact"] > 0 else "↓ lowers risk"
                                lines.append(f"  • {f['feature']}: {arrow} ({pct}% of model explanation)")
                            shap_context = "\n- Top Risk Drivers (model explanation):\n" + "\n".join(lines)
                except Exception as e:
                    logger.warning(f"Failed to get prediction for student {request.student_id}: {e}")

                # Build comprehensive student context including demographics and SHAP
                student_name = student.get('name') or request.student_id
                disability = student.get('disability', 'N/A')
                disability_display = 'Yes' if disability == 'Y' else 'No' if disability == 'N' else disability
                student_context = f"""
## STUDENT DATA
- Name: {student_name} (ID: {request.student_id})
- Risk Score: {f'{risk_probability:.0%}' if risk_probability is not None else 'Not calculated'} ({risk_level or 'unknown'} risk)
- Completion Rate: {f"{student.get('completion_rate', 0):.0%}" if student.get('completion_rate') is not None else 'N/A'}
- Average Assessment Score: {student.get('avg_score', 'N/A')}/100
- VLE Engagement: {student.get('total_clicks', 'N/A')} clicks
- Credits Studied: {student.get('studied_credits', 'N/A')}
- Previous Attempts: {student.get('num_of_prev_attempts', 'N/A')}
- Module: {student.get('code_module', 'N/A')}
- Education Level: {student.get('highest_education', 'N/A')}
- Age Band: {student.get('age_band', 'N/A')}
- Gender: {student.get('gender', 'N/A')}
- Region: {student.get('region', 'N/A')}
- IMD Band (deprivation): {student.get('imd_band', 'N/A')}
- Disability: {disability_display}{shap_context}
"""
            else:
                student_context = f"\n[Note: Student ID {request.student_id} not found in uploaded data]\n"

    # Merge student context with any additional context provided
    full_context = student_context
    if request.context:
        full_context += f"\n{request.context}"

    # -------------------------------------------------------------------------
    # STEP 3: INPUT VALIDATION & SECURITY
    # Sanitize input and detect potential injection attempts
    # -------------------------------------------------------------------------
    sanitized_message = sanitize_input(request.message)

    # Check for prompt injection patterns (instruction override, role manipulation, etc.)
    is_suspicious, pattern = detect_injection_attempt(sanitized_message)
    if is_suspicious:
        # Log the attempt but don't block (false positives are possible)
        # The response will be flagged so admins can review if needed
        logger.warning(
            f"Potential injection attempt detected in session {session_id}: pattern={pattern}"
        )

    # -------------------------------------------------------------------------
    # STEP 4: LLM AVAILABILITY CHECK
    # Verify Ollama is running before attempting to generate response
    # -------------------------------------------------------------------------
    is_available = await llm_client.is_available()
    if not is_available:
        return ChatResponse(
            response="AI assistant unavailable. Please check LLM configuration (OpenAI API key or Ollama service).",
            llm_available=False,
            session_id=session_id,
            flagged=is_suspicious,
            flag_reason="injection_pattern" if is_suspicious else None
        )

    # -------------------------------------------------------------------------
    # STEP 5: BUILD PROMPT WITH CONVERSATION CONTEXT
    # Include recent messages for multi-turn conversation coherence
    # -------------------------------------------------------------------------
    conversation_history = chat_store.get_conversation_context(session_id, max_messages=10)

    # Create the prompt using the appropriate template
    # Use full_context which includes student data if available
    prompt = create_chat_prompt(
        message=sanitized_message,
        context=full_context if full_context.strip() else request.context,
        conversation_history=conversation_history
    )

    # -------------------------------------------------------------------------
    # STEP 6: GENERATE LLM RESPONSE
    # Send prompt to Ollama and get response
    # -------------------------------------------------------------------------
    response = await llm_client.generate(
        prompt=prompt,
        system_prompt=CHAT_SYSTEM_PROMPT
    )

    # Handle LLM errors gracefully
    if response is None:
        return ChatResponse(
            response="I encountered an error processing your request. Please try again.",
            llm_available=True,
            session_id=session_id,
            flagged=is_suspicious,
            flag_reason="injection_pattern" if is_suspicious else None
        )

    # -------------------------------------------------------------------------
    # STEP 7: STORE MESSAGES FOR FUTURE CONTEXT
    # Save both user message and assistant response
    # -------------------------------------------------------------------------
    chat_store.add_message(session_id, "user", sanitized_message)
    chat_store.add_message(session_id, "assistant", response)

    return ChatResponse(
        response=response,
        llm_available=True,
        session_id=session_id,
        flagged=is_suspicious,
        flag_reason="injection_pattern" if is_suspicious else None
    )


# =============================================================================
# STATUS ENDPOINT
# =============================================================================

@router.get(
    "/status",
    summary="Check AI assistant availability",
    description="Check if the AI assistant (Ollama LLM) is available.",
)
async def chat_status() -> dict:
    """
    Check if the AI assistant is available for chat.

    Pings the Ollama service to verify it's running and the configured
    model (deepseek-r1:1.5b by default) is available.

    Returns:
        dict with:
            - available: Boolean indicating if service is ready
            - message: Human-readable status message

    Usage:
        Call this before showing the chat UI to determine if the AI
        service is available, and show appropriate messaging if not.
    """
    llm_client = get_llm_client()
    is_available = await llm_client.is_available()

    return {
        "available": is_available,
        "message": "AI assistant is ready" if is_available else "AI assistant is unavailable"
    }


# =============================================================================
# HISTORY ENDPOINTS
# =============================================================================

@router.get(
    "/history/{session_id}",
    response_model=ChatHistoryResponse,
    summary="Get chat history",
    description="Retrieve chat history for a specific session.",
)
async def get_chat_history(session_id: str) -> ChatHistoryResponse:
    """
    Retrieve the complete chat history for a session.

    Returns all messages exchanged in the session, useful for:
        - Restoring conversation display on page reload
        - Exporting conversation history
        - Debugging/auditing purposes

    Args:
        session_id: The UUID of the session to retrieve

    Returns:
        ChatHistoryResponse containing:
            - session_id: The session ID
            - messages: List of all messages with role, content, timestamp
            - message_count: Total number of messages

    Raises:
        HTTPException 404: If session not found or has expired (24h timeout)
    """
    chat_store = get_chat_store()
    session = chat_store.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired"
        )

    # Convert internal ChatMessage objects to API response schema
    messages = [
        ChatMessage(
            role=msg.role,
            content=msg.content,
            timestamp=msg.timestamp.isoformat()
        )
        for msg in session.messages
    ]

    return ChatHistoryResponse(
        session_id=session_id,
        messages=messages,
        message_count=len(messages)
    )


@router.delete(
    "/history/{session_id}",
    summary="Clear chat history",
    description="Clear chat history for a specific session.",
)
async def clear_chat_history(session_id: str) -> dict:
    """
    Clear all messages from a session but keep the session active.

    This is useful for "start over" functionality - the user can clear
    their conversation without needing to create a completely new session.
    The session ID remains valid for future messages.

    Args:
        session_id: The UUID of the session to clear

    Returns:
        dict confirming the operation with success and message fields

    Raises:
        HTTPException 404: If session not found or has expired
    """
    chat_store = get_chat_store()
    success = chat_store.clear_session(session_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired"
        )

    return {
        "success": True,
        "message": "Chat history cleared"
    }


# =============================================================================
# SESSION MANAGEMENT ENDPOINT
# =============================================================================

@router.post(
    "/session",
    summary="Create new chat session",
    description="Create a new chat session and return the session ID.",
)
async def create_session() -> dict:
    """
    Create a new chat session explicitly.

    Note: Sessions are also created automatically when sending a chat
    message without a session_id. This endpoint is useful when you want
    to initialize a session before the user sends their first message.

    Returns:
        dict with:
            - session_id: The new session's UUID
            - message: Confirmation message

    Session Lifecycle:
        - Sessions expire after 24 hours of inactivity
        - Maximum 50 messages per session (oldest are evicted)
        - Rate limited to 20 requests per minute
    """
    chat_store = get_chat_store()
    session_id = chat_store.create_session()

    return {
        "session_id": session_id,
        "message": "New session created"
    }


# =============================================================================
# ADMIN/MONITORING ENDPOINT
# =============================================================================

@router.get(
    "/stats",
    response_model=ChatStoreStats,
    summary="Get chat store statistics",
    description="Get statistics about the chat store (admin).",
)
async def get_chat_stats() -> ChatStoreStats:
    """
    Get statistics about the chat store for monitoring purposes.

    This endpoint is useful for administrators to monitor:
        - Current load (active sessions)
        - System capacity (max sessions, timeout)
        - Rate limiting configuration

    Returns:
        ChatStoreStats with:
            - total_sessions: Current number of active sessions
            - max_sessions: Maximum allowed sessions (1000)
            - session_timeout_hours: Session expiration time (24h)
            - rate_limit: Human-readable rate limit ("20 per 60s")

    Note:
        Consider adding authentication to this endpoint in production
        to prevent exposing system metrics to unauthorized users.
    """
    chat_store = get_chat_store()
    stats = chat_store.get_stats()

    return ChatStoreStats(**stats)
