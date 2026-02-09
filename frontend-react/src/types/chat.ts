export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  flagged?: boolean
}

export interface ChatRequest {
  message: string
  context?: string
  session_id?: string
  student_id?: string
}

export interface ChatResponse {
  response: string
  llm_available: boolean
  session_id: string
  flagged: boolean
  flag_reason: string | null
}

export interface ChatStatus {
  available: boolean
  message: string
}

export interface ChatHistoryResponse {
  session_id: string
  messages: Array<{
    role: string
    content: string
    timestamp: string
  }>
  message_count: number
}

export interface ChatStoreStats {
  total_sessions: number
  max_sessions: number
  session_timeout_hours: number
  rate_limit: string
}
