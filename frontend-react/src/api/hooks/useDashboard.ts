import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { DashboardStats } from '../../types/prediction'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  })
}

export function useApiStatus() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ status: string; model_loaded: boolean }>('/health'),
    refetchInterval: 30000,
    retry: 1,
  })
}
