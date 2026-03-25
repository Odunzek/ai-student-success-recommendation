import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'
import { getRiskLevel, getRiskColor, formatPercentage } from '../../lib/utils'

interface RiskCircleProps {
  probability: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

export function RiskCircle({
  probability,
  size = 'md',
  showLabel = true,
  animated = true,
}: RiskCircleProps) {
  const risk = getRiskLevel(probability)
  const percentage = probability * 100
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const sizes = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const labelSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }

  const gradients = {
    low: { start: '#10b981', end: '#34d399' },
    medium: { start: '#f59e0b', end: '#fbbf24' },
    high: { start: '#ef4444', end: '#f97316' },
  }

  const glowColors = {
    low: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    medium: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    high: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  }

  return (
    <div className={cn('relative', sizes[size])}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={`riskGradient-${risk}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradients[risk].start} />
            <stop offset="100%" stopColor={gradients[risk].end} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          className="stroke-surface-200 dark:stroke-surface-700"
        />

        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke={`url(#riskGradient-${risk})`}
          className={cn('transition-all', glowColors[risk])}
          initial={animated ? { strokeDasharray: circumference, strokeDashoffset: circumference } : undefined}
          animate={{ strokeDasharray: circumference, strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedPercentage
          value={percentage}
          className={cn('font-bold', textSizes[size], getRiskColor(risk))}
          animated={animated}
        />
        {showLabel && (
          <motion.span
            className={cn(
              'uppercase tracking-wider font-medium mt-1',
              labelSizes[size],
              'text-surface-500 dark:text-surface-400'
            )}
            initial={animated ? { opacity: 0, y: 5 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {risk} Risk
          </motion.span>
        )}
      </div>

      {/* Pulsing glow for high risk */}
      {risk === 'high' && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0)',
              '0 0 0 10px rgba(239, 68, 68, 0.1)',
              '0 0 0 20px rgba(239, 68, 68, 0)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  )
}

interface AnimatedPercentageProps {
  value: number
  className?: string
  animated?: boolean
}

function AnimatedPercentage({ value, className, animated = true }: AnimatedPercentageProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => `${latest.toFixed(1)}%`)
  const nodeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!animated) {
      if (nodeRef.current) {
        nodeRef.current.textContent = `${value.toFixed(1)}%`
      }
      return
    }

    const controls = animate(count, value, {
      duration: 1.5,
      ease: 'easeOut',
    })

    return controls.stop
  }, [count, value, animated])

  useEffect(() => {
    if (!animated) return

    const unsubscribe = rounded.on('change', (v) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = v
      }
    })
    return unsubscribe
  }, [rounded, animated])

  if (!animated) {
    return <span className={className}>{formatPercentage(value / 100)}</span>
  }

  return (
    <motion.span
      ref={nodeRef}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      0%
    </motion.span>
  )
}
