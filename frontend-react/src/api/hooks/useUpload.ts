import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

interface UploadResponse {
  message: string
  rows_processed: number
  filename: string
}

interface UploadStatus {
  has_data: boolean
  row_count: number
  last_upload?: string
}

export function useUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.postForm<UploadResponse>('/upload/csv', formData)
    },
    onSuccess: () => {
      // Invalidate all related queries to trigger immediate refetch
      queryClient.invalidateQueries({ queryKey: ['upload', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      // Explicitly invalidate all dashboard query keys
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'risk-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'trend'] })
      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['upload', 'status'] })
    },
  })
}

export function useUploadStatus() {
  return useQuery({
    queryKey: ['upload', 'status'],
    queryFn: () => api.get<UploadStatus>('/upload/status'),
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds - shorter for upload status
  })
}

export function useResetData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete<{ message: string }>('/upload/data'),
    onSuccess: () => {
      // Invalidate and refetch all data after reset
      queryClient.invalidateQueries({ queryKey: ['upload', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'risk-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'trend'] })
      queryClient.refetchQueries({ queryKey: ['upload', 'status'] })
    },
  })
}
