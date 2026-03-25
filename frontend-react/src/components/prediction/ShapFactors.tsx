import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { staggerContainer } from '../../lib/animations'
import type { ShapFactor } from '../../types/prediction'

interface ShapFactorsProps {
  factors: ShapFactor[]
  maxDisplay?: number
}

export function ShapFactors({ factors, maxDisplay = 10 }: ShapFactorsProps) {
  const sortedFactors = [...factors]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, maxDisplay)

  const maxImpact = Math.max(...sortedFactors.map((f) => Math.abs(f.impact)))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-surface-900 dark:text-white">
          Key Risk Factors
        </h4>
        <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-danger-500 inline-block" />
            Raises risk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success-500 inline-block" />
            Lowers risk
          </span>
        </div>
      </div>

      <motion.div
        className="space-y-2"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {sortedFactors.map((factor, index) => (
          <FactorBar
            key={index}
            factor={factor}
            maxImpact={maxImpact}
            index={index}
          />
        ))}
      </motion.div>

      <p className="text-xs text-surface-400 dark:text-surface-500 pt-1">
        Bar length shows relative influence on the prediction. Longer = stronger effect.
      </p>
    </div>
  )
}

interface FactorBarProps {
  factor: ShapFactor
  maxImpact: number
  index: number
}

function FactorBar({ factor, maxImpact, index }: FactorBarProps) {
  const isRisk = factor.direction === 'positive'
  const barWidth = (Math.abs(factor.impact) / maxImpact) * 100
  const delay = index * 0.08

  const formattedValue = formatValue(factor.feature, factor.value)

  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      {/* Feature name + value + direction */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {formatFeatureName(factor.feature)}
        </span>
        <div className="flex items-center gap-1.5">
          {formattedValue !== undefined && (
            <span className="text-xs text-surface-500 dark:text-surface-400 tabular-nums">
              {formattedValue}
            </span>
          )}
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            isRisk ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
          )}>
            {isRisk
              ? <TrendingUp className="h-3.5 w-3.5" />
              : <TrendingDown className="h-3.5 w-3.5" />
            }
            {isRisk ? 'Raises risk' : 'Lowers risk'}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="h-2.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            isRisk ? 'bg-danger-400' : 'bg-success-400'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ delay: delay + 0.1, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

function formatFeatureName(name: string): string {
  const labels: Record<string, string> = {
    avg_score: 'Average Score',
    completion_rate: 'Completion Rate',
    total_clicks: 'Platform Activity',
    num_of_prev_attempts: 'Previous Attempts',
    studied_credits: 'Credits Studied',
    module_BBB: 'Module BBB',
    module_CCC: 'Module CCC',
    module_DDD: 'Module DDD',
    module_EEE: 'Module EEE',
    module_FFF: 'Module FFF',
    module_GGG: 'Module GGG',
  }
  return labels[name] ?? name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(feature: string, value: number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined
  if (feature === 'avg_score') return `${Number(value).toFixed(1)} / 100`
  if (feature === 'completion_rate') return `${(Number(value) * 100).toFixed(0)}%`
  if (feature === 'total_clicks') return `${Number(value).toLocaleString()} clicks`
  if (feature === 'num_of_prev_attempts') return `${value} attempt${value !== 1 ? 's' : ''}`
  if (feature === 'studied_credits') return `${value} credits`
  if (feature.startsWith('module_')) return value ? 'Yes' : 'No'
  return String(value)
}
