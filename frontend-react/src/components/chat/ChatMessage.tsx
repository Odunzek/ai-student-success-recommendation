import type { ReactNode } from 'react'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '../../lib/utils'
import type { ChatMessage as ChatMessageType } from '../../types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

function formatAssistantContent(content: string): string {
  // Put "1.\n\nText" or "1.\nText" on one line: "1. Text"
  let formatted = content.replace(/(\d+)\.\s*[\r\n]+\s*/g, '$1. ')
  // Collapse 2+ blank lines into a single blank line
  formatted = formatted.replace(/\n{3,}/g, '\n\n')
  return formatted
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="text-sm leading-snug my-0.5 first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-inherit">{children}</strong>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal list-inside my-1 space-y-0.5 text-sm">{children}</ol>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc list-inside my-1 space-y-0.5 text-sm">{children}</ul>
  ),
  li: ({ children }: { children?: ReactNode }) => <li className="text-sm">{children}</li>,
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
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="[&>*:last-child]:mb-0 [&_li>p]:inline [&_li>p]:first:ml-0">
            <ReactMarkdown components={markdownComponents}>
              {formatAssistantContent(message.content)}
            </ReactMarkdown>
          </div>
        )}
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
