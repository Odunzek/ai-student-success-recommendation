import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type { ChatRequest, ChatResponse, ChatStatus, ChatHistoryResponse } from '../../types/chat'

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

export function useChatHistory(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat', 'history', sessionId],
    queryFn: () => api.get<ChatHistoryResponse>(`/chat/history/${sessionId}`),
    enabled: !!sessionId,
    retry: false,
  })
}

export function useClearChatHistory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.delete(`/chat/history/${sessionId}`),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'history', sessionId] })
    },
  })
}

export function useCreateChatSession() {
  return useMutation({
    mutationFn: () =>
      api.post<{ session_id: string; message: string }>('/chat/session'),
  })
}
