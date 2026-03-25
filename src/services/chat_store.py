"""
In-memory chat history storage with session management.

This module provides a singleton ChatStore that manages chat sessions for the
AI assistant feature. Sessions are stored in-memory with automatic expiration
and rate limiting to prevent abuse.

Key Features:
    - Session-based conversation history (50 messages max per session)
    - Rate limiting (20 requests per minute per session)
    - Automatic session cleanup after 24 hours of inactivity
    - Maximum 1000 concurrent sessions with LRU eviction

Usage:
    from src.services.chat_store import get_chat_store

    store = get_chat_store()
    session_id, session = store.get_or_create_session(None)
    store.add_message(session_id, "user", "Hello!")
"""

import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from collections import deque


@dataclass
class ChatMessage:
    """
    Represents a single chat message in a conversation.

    Attributes:
        role: The sender of the message - either 'user' or 'assistant'
        content: The text content of the message
        timestamp: When the message was created (defaults to now)
    """
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ChatSession:
    """
    Represents an active chat session with message history and rate limiting.

    A session tracks:
        - All messages exchanged between user and assistant
        - Timestamps of recent requests for rate limiting
        - When the session was created and last used

    Attributes:
        session_id: Unique identifier (UUID) for this session
        messages: Bounded deque of ChatMessage objects (max 50)
        created_at: When the session was first created
        last_activity: When the session was last used (for expiration)
        request_count: Total number of requests made in this session
        request_timestamps: Recent request times for rate limiting (max 100)
    """
    session_id: str
    messages: deque  # deque of ChatMessage with maxlen
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    request_count: int = 0
    request_timestamps: deque = field(default_factory=lambda: deque(maxlen=100))

    def add_message(self, role: str, content: str) -> ChatMessage:
        """
        Add a new message to the session and update last activity time.

        Args:
            role: 'user' or 'assistant'
            content: The message text

        Returns:
            The created ChatMessage object
        """
        msg = ChatMessage(role=role, content=content)
        self.messages.append(msg)
        self.last_activity = datetime.now()
        return msg

    def get_context_messages(self, max_messages: int = 10) -> list[dict]:
        """
        Get the most recent messages formatted for LLM context.

        Args:
            max_messages: Maximum number of messages to return (default 10)

        Returns:
            List of dicts with 'role' and 'content' keys for each message
        """
        recent = list(self.messages)[-max_messages:]
        return [{"role": m.role, "content": m.content} for m in recent]

    def record_request(self) -> None:
        """
        Record a request timestamp for rate limiting purposes.

        Called each time a chat request is made to track request frequency.
        The deque automatically removes old entries beyond maxlen=100.
        """
        self.request_count += 1
        self.request_timestamps.append(time.time())

    def get_requests_in_window(self, window_seconds: int = 60) -> int:
        """
        Count how many requests were made within the specified time window.

        Args:
            window_seconds: Time window in seconds (default 60 = 1 minute)

        Returns:
            Number of requests made within the window
        """
        cutoff = time.time() - window_seconds
        return sum(1 for ts in self.request_timestamps if ts > cutoff)


class ChatStore:
    """
    Singleton in-memory store for managing chat sessions.

    This class implements the Singleton pattern to ensure only one instance
    exists across the application. It handles:
        - Creating and retrieving chat sessions
        - Rate limiting requests per session
        - Automatic cleanup of expired sessions
        - Capacity management with LRU eviction

    Configuration Constants:
        MAX_MESSAGES_PER_SESSION: Maximum messages stored per session (50)
        MAX_SESSIONS: Maximum concurrent sessions before eviction (1000)
        SESSION_TIMEOUT_HOURS: Hours of inactivity before session expires (24)
        RATE_LIMIT_REQUESTS: Max requests allowed per window (20)
        RATE_LIMIT_WINDOW: Rate limit window in seconds (60)

    Example:
        store = ChatStore()  # Gets singleton instance
        session_id = store.create_session()
        store.add_message(session_id, "user", "Hello")
        context = store.get_conversation_context(session_id)
    """

    # Singleton instance tracking
    _instance: Optional["ChatStore"] = None
    _initialized: bool = False

    # Configuration constants - can be moved to settings if needed
    MAX_MESSAGES_PER_SESSION = 50   # Prevents memory bloat from long conversations
    MAX_SESSIONS = 1000             # Max concurrent sessions before LRU eviction
    SESSION_TIMEOUT_HOURS = 24      # Sessions expire after 24h of inactivity
    RATE_LIMIT_REQUESTS = 20        # Max requests per minute per session
    RATE_LIMIT_WINDOW = 60          # Rate limit window in seconds

    def __new__(cls) -> "ChatStore":
        """
        Implement Singleton pattern - return existing instance if available.
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        """
        Initialize the chat store (only runs once due to Singleton pattern).

        Sets up the sessions dictionary that maps session IDs to ChatSession objects.
        """
        if self._initialized:
            return
        self._initialized = True
        self.sessions: dict[str, ChatSession] = {}

    def create_session(self) -> str:
        """
        Create a new chat session with a unique UUID.

        Also triggers cleanup of expired sessions before creating the new one.

        Returns:
            The UUID string identifying the new session
        """
        # Clean up old sessions first to free memory
        self._cleanup_old_sessions()

        session_id = str(uuid.uuid4())
        self.sessions[session_id] = ChatSession(
            session_id=session_id,
            messages=deque(maxlen=self.MAX_MESSAGES_PER_SESSION)
        )
        return session_id

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """
        Retrieve a session by ID, checking for expiration.

        If the session exists but has been inactive longer than SESSION_TIMEOUT_HOURS,
        it will be deleted and None returned.

        Args:
            session_id: The UUID of the session to retrieve

        Returns:
            The ChatSession if found and not expired, otherwise None
        """
        session = self.sessions.get(session_id)
        if session:
            # Check if session has expired due to inactivity
            hours_since_activity = (
                datetime.now() - session.last_activity
            ).total_seconds() / 3600
            if hours_since_activity > self.SESSION_TIMEOUT_HOURS:
                del self.sessions[session_id]
                return None
        return session

    def get_or_create_session(self, session_id: Optional[str]) -> tuple[str, ChatSession]:
        """
        Get an existing session or create a new one if needed.

        This is the primary method for handling incoming chat requests - it will:
        1. Try to find an existing session if session_id is provided
        2. Create a new session if none exists or ID is None

        Args:
            session_id: Optional existing session ID to look up

        Returns:
            Tuple of (session_id, ChatSession) - may be new or existing
        """
        if session_id:
            session = self.get_session(session_id)
            if session:
                return session_id, session

        # Create new session if none found
        new_id = self.create_session()
        return new_id, self.sessions[new_id]

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str
    ) -> Optional[ChatMessage]:
        """
        Add a message to an existing session.

        Args:
            session_id: The session to add the message to
            role: 'user' or 'assistant'
            content: The message text

        Returns:
            The created ChatMessage, or None if session not found
        """
        session = self.get_session(session_id)
        if not session:
            return None
        return session.add_message(role, content)

    def check_rate_limit(self, session_id: str) -> tuple[bool, str]:
        """
        Check if a session is within rate limits.

        Rate limiting prevents abuse by limiting requests to RATE_LIMIT_REQUESTS
        per RATE_LIMIT_WINDOW seconds (default: 20 per 60 seconds).

        Args:
            session_id: The session to check

        Returns:
            Tuple of (is_allowed, message):
            - (True, "OK") if request is allowed
            - (False, error_message) if rate limited or session not found
        """
        session = self.get_session(session_id)
        if not session:
            return False, "Session not found"

        requests_in_window = session.get_requests_in_window(self.RATE_LIMIT_WINDOW)
        if requests_in_window >= self.RATE_LIMIT_REQUESTS:
            return False, f"Rate limit exceeded. Please wait before sending more messages."

        return True, "OK"

    def record_request(self, session_id: str) -> None:
        """
        Record that a request was made (for rate limiting tracking).

        Should be called after check_rate_limit passes but before processing.

        Args:
            session_id: The session making the request
        """
        session = self.get_session(session_id)
        if session:
            session.record_request()

    def get_conversation_context(
        self,
        session_id: str,
        max_messages: int = 6
    ) -> list[dict]:
        """
        Get recent conversation history for LLM context.

        Returns messages formatted for inclusion in LLM prompts to provide
        conversation continuity.

        Args:
            session_id: The session to get context from
            max_messages: Maximum messages to include (default 6)

        Returns:
            List of message dicts with 'role' and 'content' keys,
            or empty list if session not found
        """
        session = self.get_session(session_id)
        if not session:
            return []
        return session.get_context_messages(max_messages)

    def clear_session(self, session_id: str) -> bool:
        """
        Clear all messages from a session but keep the session active.

        Useful for "start over" functionality without losing session identity.

        Args:
            session_id: The session to clear

        Returns:
            True if session was found and cleared, False otherwise
        """
        session = self.get_session(session_id)
        if session:
            session.messages.clear()
            return True
        return False

    def delete_session(self, session_id: str) -> bool:
        """
        Completely delete a session and all its data.

        Args:
            session_id: The session to delete

        Returns:
            True if session was found and deleted, False otherwise
        """
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

    def _cleanup_old_sessions(self) -> None:
        """
        Internal method to remove expired sessions and manage capacity.

        Performs two cleanup operations:
        1. Remove sessions inactive longer than SESSION_TIMEOUT_HOURS
        2. If at capacity, remove oldest 10% of sessions (LRU eviction)

        Called automatically when creating new sessions.
        """
        now = datetime.now()
        expired = []

        # Find all expired sessions
        for sid, session in self.sessions.items():
            hours_since = (now - session.last_activity).total_seconds() / 3600
            if hours_since > self.SESSION_TIMEOUT_HOURS:
                expired.append(sid)

        # Remove expired sessions
        for sid in expired:
            del self.sessions[sid]

        # If still at capacity, evict oldest 10% (LRU policy)
        if len(self.sessions) >= self.MAX_SESSIONS:
            # Sort by last activity timestamp (oldest first)
            sorted_sessions = sorted(
                self.sessions.items(),
                key=lambda x: x[1].last_activity
            )
            to_remove = max(1, len(sorted_sessions) // 10)
            for sid, _ in sorted_sessions[:to_remove]:
                del self.sessions[sid]

    def get_stats(self) -> dict:
        """
        Get current statistics about the chat store.

        Useful for monitoring and admin endpoints.

        Returns:
            Dict containing:
            - total_sessions: Current number of active sessions
            - max_sessions: Maximum allowed sessions
            - session_timeout_hours: Session expiration time
            - rate_limit: Human-readable rate limit string
        """
        return {
            "total_sessions": len(self.sessions),
            "max_sessions": self.MAX_SESSIONS,
            "session_timeout_hours": self.SESSION_TIMEOUT_HOURS,
            "rate_limit": f"{self.RATE_LIMIT_REQUESTS} per {self.RATE_LIMIT_WINDOW}s"
        }


def get_chat_store() -> ChatStore:
    """
    Get the singleton ChatStore instance.

    This is the recommended way to access the chat store throughout the application.

    Returns:
        The singleton ChatStore instance
    """
    return ChatStore()
