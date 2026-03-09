import { useState, useRef, useEffect } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import type { ChatMessage as ChatMessageType } from '../../types/chat'

interface ChatInterfaceProps {
  messages: ChatMessageType[]
  onSendMessage: (message: string) => void
  onClearHistory: () => void
  isLoading?: boolean
  isAvailable?: boolean
}

export function ChatInterface({
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  isAvailable = true,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive or AI is typing, so the latest answer is visible
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !isAvailable) return

    onSendMessage(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <div>
          <h3 className="font-medium text-surface-900 dark:text-white">AI Assistant</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Ask questions about student data and dropout prevention
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearHistory}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-surface-500 dark:text-surface-400">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation by typing a message below</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
            <Spinner size="sm" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-surface-200 dark:border-surface-800">
        {!isAvailable && (
          <div className="text-sm text-warning mb-2">
            Chat service is currently unavailable
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAvailable ? "Type your message..." : "Chat unavailable"}
            disabled={!isAvailable || isLoading}
            className="flex-1 resize-none rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-50 dark:disabled:bg-surface-800 disabled:cursor-not-allowed"
            rows={1}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || !isAvailable}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-surface-400 dark:text-surface-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
