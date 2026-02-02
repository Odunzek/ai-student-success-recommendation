import { useMutation } from '@tanstack/react-query'
import { api } from '../client'
import type { PredictionInput, PredictionResult } from '../../types/prediction'

export function usePrediction() {
  return useMutation({
    mutationFn: (input: PredictionInput) =>
      api.post<PredictionResult>('/predict/explain', input),
  })
}
