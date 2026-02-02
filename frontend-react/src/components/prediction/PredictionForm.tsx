import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import type { PredictionInput } from '../../types/prediction'

const predictionSchema = z.object({
  gender: z.string(),
  age: z.coerce.number().min(15).max(25),
  address: z.string(),
  family_size: z.string(),
  parental_status: z.string(),
  mother_education: z.coerce.number().min(0).max(4),
  father_education: z.coerce.number().min(0).max(4),
  mother_job: z.string(),
  father_job: z.string(),
  reason: z.string(),
  guardian: z.string(),
  travel_time: z.coerce.number().min(1).max(4),
  study_time: z.coerce.number().min(1).max(4),
  failures: z.coerce.number().min(0).max(4),
  school_support: z.boolean(),
  family_support: z.boolean(),
  extra_paid: z.boolean(),
  activities: z.boolean(),
  nursery: z.boolean(),
  higher: z.boolean(),
  internet: z.boolean(),
  romantic: z.boolean(),
  family_relations: z.coerce.number().min(1).max(5),
  free_time: z.coerce.number().min(1).max(5),
  social: z.coerce.number().min(1).max(5),
  weekday_alcohol: z.coerce.number().min(1).max(5),
  weekend_alcohol: z.coerce.number().min(1).max(5),
  health: z.coerce.number().min(1).max(5),
  absences: z.coerce.number().min(0).max(93),
  g1: z.coerce.number().min(0).max(20),
  g2: z.coerce.number().min(0).max(20),
})

interface PredictionFormProps {
  onSubmit: (data: PredictionInput) => void
  isLoading?: boolean
}

export function PredictionForm({ onSubmit, isLoading }: PredictionFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<PredictionInput>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      gender: 'M',
      age: 17,
      address: 'U',
      family_size: 'GT3',
      parental_status: 'T',
      mother_education: 2,
      father_education: 2,
      mother_job: 'other',
      father_job: 'other',
      reason: 'course',
      guardian: 'mother',
      travel_time: 1,
      study_time: 2,
      failures: 0,
      school_support: false,
      family_support: true,
      extra_paid: false,
      activities: false,
      nursery: true,
      higher: true,
      internet: true,
      romantic: false,
      family_relations: 4,
      free_time: 3,
      social: 3,
      weekday_alcohol: 1,
      weekend_alcohol: 1,
      health: 3,
      absences: 4,
      g1: 12,
      g2: 12,
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Demographics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Demographics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select
              label="Gender"
              {...register('gender')}
              options={[
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' },
              ]}
              error={errors.gender?.message}
            />
            <Input
              label="Age"
              type="number"
              {...register('age')}
              error={errors.age?.message}
            />
            <Select
              label="Address"
              {...register('address')}
              options={[
                { value: 'U', label: 'Urban' },
                { value: 'R', label: 'Rural' },
              ]}
              error={errors.address?.message}
            />
            <Select
              label="Family Size"
              {...register('family_size')}
              options={[
                { value: 'GT3', label: 'More than 3' },
                { value: 'LE3', label: '3 or less' },
              ]}
              error={errors.family_size?.message}
            />
          </div>
        </div>

        {/* Family */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Family Background</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select
              label="Parental Status"
              {...register('parental_status')}
              options={[
                { value: 'T', label: 'Together' },
                { value: 'A', label: 'Apart' },
              ]}
              error={errors.parental_status?.message}
            />
            <Select
              label="Guardian"
              {...register('guardian')}
              options={[
                { value: 'mother', label: 'Mother' },
                { value: 'father', label: 'Father' },
                { value: 'other', label: 'Other' },
              ]}
              error={errors.guardian?.message}
            />
            <Select
              label="Mother Education"
              {...register('mother_education')}
              options={[
                { value: 0, label: 'None' },
                { value: 1, label: 'Primary' },
                { value: 2, label: 'Middle School' },
                { value: 3, label: 'High School' },
                { value: 4, label: 'Higher Ed' },
              ]}
              error={errors.mother_education?.message}
            />
            <Select
              label="Father Education"
              {...register('father_education')}
              options={[
                { value: 0, label: 'None' },
                { value: 1, label: 'Primary' },
                { value: 2, label: 'Middle School' },
                { value: 3, label: 'High School' },
                { value: 4, label: 'Higher Ed' },
              ]}
              error={errors.father_education?.message}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Select
              label="Mother Job"
              {...register('mother_job')}
              options={[
                { value: 'teacher', label: 'Teacher' },
                { value: 'health', label: 'Healthcare' },
                { value: 'services', label: 'Services' },
                { value: 'at_home', label: 'At Home' },
                { value: 'other', label: 'Other' },
              ]}
              error={errors.mother_job?.message}
            />
            <Select
              label="Father Job"
              {...register('father_job')}
              options={[
                { value: 'teacher', label: 'Teacher' },
                { value: 'health', label: 'Healthcare' },
                { value: 'services', label: 'Services' },
                { value: 'at_home', label: 'At Home' },
                { value: 'other', label: 'Other' },
              ]}
              error={errors.father_job?.message}
            />
            <Select
              label="School Choice Reason"
              {...register('reason')}
              options={[
                { value: 'home', label: 'Close to Home' },
                { value: 'reputation', label: 'Reputation' },
                { value: 'course', label: 'Course' },
                { value: 'other', label: 'Other' },
              ]}
              error={errors.reason?.message}
            />
            <Input
              label="Family Relations (1-5)"
              type="number"
              {...register('family_relations')}
              error={errors.family_relations?.message}
            />
          </div>
        </div>

        {/* Academic */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Academic Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Travel Time (1-4)"
              type="number"
              {...register('travel_time')}
              error={errors.travel_time?.message}
            />
            <Input
              label="Study Time (1-4)"
              type="number"
              {...register('study_time')}
              error={errors.study_time?.message}
            />
            <Input
              label="Past Failures"
              type="number"
              {...register('failures')}
              error={errors.failures?.message}
            />
            <Input
              label="Absences"
              type="number"
              {...register('absences')}
              error={errors.absences?.message}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Input
              label="Grade 1 (G1)"
              type="number"
              {...register('g1')}
              error={errors.g1?.message}
            />
            <Input
              label="Grade 2 (G2)"
              type="number"
              {...register('g2')}
              error={errors.g2?.message}
            />
          </div>
        </div>

        {/* Lifestyle */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Lifestyle</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Free Time (1-5)"
              type="number"
              {...register('free_time')}
              error={errors.free_time?.message}
            />
            <Input
              label="Social (1-5)"
              type="number"
              {...register('social')}
              error={errors.social?.message}
            />
            <Input
              label="Weekday Alcohol (1-5)"
              type="number"
              {...register('weekday_alcohol')}
              error={errors.weekday_alcohol?.message}
            />
            <Input
              label="Weekend Alcohol (1-5)"
              type="number"
              {...register('weekend_alcohol')}
              error={errors.weekend_alcohol?.message}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Input
              label="Health (1-5)"
              type="number"
              {...register('health')}
              error={errors.health?.message}
            />
          </div>
        </div>

        {/* Boolean Flags */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Support & Activities</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'school_support', label: 'School Support' },
              { name: 'family_support', label: 'Family Support' },
              { name: 'extra_paid', label: 'Extra Paid Classes' },
              { name: 'activities', label: 'Extracurricular' },
              { name: 'nursery', label: 'Attended Nursery' },
              { name: 'higher', label: 'Wants Higher Ed' },
              { name: 'internet', label: 'Internet Access' },
              { name: 'romantic', label: 'In Relationship' },
            ].map((field) => (
              <label key={field.name} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register(field.name as keyof PredictionInput)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{field.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
            Predict Dropout Risk
          </Button>
        </div>
      </form>
    </Card>
  )
}
