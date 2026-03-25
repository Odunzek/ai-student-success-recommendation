import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { useAppStore } from '../../store/useAppStore'

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

interface OuladFiles {
  studentInfo: File
  studentAssessment?: File
  studentVle?: File
  assessments?: File
}

function invalidateAllDataQueries(queryClient: ReturnType<typeof useQueryClient>) {
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
}

export function useUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.postForm<UploadResponse>('/upload/csv', formData)
    },
    onSuccess: () => invalidateAllDataQueries(queryClient),
  })
}

export function useUploadOulad() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (files: OuladFiles) => {
      const formData = new FormData()
      formData.append('student_info', files.studentInfo)
      if (files.studentAssessment) {
        formData.append('student_assessment', files.studentAssessment)
      }
      if (files.studentVle) {
        formData.append('student_vle', files.studentVle)
      }
      if (files.assessments) {
        formData.append('assessments', files.assessments)
      }
      return api.postForm<UploadResponse>('/upload/oulad', formData)
    },
    onSuccess: () => invalidateAllDataQueries(queryClient),
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
      // Clear persistent tab state so Intervention and Chat tabs reset too
      useAppStore.getState().clearInterventionState()
    },
  })
}
