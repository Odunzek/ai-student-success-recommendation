import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-surface-900 dark:text-white">
          Key Risk Factors
        </h4>
        <motion.div
          className="p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-help transition-colors"
          whileHover={{ scale: 1.1 }}
          title="SHAP values explain how each feature contributes to the prediction"
        >
          <Info className="h-4 w-4" />
        </motion.div>
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

      {/* Legend */}
      <motion.div
        className="flex items-center justify-center gap-6 pt-3 border-t border-surface-200 dark:border-surface-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded-full bg-gradient-danger" />
          <span className="text-xs text-surface-500 dark:text-surface-400">
            Increases Risk
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded-full bg-gradient-success" />
          <span className="text-xs text-surface-500 dark:text-surface-400">
            Decreases Risk
          </span>
        </div>
      </motion.div>
    </div>
  )
}

interface FactorBarProps {
  factor: ShapFactor
  maxImpact: number
  index: number
}

function FactorBar({ factor, maxImpact, index }: FactorBarProps) {
  const isPositive = factor.direction === 'positive'
  const barWidth = (Math.abs(factor.impact) / maxImpact) * 100
  const delay = index * 0.05

  return (
    <motion.div
      className="group flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-default"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ x: 4 }}
    >
      {/* Feature name */}
      <div
        className="w-28 text-sm text-surface-600 dark:text-surface-400 truncate font-medium"
        title={factor.feature}
      >
        {formatFeatureName(factor.feature)}
      </div>

      {/* Bar container */}
      <div className="flex-1 h-7 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden relative">
        {/* Animated bar */}
        <motion.div
          className={cn(
            'h-full rounded-full relative overflow-hidden',
            isPositive ? 'bg-gradient-danger' : 'bg-gradient-success'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ delay: delay + 0.1, duration: 0.6, ease: 'easeOut' }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              delay: delay + 0.5,
              duration: 0.8,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Hover tooltip */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs font-medium text-surface-700 dark:text-surface-200 bg-white/90 dark:bg-surface-900/90 px-2 py-0.5 rounded-full shadow-sm">
            {factor.value !== undefined && `Value: ${factor.value}`}
          </span>
        </div>
      </div>

      {/* Impact indicator */}
      <motion.div
        className="flex items-center gap-1.5 w-20 justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      >
        <motion.div
          animate={isPositive ? { y: [0, -2, 0] } : { y: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-danger-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-success-500" />
          )}
        </motion.div>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            isPositive ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
          )}
        >
          {isPositive ? '+' : '-'}
          {(Math.abs(factor.impact) * 100).toFixed(1)}%
        </span>
      </motion.div>
    </motion.div>
  )
}

function formatFeatureName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
