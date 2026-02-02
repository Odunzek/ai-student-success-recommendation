export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatRequest {
  message: string
  context?: {
    student_id?: string
    include_data?: boolean
  }
}

export interface ChatResponse {
  message: string
  sources?: string[]
}

export interface ChatStatus {
  available: boolean
  model: string
  provider: string
}
