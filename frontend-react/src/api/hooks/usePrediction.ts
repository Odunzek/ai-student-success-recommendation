import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type { PredictionInput, PredictionResult } from '../../types/prediction'

export function usePrediction() {
  return useMutation({
    mutationFn: (input: PredictionInput) =>
      api.post<PredictionResult>('/predict/explain', input),
  })
}

export interface BatchPredictionResult {
  processed: number
  high_risk: number
  medium_risk: number
  low_risk: number
}

export function useBatchPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<BatchPredictionResult>('/predict/batch'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
