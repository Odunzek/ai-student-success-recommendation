/**
 * DashboardPage.tsx - Main Dashboard View
 *
 * Displays an overview of student risk data including:
 * - Key statistics (at-risk students, interventions, avg. score)
 * - Risk distribution chart
 * - Student alerts with action buttons
 */

import { AlertTriangle, Lightbulb, Activity, Sparkles, Upload, Database } from 'lucide-react'
import { motion } from 'framer-motion'
import { StatCard } from '../components/dashboard/StatCard'
import { RiskDistribution } from '../components/prediction/RiskDistribution'
import { AlertsTable, type AlertItem } from '../components/dashboard/AlertsTable'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/Spinner'
import { useDashboardStats, useRiskSummary } from '../api/hooks/useDashboard'
import { useUploadStatus } from '../api/hooks/useUpload'
import { useAppStore } from '../store/useAppStore'
import { formatPercentage } from '../lib/utils'
import { cardEntrance } from '../lib/animations'

export function DashboardPage() {
  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats()
  const { data: uploadStatus, isLoading: uploadLoading } = useUploadStatus()
  const { data: riskSummary } = useRiskSummary()

  // Global actions
  const openStudentModal = useAppStore((s) => s.openStudentModal)
  const setActiveRoute = useAppStore((s) => s.setActiveRoute)

  /**
   * Open student modal with actual student ID
   * This is called when user clicks "View Profile" on an alert
   */
  const handleViewProfile = (studentId: string) => {
    openStudentModal(studentId)
  }

  const hasData = uploadStatus?.has_data ?? false
  const isLoading = statsLoading || uploadLoading

  // Show loading state
  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />
  }

  // No data uploaded - show empty state
  if (!hasData || statsError) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20"
        variants={cardEntrance}
        initial="initial"
        animate="animate"
      >
        <div className="w-20 h-20 rounded-2xl bg-surface-800 flex items-center justify-center mb-6">
          <Database className="h-10 w-10 text-surface-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No Student Data Available</h2>
        <p className="text-surface-400 text-sm mb-6 text-center max-w-md">
          Upload a student dataset to start viewing risk assessments, predictions, and AI-powered insights.
        </p>
        <Button
          variant="gradient"
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={() => setActiveRoute('data')}
        >
          Upload Dataset
        </Button>
      </motion.div>
    )
  }

  // Data is available - show full dashboard
  const highRisk = stats?.high_risk_count ?? 0
  const mediumRisk = stats?.medium_risk_count ?? 0
  const totalStudents = stats?.total_students ?? 0
  const totalInterventions = highRisk * 2 + mediumRisk

  /**
   * Build alerts from actual student data (not just counts)
   * Each alert now contains a real student ID that can open their profile
   */
  const alerts: AlertItem[] = []

  // Add ALL high-risk students as alerts (expanded from 5 to show more)
  if (riskSummary?.high_risk?.students) {
    riskSummary.high_risk.students.slice(0, 10).forEach((student) => {
      alerts.push({
        studentId: student.student_id,
        riskLevel: 'high',
        description: `High dropout risk (${student.risk_score}%). Immediate attention needed.`,
        aiRecommendation: 'Schedule meeting to review study plan and support options.',
      })
    })
  }

  // Add more medium-risk students (expanded from 3 to 8)
  if (riskSummary?.medium_risk?.students) {
    riskSummary.medium_risk.students.slice(0, 8).forEach((student) => {
      alerts.push({
        studentId: student.student_id,
        riskLevel: 'medium',
        description: `Medium risk indicators (${student.risk_score}%). Monitor closely.`,
        aiRecommendation: 'Send academic resources and schedule check-in.',
      })
    })
  }

  // If no individual student data yet, show summary alerts as fallback
  if (alerts.length === 0) {
    if (highRisk > 0) {
      alerts.push({
        studentId: `Group: ${highRisk} students`,
        riskLevel: 'high',
        description: `${highRisk} students identified as high risk across all courses.`,
        aiRecommendation: 'Run batch prediction to see individual students.',
      })
    }
    if (mediumRisk > 0) {
      alerts.push({
        studentId: `Group: ${mediumRisk} students`,
        riskLevel: 'medium',
        description: `${mediumRisk} students showing medium risk indicators.`,
        aiRecommendation: 'Run batch prediction to see individual students.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="At-Risk Students"
          value={highRisk}
          icon={AlertTriangle}
          variant="danger"
          badge={<Badge variant="danger" size="sm">High Risk</Badge>}
          delay={0}
        />
        <StatCard
          title="Interventions Active"
          value={totalInterventions}
          icon={Lightbulb}
          variant="primary"
          delay={0.1}
        />
        <StatCard
          title="Avg. Predicted Score"
          value={stats?.avg_dropout_probability != null ? formatPercentage(1 - stats.avg_dropout_probability) : '-'}
          icon={Activity}
          variant="warning"
          delay={0.2}
        />
        <StatCard
          title="AI Insight"
          value=""
          icon={Sparkles}
          variant="success"
          delay={0.3}
        >
          <p className="text-xs text-surface-300 leading-relaxed">
            {highRisk > 0
              ? `${highRisk} high-risk students detected out of ${totalStudents}. Consider targeted outreach.`
              : 'All students are currently within normal risk ranges.'}
          </p>
        </StatCard>
      </div>

      {/* Charts and Alerts Row - Risk Distribution + Expanded Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution - 1/3 width */}
        <RiskDistribution stats={stats} />

        {/* Expanded Alerts - 2/3 width */}
        <div className="lg:col-span-2">
          {alerts.length > 0 ? (
            <AlertsTable
              alerts={alerts}
              onViewProfile={handleViewProfile}
            />
          ) : (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-success-500" />
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                All Students On Track
              </h3>
              <p className="text-surface-500 dark:text-surface-400">
                No high or medium risk students detected. All students are currently within normal risk ranges.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
