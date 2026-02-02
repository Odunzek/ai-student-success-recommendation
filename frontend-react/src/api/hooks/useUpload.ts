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
      queryClient.invalidateQueries({ queryKey: ['upload', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUploadStatus() {
  return useQuery({
    queryKey: ['upload', 'status'],
    queryFn: () => api.get<UploadStatus>('/upload/status'),
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export function useResetData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete<{ message: string }>('/upload/data'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upload', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
