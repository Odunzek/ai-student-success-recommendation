import { Users, AlertTriangle, TrendingDown, Activity } from 'lucide-react'
import { StatCard } from '../components/dashboard/StatCard'
import { RiskDistribution } from '../components/prediction/RiskDistribution'
import { StudentLookup } from '../components/prediction/StudentLookup'
import { useDashboardStats } from '../api/hooks/useDashboard'
import { useBatchPrediction } from '../api/hooks/usePrediction'
import { formatPercentage } from '../lib/utils'

export function PredictionTab() {
  const { data: stats } = useDashboardStats()
  const batchPrediction = useBatchPrediction()

  const handleRunBatch = () => {
    batchPrediction.mutate()
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Risk Distribution */}
        <RiskDistribution
          stats={stats}
          onRunBatch={handleRunBatch}
          isRunningBatch={batchPrediction.isPending}
        />

        {/* Right: Student Lookup */}
        <StudentLookup />
      </div>
    </div>
  )
}
