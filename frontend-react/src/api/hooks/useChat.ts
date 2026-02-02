import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { ChatRequest, ChatResponse, ChatStatus } from '../../types/chat'

export function useChat() {
  return useMutation({
    mutationFn: (input: ChatRequest) =>
      api.post<ChatResponse>('/chat', input),
  })
}

export function useChatStatus() {
  return useQuery({
    queryKey: ['chat', 'status'],
    queryFn: () => api.get<ChatStatus>('/chat/status'),
    retry: false,
    refetchOnWindowFocus: false,
  })
}
