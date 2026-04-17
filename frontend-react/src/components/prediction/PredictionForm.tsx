import { useState } from 'react'
import { Brain } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Alert } from '../ui/Alert'
import { LoadingState } from '../ui/Spinner'
import { RiskCircle } from './RiskCircle'
import { ShapFactors } from './ShapFactors'
import { usePrediction } from '../../api/hooks/usePrediction'
import type { PredictionInput } from '../../types/prediction'

// ---------------------------------------------------------------------------
// Dropdown option lists — values match exactly what the OULAD dataset contains
// ---------------------------------------------------------------------------
const MODULE_OPTIONS = [
  { value: 'AAA', label: 'AAA' },
  { value: 'BBB', label: 'BBB' },
  { value: 'CCC', label: 'CCC' },
  { value: 'DDD', label: 'DDD' },
  { value: 'EEE', label: 'EEE' },
  { value: 'FFF', label: 'FFF' },
  { value: 'GGG', label: 'GGG' },
]

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
]

const REGION_OPTIONS = [
  { value: 'East Anglian Region',    label: 'East Anglian Region' },
  { value: 'East Midlands Region',   label: 'East Midlands Region' },
  { value: 'Ireland',                label: 'Ireland' },
  { value: 'London Region',          label: 'London Region' },
  { value: 'North Region',           label: 'North Region' },
  { value: 'North Western Region',   label: 'North Western Region' },
  { value: 'Scotland',               label: 'Scotland' },
  { value: 'South East Region',      label: 'South East Region' },
  { value: 'South Region',           label: 'South Region' },
  { value: 'South West Region',      label: 'South West Region' },
  { value: 'Wales',                  label: 'Wales' },
  { value: 'West Midlands Region',   label: 'West Midlands Region' },
  { value: 'Yorkshire Region',       label: 'Yorkshire Region' },
]

const EDUCATION_OPTIONS = [
  { value: 'No Formal quals',              label: 'No Formal Qualifications' },
  { value: 'Lower Than A Level',           label: 'Lower Than A Level' },
  { value: 'A Level or Equivalent',        label: 'A Level or Equivalent' },
  { value: 'HE Qualification',             label: 'HE Qualification' },
  { value: 'Post Graduate Qualification',  label: 'Post Graduate Qualification' },
]

const IMD_OPTIONS = [
  { value: '0-10%',   label: '0–10% (most deprived)' },
  { value: '10-20%',  label: '10–20%' },
  { value: '20-30%',  label: '20–30%' },
  { value: '30-40%',  label: '30–40%' },
  { value: '40-50%',  label: '40–50%' },
  { value: '50-60%',  label: '50–60%' },
  { value: '60-70%',  label: '60–70%' },
  { value: '70-80%',  label: '70–80%' },
  { value: '80-90%',  label: '80–90%' },
  { value: '90-100%', label: '90–100% (least deprived)' },
]

const AGE_OPTIONS = [
  { value: '0-35',  label: 'Under 35' },
  { value: '35-55', label: '35–55' },
  { value: '55<=',  label: '55 or older' },
]

const DISABILITY_OPTIONS = [
  { value: 'N', label: 'No' },
  { value: 'Y', label: 'Yes' },
]

// ---------------------------------------------------------------------------
// Default form values
// ---------------------------------------------------------------------------
const DEFAULT_FORM: PredictionInput = {
  num_of_prev_attempts: 0,
  studied_credits: 60,
  avg_score: 50,
  total_clicks: 500,
  completion_rate: 0.5,
  code_module: 'BBB',
  gender: 'M',
  region: 'South East Region',
  highest_education: 'A Level or Equivalent',
  imd_band: '50-60%',
  age_band: '0-35',
  disability: 'N',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PredictionForm() {
  const [form, setForm] = useState<PredictionInput>(DEFAULT_FORM)
  const { mutate: predict, data: result, isPending, error, reset } = usePrediction()

  const handleNumeric = (field: keyof PredictionInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }))
    if (result) reset()
  }

  const handleSelect = (field: keyof PredictionInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (result) reset()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    predict(form)
  }

  const riskColor =
    result?.risk_level === 'high'   ? 'text-red-600 dark:text-red-400' :
    result?.risk_level === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                                      'text-green-600 dark:text-green-400'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Manual Risk Prediction
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Numeric Features */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
            Academic &amp; Engagement Metrics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input
              id="avg_score"
              label="Avg. Score (0–100)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.avg_score}
              onChange={(e) => handleNumeric('avg_score', e.target.value)}
            />
            <Input
              id="completion_rate"
              label="Completion Rate (0–1)"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={form.completion_rate}
              onChange={(e) => handleNumeric('completion_rate', e.target.value)}
            />
            <Input
              id="total_clicks"
              label="Total VLE Clicks"
              type="number"
              min={0}
              value={form.total_clicks}
              onChange={(e) => handleNumeric('total_clicks', e.target.value)}
            />
            <Input
              id="studied_credits"
              label="Studied Credits"
              type="number"
              min={0}
              value={form.studied_credits}
              onChange={(e) => handleNumeric('studied_credits', e.target.value)}
            />
            <Input
              id="num_of_prev_attempts"
              label="Prev. Attempts"
              type="number"
              min={0}
              max={10}
              value={form.num_of_prev_attempts}
              onChange={(e) => handleNumeric('num_of_prev_attempts', e.target.value)}
            />
          </div>
        </div>

        {/* Categorical Features */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
            Student Demographics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Select
              id="code_module"
              label="Module"
              options={MODULE_OPTIONS}
              value={form.code_module}
              onChange={(e) => handleSelect('code_module', e.target.value)}
            />
            <Select
              id="gender"
              label="Gender"
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(e) => handleSelect('gender', e.target.value)}
            />
            <Select
              id="age_band"
              label="Age Band"
              options={AGE_OPTIONS}
              value={form.age_band}
              onChange={(e) => handleSelect('age_band', e.target.value)}
            />
            <Select
              id="disability"
              label="Disability"
              options={DISABILITY_OPTIONS}
              value={form.disability}
              onChange={(e) => handleSelect('disability', e.target.value)}
            />
            <Select
              id="highest_education"
              label="Highest Education"
              options={EDUCATION_OPTIONS}
              value={form.highest_education}
              onChange={(e) => handleSelect('highest_education', e.target.value)}
            />
            <Select
              id="imd_band"
              label="IMD Band (Deprivation)"
              options={IMD_OPTIONS}
              value={form.imd_band}
              onChange={(e) => handleSelect('imd_band', e.target.value)}
            />
            <Select
              id="region"
              label="Region"
              options={REGION_OPTIONS}
              value={form.region}
              onChange={(e) => handleSelect('region', e.target.value)}
              className="sm:col-span-2"
            />
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Predicting...' : 'Predict Risk'}
        </Button>
      </form>

      {/* Loading */}
      {isPending && <LoadingState message="Running prediction..." />}

      {/* Error */}
      {error && (
        <Alert variant="error" title="Prediction Failed" className="mt-4">
          Could not reach the prediction API. Make sure the backend is running.
        </Alert>
      )}

      {/* Result */}
      {result && !isPending && (
        <div className="mt-6 pt-6 border-t border-surface-100 dark:border-surface-800 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <RiskCircle probability={result.risk_probability} size="lg" />
            <p className={`text-sm font-semibold capitalize ${riskColor}`}>
              {result.risk_level} Risk
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Score: {result.risk_score}/100
            </p>
          </div>

          {result.top_factors && result.top_factors.length > 0 && (
            <ShapFactors factors={result.top_factors} maxDisplay={5} />
          )}
        </div>
      )}
    </Card>
  )
}
