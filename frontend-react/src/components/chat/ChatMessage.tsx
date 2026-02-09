import { User, Bot } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ChatMessage as ChatMessageType } from '../../types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : '')}>
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary' : 'bg-surface-200 dark:bg-surface-700'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-surface-600 dark:text-surface-400" />
        )}
      </div>

      <div
        className={cn(
          'max-w-[80%] rounded-xl px-4 py-2',
          isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-bl-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'text-xs mt-1',
            isUser ? 'text-primary-200' : 'text-surface-400 dark:text-surface-500'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}
