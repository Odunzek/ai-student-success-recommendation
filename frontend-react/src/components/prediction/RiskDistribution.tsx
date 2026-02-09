import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { staggerContainer, fadeInUp } from '../../lib/animations'
import type { DashboardStats } from '../../types/prediction'

interface RiskDistributionProps {
  stats: DashboardStats | undefined
  onRunBatch: () => void
  isRunningBatch: boolean
}

export function RiskDistribution({ stats, onRunBatch, isRunningBatch }: RiskDistributionProps) {
  const high = stats?.high_risk_count ?? 0
  const medium = stats?.medium_risk_count ?? 0
  const low = stats?.low_risk_count ?? 0
  const totalStudents = stats?.total_students ?? 0
  const total = high + medium + low

  const highPct = total > 0 ? (high / total) * 100 : 0
  const mediumPct = total > 0 ? (medium / total) * 100 : 0
  const lowPct = total > 0 ? (low / total) * 100 : 0

  return (
    <Card animate={false} hoverEffect="none">
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
      </CardHeader>

      <div className="flex flex-col items-center">
        <DonutChart high={highPct} medium={mediumPct} low={lowPct} />

        <motion.div
          className="mt-6 space-y-3 w-full"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <LegendItem color="danger" label="High Risk" count={high} percentage={highPct} delay={0.4} />
          <LegendItem color="warning" label="Medium Risk" count={medium} percentage={mediumPct} delay={0.5} />
          <LegendItem color="success" label="Low Risk" count={low} percentage={lowPct} delay={0.6} />
        </motion.div>

        <motion.div
          className="mt-6 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={onRunBatch}
            isLoading={isRunningBatch}
            className="w-full"
            disabled={totalStudents === 0}
            variant="gradient"
            leftIcon={<Play className="h-4 w-4" />}
          >
            Run Batch Prediction
          </Button>
        </motion.div>
      </div>
    </Card>
  )
}

interface DonutChartProps {
  high: number
  medium: number
  low: number
}

function DonutChart({ high, medium, low }: DonutChartProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeWidth = 12
  const total = high + medium + low

  if (total === 0) {
    return (
      <div className="w-40 h-40 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className="stroke-surface-200 dark:stroke-surface-700"
            strokeWidth={strokeWidth}
          />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-surface-400 dark:fill-surface-500 text-xs"
          >
            No data
          </text>
        </svg>
      </div>
    )
  }

  const lowOffset = 0
  const lowLength = (low / 100) * circumference
  const mediumOffset = lowLength
  const mediumLength = (medium / 100) * circumference
  const highOffset = lowLength + mediumLength
  const highLength = (high / 100) * circumference

  return (
    <div className="w-40 h-40 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-surface-100 dark:stroke-surface-800"
          strokeWidth={strokeWidth}
        />

        {/* Low risk segment (green) */}
        {low > 0 && (
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#gradientSuccess)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}`, strokeDashoffset: 0 }}
            animate={{
              strokeDasharray: `${lowLength} ${circumference - lowLength}`,
              strokeDashoffset: -lowOffset,
            }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          />
        )}

        {/* Medium risk segment (yellow) */}
        {medium > 0 && (
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#gradientWarning)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}`, strokeDashoffset: 0 }}
            animate={{
              strokeDasharray: `${mediumLength} ${circumference - mediumLength}`,
              strokeDashoffset: -mediumOffset,
            }}
            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          />
        )}

        {/* High risk segment (red) */}
        {high > 0 && (
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#gradientDanger)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}`, strokeDashoffset: 0 }}
            animate={{
              strokeDasharray: `${highLength} ${circumference - highLength}`,
              strokeDashoffset: -highOffset,
            }}
            transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
          />
        )}

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradientSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="gradientWarning" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="gradientDanger" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <span className="text-2xl font-bold text-surface-900 dark:text-white">
          {total}
        </span>
        <span className="text-xs text-surface-500 dark:text-surface-400">
          Students
        </span>
      </motion.div>
    </div>
  )
}

interface LegendItemProps {
  color: 'success' | 'warning' | 'danger'
  label: string
  count: number
  percentage: number
  delay?: number
}

function LegendItem({ color, label, count, percentage, delay = 0 }: LegendItemProps) {
  const colors = {
    success: 'bg-gradient-success',
    warning: 'bg-gradient-warning',
    danger: 'bg-gradient-danger',
  }

  const textColors = {
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    danger: 'text-danger-600 dark:text-danger-400',
  }

  return (
    <motion.div
      className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${colors[color]}`} />
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${textColors[color]}`}>
          {count}
        </span>
        <span className="text-xs text-surface-400 dark:text-surface-500">
          ({percentage.toFixed(0)}%)
        </span>
      </div>
    </motion.div>
  )
}
