import { useState } from 'react'
import { Users, AlertTriangle, TrendingDown, Activity } from 'lucide-react'
import { PredictionForm } from '../components/prediction/PredictionForm'
import { RiskCircle } from '../components/prediction/RiskCircle'
import { ShapFactors } from '../components/prediction/ShapFactors'
import { StatCard } from '../components/dashboard/StatCard'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { LoadingState } from '../components/ui/Spinner'
import { usePrediction } from '../api/hooks/usePrediction'
import { useDashboardStats } from '../api/hooks/useDashboard'
import type { PredictionInput, PredictionResult } from '../types/prediction'
import { formatPercentage } from '../lib/utils'

export function PredictionTab() {
  const [result, setResult] = useState<PredictionResult | null>(null)
  const prediction = usePrediction()
  const { data: stats } = useDashboardStats()

  const handleSubmit = async (data: PredictionInput) => {
    const result = await prediction.mutateAsync(data)
    setResult(result)
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.total_students ?? '-'}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="High Risk"
          value={stats?.high_risk_count ?? '-'}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Medium Risk"
          value={stats?.medium_risk_count ?? '-'}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Avg. Risk"
          value={stats?.avg_dropout_probability ? formatPercentage(stats.avg_dropout_probability) : '-'}
          icon={Activity}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <PredictionForm onSubmit={handleSubmit} isLoading={prediction.isPending} />
        </div>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prediction Result</CardTitle>
            </CardHeader>

            {prediction.isPending && <LoadingState message="Analyzing student data..." />}

            {prediction.isError && (
              <Alert variant="error" title="Prediction Failed">
                {prediction.error?.message || 'An error occurred while making the prediction.'}
              </Alert>
            )}

            {!prediction.isPending && !result && !prediction.isError && (
              <div className="text-center py-8 text-gray-500">
                <p>Fill in the student information and click predict to see results.</p>
              </div>
            )}

            {result && !prediction.isPending && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <RiskCircle probability={result.dropout_probability} size="lg" />
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Confidence: {formatPercentage(result.confidence)}
                  </p>
                </div>

                {result.shap_factors && result.shap_factors.length > 0 && (
                  <ShapFactors factors={result.shap_factors} />
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
