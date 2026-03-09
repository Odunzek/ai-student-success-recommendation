import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Minus, Send, Maximize2 } from 'lucide-react'
import { ChatMessage as ChatMessageComponent } from './ChatMessage'
import { Spinner } from '../ui/Spinner'
import { useAppStore } from '../../store/useAppStore'
import { useChat, useChatStatus } from '../../api/hooks/useChat'
import { cn } from '../../lib/utils'
import type { ChatMessage } from '../../types/chat'

export function ChatWidget() {
  const { isChatWidgetOpen, toggleChatWidget, setChatWidgetOpen, setActiveRoute } = useAppStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chat = useChat()
  const { data: status, isError: statusError } = useChatStatus()
  const isAvailable = !statusError && (status?.available ?? false)

  useEffect(() => {
    if (isChatWidgetOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isChatWidgetOpen])

  // Scroll to bottom when new messages arrive or AI is typing, so the latest answer is visible
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chat.isPending])

  const handleSend = async () => {
    if (!input.trim() || chat.isPending || !isAvailable) return

    const content = input.trim()
    setInput('')

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await chat.mutateAsync({ message: content })
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleExpandToFull = () => {
    setChatWidgetOpen(false)
    setActiveRoute('chat')
  }

  return (
    <>
      {/* Floating Bubble Button */}
      <AnimatePresence>
        {!isChatWidgetOpen && (
          <motion.button
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'w-14 h-14 rounded-full',
              'bg-gradient-to-br from-primary-500 to-primary-600',
              'shadow-lg shadow-primary-500/30',
              'flex items-center justify-center',
              'hover:shadow-xl hover:shadow-primary-500/40',
              'transition-shadow',
            )}
            onClick={toggleChatWidget}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open EduAssist AI chat"
          >
            <Bot className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isChatWidgetOpen && (
          <motion.div
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'w-[400px] h-[500px] max-h-[80vh]',
              'rounded-2xl overflow-hidden',
              'bg-surface-900 border border-surface-700',
              'shadow-2xl shadow-black/40',
              'flex flex-col',
            )}
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700 bg-surface-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">EduAssist AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isAvailable ? 'bg-success-500' : 'bg-danger-500'
                    )} />
                    <span className="text-xs text-surface-400">
                      {isAvailable ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExpandToFull}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
                  aria-label="Open full chat"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleChatWidget}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
                  aria-label="Minimize chat"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChatWidgetOpen(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              aria-live="polite"
            >
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-10 w-10 mx-auto mb-3 text-surface-600" />
                  <p className="text-sm text-surface-400 mb-1">Ask EduAssist AI for intervention ideas...</p>
                  <p className="text-xs text-surface-500">Powered by AI to help with student success</p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessageComponent key={message.id} message={message} />
                ))
              )}

              {chat.isPending && (
                <div className="flex items-center gap-2 text-surface-400">
                  <Spinner size="sm" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-surface-700">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isAvailable ? 'Ask EduAssist AI for intervention ideas...' : 'Chat unavailable'}
                  disabled={!isAvailable || chat.isPending}
                  className={cn(
                    'flex-1 resize-none rounded-xl px-4 py-2 text-sm',
                    'bg-surface-800 border border-surface-700',
                    'text-white placeholder:text-surface-500',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || chat.isPending || !isAvailable}
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-xl',
                    'bg-primary-600 hover:bg-primary-500',
                    'flex items-center justify-center',
                    'text-white transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
