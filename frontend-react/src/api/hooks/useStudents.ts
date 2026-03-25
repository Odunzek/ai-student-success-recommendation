import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { Student, StudentListResponse, StudentFilters } from '../../types/student'
import type { PredictionResult } from '../../types/prediction'

export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => api.get<StudentListResponse>('/students', {
      page: filters.page,
      per_page: filters.per_page,
      search: filters.search,
      risk_level: filters.risk_level,
    }),
  })
}

export function useStudent(id: string | number) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await api.get<{ student: Student }>(`/students/${id}`)
      return res.student
    },
    enabled: !!id,
  })
}

export function useStudentPredict(id: string | number) {
  return useQuery({
    queryKey: ['student', id, 'predict'],
    queryFn: () => api.get<PredictionResult>(`/students/${id}/predict`),
    enabled: !!id,
  })
}
