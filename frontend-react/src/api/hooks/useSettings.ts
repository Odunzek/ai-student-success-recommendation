import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

interface LLMConfig {
  model: string
  base_url: string
  enabled: boolean
  timeout: number
}

interface AvailableModelsResponse {
  models: string[]
  current_model: string
}

export function useLLMConfig() {
  return useQuery({
    queryKey: ['settings', 'llm'],
    queryFn: () => api.get<LLMConfig>('/settings/llm'),
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useAvailableModels() {
  return useQuery({
    queryKey: ['settings', 'llm', 'models'],
    queryFn: () => api.get<AvailableModelsResponse>('/settings/llm/models'),
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  })
}

export function useUpdateLLMModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (model: string) => api.put<LLMConfig>('/settings/llm/model', { model }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'llm'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'llm', 'models'] })
    },
  })
}
