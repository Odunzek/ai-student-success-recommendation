import { useQuery } from '@tanstack/react-query'
import { api } from '../client'

interface LLMConfig {
  model: string
  base_url: string
  enabled: boolean
  timeout: number
}

export function useLLMConfig() {
  return useQuery({
    queryKey: ['settings', 'llm'],
    queryFn: () => api.get<LLMConfig>('/settings/llm'),
    staleTime: 60 * 1000, // 1 minute
  })
}
