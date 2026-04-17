import { Users, AlertTriangle, TrendingDown, Activity } from 'lucide-react'
import { StatCard } from '../components/dashboard/StatCard'
import { RiskDistribution } from '../components/prediction/RiskDistribution'
import { StudentLookup } from '../components/prediction/StudentLookup'
import { PredictionForm } from '../components/prediction/PredictionForm'
import { useDashboardStats } from '../api/hooks/useDashboard'
import { formatPercentage } from '../lib/utils'

export function PredictionTab() {
  const { data: stats } = useDashboardStats()

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

      {/* Two Column Layout — Lookup + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistribution stats={stats} />
        <StudentLookup />
      </div>

      {/* Manual Prediction Form */}
      <PredictionForm />
    </div>
  )
}
