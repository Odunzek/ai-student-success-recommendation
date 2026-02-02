import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ChatInterface } from '../components/chat/ChatInterface'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useChat, useChatStatus } from '../api/hooks/useChat'
import type { ChatMessage } from '../types/chat'

export function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const chat = useChat()
  const { data: status, isError: statusError } = useChatStatus()

  const isAvailable = !statusError && (status?.available ?? false)

  const handleSendMessage = async (content: string) => {
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
        content: response.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleClearHistory = () => {
    setMessages([])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onClearHistory={handleClearHistory}
          isLoading={chat.isPending}
          isAvailable={isAvailable}
        />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Capabilities</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">What you can ask:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
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
                  General education questions
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service</span>
              <Badge variant={isAvailable ? 'success' : 'warning'}>
                {isAvailable ? 'Online' : 'Offline'}
              </Badge>
            </div>
            {status?.model && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Model</span>
                <span className="text-sm font-medium text-gray-900">{status.model}</span>
              </div>
            )}
            {status?.provider && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Provider</span>
                <span className="text-sm font-medium text-gray-900">{status.provider}</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example Prompts</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {[
              'What are the main factors contributing to dropout?',
              'How can we help students with low grades?',
              'What interventions work best for high-risk students?',
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(prompt)}
                disabled={chat.isPending || !isAvailable}
                className="w-full text-left p-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
