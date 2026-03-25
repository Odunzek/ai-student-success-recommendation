import { useMutation } from '@tanstack/react-query'
import { api } from '../client'
import type { InterventionInput, InterventionResult } from '../../types/intervention'

export function useIntervention() {
  return useMutation({
    mutationFn: (input: InterventionInput) =>
      api.post<InterventionResult>('/intervention', input),
  })
}
