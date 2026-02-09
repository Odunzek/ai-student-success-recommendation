/**
 * ChatTab.tsx - AI Assistant Chat Interface Page
 *
 * This component provides the main chat interface for interacting with the
 * AI assistant. It manages:
 *   - Chat message state (local) and session persistence (localStorage)
 *   - Communication with the backend chat API
 *   - Session continuity across page reloads
 *   - Error handling and loading states
 *
 * Features:
 *   - Session-based conversation history
 *   - Automatic session restoration from localStorage
 *   - Example prompts for quick access to common questions
 *   - Service availability indicator
 *   - New conversation / clear history functionality
 *
 * Layout:
 *   - Left (2/3): Main chat interface
 *   - Right (1/3): AI capabilities, session info, guidelines, example prompts
 */

import { useState, useEffect, useMemo } from 'react'
import { Sparkles, AlertTriangle, RefreshCw, UserCircle, Search, X } from 'lucide-react'
import { ChatInterface } from '../components/chat/ChatInterface'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useChat, useChatStatus, useClearChatHistory } from '../api/hooks/useChat'
import { useStudents } from '../api/hooks/useStudents'
import { useDebounce } from '../hooks/useDebounce'
import type { ChatMessage } from '../types/chat'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * LocalStorage key for persisting session ID across page reloads.
 * Allows users to continue conversations after refreshing the page.
 */
const SESSION_STORAGE_KEY = 'chat_session_id'


// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChatTab() {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  /**
   * Local message state - stores all messages for the current session.
   * Note: Messages are stored locally (not fetched from server on reload)
   * to keep the UI responsive. The server maintains the authoritative history.
   */
  const [messages, setMessages] = useState<ChatMessage[]>([])

  /**
   * Session ID state with localStorage initialization.
   * - On first render, attempts to restore session from localStorage
   * - Updated when server returns a new session ID
   * - Cleared on "New Conversation"
   */
  const [sessionId, setSessionId] = useState<string | null>(() => {
    // Try to restore session from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SESSION_STORAGE_KEY)
    }
    return null
  })

  /**
   * Student context state for data-aware chat
   */
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)

  // ---------------------------------------------------------------------------
  // API HOOKS
  // ---------------------------------------------------------------------------

  /**
   * React Query mutation for sending chat messages.
   * Handles loading state (isPending) and error handling automatically.
   */
  const chat = useChat()

  /**
   * Query for checking AI service availability.
   * Used to show online/offline status and disable input when unavailable.
   */
  const { data: status, isError: statusError } = useChatStatus()

  /**
   * Mutation for clearing server-side chat history.
   * Called when user clicks "Clear History" or starts new conversation.
   */
  const clearHistory = useClearChatHistory()

  /**
   * Query for fetching students for the student selector
   */
  const { data: studentsData } = useStudents({ per_page: 100 })

  /**
   * Derived state: Is the AI service available?
   * Service is unavailable if the status query failed OR returned available: false
   */
  const isAvailable = !statusError && (status?.available ?? false)

  /**
   * Debounced search query to reduce filtering overhead
   */
  const debouncedSearchQuery = useDebounce(studentSearchQuery, 200)

  /**
   * Filtered students based on debounced search query
   */
  const filteredStudents = useMemo(() => {
    if (!studentsData?.students || !debouncedSearchQuery.trim()) return []
    const query = debouncedSearchQuery.toLowerCase()
    return studentsData.students
      .filter((s) => s.student_id.toLowerCase().includes(query))
      .slice(0, 8)
  }, [studentsData?.students, debouncedSearchQuery])

  /**
   * Get selected student data
   */
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId || !studentsData?.students) return null
    return studentsData.students.find((s) => s.student_id === selectedStudentId)
  }, [selectedStudentId, studentsData?.students])

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Persist session ID to localStorage whenever it changes.
   * This allows session continuity across page reloads.
   */
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
    }
  }, [sessionId])

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Handle sending a new message to the AI assistant.
   *
   * Flow:
   * 1. Create optimistic user message and add to UI immediately
   * 2. Send message to server with current session ID
   * 3. Update session ID if server returns a new one (first message)
   * 4. Add assistant response to messages
   * 5. Handle errors gracefully with error message display
   *
   * @param content - The message text to send
   */
  const handleSendMessage = async (content: string) => {
    // Create user message with optimistic ID (timestamp-based)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    // Add to UI immediately for responsiveness
    setMessages((prev) => [...prev, userMessage])

    try {
      // Send to server with session ID and optional student context
      const response = await chat.mutateAsync({
        message: content,
        session_id: sessionId ?? undefined,
        student_id: selectedStudentId ?? undefined,
      })

      // Update session ID if we got a new one (happens on first message)
      if (response.session_id && response.session_id !== sessionId) {
        setSessionId(response.session_id)
      }

      // Create assistant message from response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        flagged: response.flagged, // Mark if input was flagged as suspicious
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      // On error, show a friendly error message in the chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  /**
   * Handle clearing chat history (both local and server-side).
   *
   * Flow:
   * 1. Clear local messages immediately
   * 2. Clear server-side session if one exists
   * 3. Reset session ID to null (new session will be created on next message)
   * 4. Remove session from localStorage
   */
  const handleClearHistory = async () => {
    // Clear local messages immediately for responsive UI
    setMessages([])

    // Clear server-side session if we have one
    if (sessionId) {
      try {
        await clearHistory.mutateAsync(sessionId)
      } catch {
        // Session might not exist on server (expired), that's ok
        // We still clear local state
      }
    }

    // Reset session state
    setSessionId(null)
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  /**
   * Handle starting a new conversation.
   * Similar to clear history but without the server-side clear
   * (the old session just becomes orphaned and will expire).
   */
  const handleNewSession = () => {
    setMessages([])
    setSessionId(null)
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chat Interface - Takes 2/3 of the width on large screens */}
      <div className="lg:col-span-2">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onClearHistory={handleClearHistory}
          isLoading={chat.isPending}
          isAvailable={isAvailable}
        />
      </div>

      {/* Sidebar - Takes 1/3 of the width on large screens */}
      <div className="space-y-4">
        {/* Student Context Card - Select a student for data-aware chat */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              <CardTitle>Student Context</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Select a student to chat about their specific data and get personalized recommendations.
            </p>

            {/* Student Search Input */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => {
                    setStudentSearchQuery(e.target.value)
                    setShowStudentDropdown(true)
                  }}
                  onFocus={() => studentSearchQuery && setShowStudentDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                  placeholder="Search by student ID..."
                  className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              </div>

              {/* Dropdown */}
              {showStudentDropdown && filteredStudents.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(student.student_id)
                        setStudentSearchQuery(student.student_id)
                        setShowStudentDropdown(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface-50 dark:hover:bg-surface-800"
                    >
                      {student.student_id}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Student Display */}
            {selectedStudent && (
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{selectedStudent.student_id}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedStudentId(null)
                    setStudentSearchQuery('')
                  }}
                  className="p-1 hover:bg-primary/20 rounded"
                >
                  <X className="h-3 w-3 text-primary" />
                </button>
              </div>
            )}

            {!studentsData?.students?.length && (
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Upload student data to enable student context.
              </p>
            )}
          </div>
        </Card>

        {/* AI Capabilities Card - What users can ask about */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Capabilities</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">What you can ask:</h4>
              <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li className="flex items-start gap-2">
                  <span className="text-primary">-</span>
                  Analyze dropout risk factors
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">-</span>
                  Get intervention recommendations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">-</span>
                  Understand student data patterns
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">-</span>
                  Compare student metrics
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">-</span>
                  Academic support best practices
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Session Info Card - Shows service status and session details */}
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {/* Service availability indicator */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-600 dark:text-surface-400">Service</span>
              <Badge variant={isAvailable ? 'success' : 'warning'}>
                {isAvailable ? 'Online' : 'Offline'}
              </Badge>
            </div>

            {/* Message count display */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-600 dark:text-surface-400">Messages</span>
              <span className="text-sm font-medium text-surface-900 dark:text-white">{messages.length}</span>
            </div>

            {/* Session ID display (truncated for readability) */}
            {sessionId && (
              <div className="text-xs text-surface-500 dark:text-surface-400 truncate">
                Session: {sessionId.slice(0, 8)}...
              </div>
            )}

            {/* New Conversation button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleNewSession}
              leftIcon={<RefreshCw className="h-3 w-3" />}
            >
              New Conversation
            </Button>
          </div>
        </Card>

        {/* Guidelines Card - Important usage notes and limitations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-500" />
              <CardTitle>Guidelines</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
            <p>This AI assistant is designed for academic support questions only.</p>
            <p>Do not share sensitive personal information. The assistant will not provide medical, legal, or financial advice.</p>
          </div>
        </Card>

        {/* Example Prompts Card - Quick access to common questions */}
        <Card>
          <CardHeader>
            <CardTitle>Example Prompts</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {/* Clickable example prompts that send the message directly */}
            {[
              'What are the main factors contributing to dropout?',
              'How can we help students with low grades?',
              'What interventions work best for high-risk students?',
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(prompt)}
                disabled={chat.isPending || !isAvailable}
                className="w-full text-left p-2 text-sm text-surface-600 dark:text-surface-400 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
