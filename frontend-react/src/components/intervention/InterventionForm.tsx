import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import type { InterventionInput } from '../../types/intervention'

const interventionSchema = z.object({
  risk_score: z.coerce.number().min(0).max(100),
  completion_rate: z.coerce.number().min(0).max(1).optional(),
  avg_score: z.coerce.number().min(0).max(100).optional(),
  total_clicks: z.coerce.number().min(0).optional(),
  studied_credits: z.coerce.number().min(0).optional(),
  num_of_prev_attempts: z.coerce.number().min(0).optional(),
  student_name: z.string().optional(),
  module_name: z.string().optional(),
})

interface InterventionFormProps {
  onSubmit: (data: InterventionInput) => void
  isLoading?: boolean
  useLlm: boolean
  onToggleLlm: (value: boolean) => void
}

export function InterventionForm({ onSubmit, isLoading, useLlm, onToggleLlm }: InterventionFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<InterventionInput>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      risk_score: 50,
      completion_rate: 0.5,
      avg_score: 50,
      total_clicks: 0,
      studied_credits: 60,
      num_of_prev_attempts: 0,
      student_name: '',
      module_name: '',
    },
  })

  const handleFormSubmit = (data: InterventionInput) => {
    onSubmit({ ...data, use_llm: useLlm })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Interventions</CardTitle>
        <CardDescription>
          Enter student metrics to generate targeted intervention recommendations
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Risk Score (0-100)"
            type="number"
            placeholder="e.g. 75"
            {...register('risk_score')}
            error={errors.risk_score?.message}
          />
          <Input
            label="Completion Rate (0-1)"
            type="number"
            step="0.01"
            placeholder="e.g. 0.35"
            {...register('completion_rate')}
            error={errors.completion_rate?.message}
          />
          <Input
            label="Avg Score (0-100)"
            type="number"
            placeholder="e.g. 45"
            {...register('avg_score')}
            error={errors.avg_score?.message}
          />
          <Input
            label="Total VLE Clicks"
            type="number"
            placeholder="e.g. 150"
            {...register('total_clicks')}
            error={errors.total_clicks?.message}
          />
          <Input
            label="Studied Credits"
            type="number"
            placeholder="e.g. 60"
            {...register('studied_credits')}
            error={errors.studied_credits?.message}
          />
          <Input
            label="Previous Attempts"
            type="number"
            placeholder="e.g. 0"
            {...register('num_of_prev_attempts')}
            error={errors.num_of_prev_attempts?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Student Name (optional)"
            placeholder="For personalized messaging"
            {...register('student_name')}
          />
          <Input
            label="Module Name (optional)"
            placeholder="e.g. Introduction to CS"
            {...register('module_name')}
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-700">
          <Toggle
            checked={useLlm}
            onChange={onToggleLlm}
            label="Use AI-Enhanced Recommendations"
          />
          <Button type="submit" isLoading={isLoading}>
            Generate Interventions
          </Button>
        </div>
      </form>
    </Card>
  )
}
