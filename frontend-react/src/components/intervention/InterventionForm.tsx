import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import type { InterventionInput } from '../../types/intervention'

const interventionSchema = z.object({
  student_id: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  risk_factors: z.array(z.string()).min(1, 'Select at least one risk factor'),
})

interface InterventionFormProps {
  onSubmit: (data: InterventionInput) => void
  isLoading?: boolean
  useLlm: boolean
  onToggleLlm: (value: boolean) => void
}

const riskFactorOptions = [
  { value: 'low_grades', label: 'Low Grades' },
  { value: 'high_absences', label: 'High Absences' },
  { value: 'past_failures', label: 'Past Failures' },
  { value: 'low_study_time', label: 'Low Study Time' },
  { value: 'lack_support', label: 'Lack of Support' },
  { value: 'family_issues', label: 'Family Issues' },
  { value: 'health_concerns', label: 'Health Concerns' },
  { value: 'alcohol_use', label: 'Alcohol Use' },
]

export function InterventionForm({ onSubmit, isLoading, useLlm, onToggleLlm }: InterventionFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InterventionInput>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      student_id: '',
      risk_level: 'medium',
      risk_factors: ['low_grades'],
    },
  })

  const selectedFactors = watch('risk_factors') || []

  const toggleFactor = (factor: string) => {
    const current = selectedFactors
    if (current.includes(factor)) {
      setValue('risk_factors', current.filter((f) => f !== factor))
    } else {
      setValue('risk_factors', [...current, factor])
    }
  }

  const handleFormSubmit = (data: InterventionInput) => {
    onSubmit({ ...data, use_llm: useLlm })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Interventions</CardTitle>
        <CardDescription>
          Select risk factors to generate targeted intervention recommendations
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Student ID (optional)"
            placeholder="Enter student ID"
            {...register('student_id')}
          />
          <Select
            label="Risk Level"
            {...register('risk_level')}
            options={[
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
            ]}
            error={errors.risk_level?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Risk Factors
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {riskFactorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleFactor(option.value)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  selectedFactors.includes(option.value)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.risk_factors && (
            <p className="mt-2 text-sm text-danger">{errors.risk_factors.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
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
