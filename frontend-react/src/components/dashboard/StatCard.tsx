import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'
import { cardEntrance } from '../../lib/animations'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  delay?: number
  badge?: React.ReactNode
  subtitle?: string
  children?: React.ReactNode
}

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const nodeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: 'easeOut',
    })

    return controls.stop
  }, [count, value])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = v.toLocaleString()
      }
    })
    return unsubscribe
  }, [rounded])

  return <span ref={nodeRef}>0</span>
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  delay = 0,
  badge,
  subtitle,
  children,
}: StatCardProps) {
  const variants = {
    default: cn(
      'bg-white dark:bg-surface-900',
      'border border-surface-200 dark:border-surface-800'
    ),
    primary: cn(
      'bg-gradient-to-br from-primary-50 to-primary-100',
      'dark:from-primary-950/50 dark:to-primary-900/30',
      'border border-primary-200/50 dark:border-primary-800/50'
    ),
    success: cn(
      'bg-gradient-to-br from-success-50 to-success-100',
      'dark:from-success-950/50 dark:to-success-900/30',
      'border border-success-200/50 dark:border-success-800/50'
    ),
    warning: cn(
      'bg-gradient-to-br from-warning-50 to-warning-100',
      'dark:from-warning-950/50 dark:to-warning-900/30',
      'border border-warning-200/50 dark:border-warning-800/50'
    ),
    danger: cn(
      'bg-gradient-to-br from-danger-50 to-danger-100',
      'dark:from-danger-950/50 dark:to-danger-900/30',
      'border border-danger-200/50 dark:border-danger-800/50'
    ),
  }

  const iconVariants = {
    default: cn(
      'bg-surface-100 dark:bg-surface-800',
      'text-surface-600 dark:text-surface-400'
    ),
    primary: cn(
      'bg-primary-500/10 dark:bg-primary-500/20',
      'text-primary-600 dark:text-primary-400'
    ),
    success: cn(
      'bg-success-500/10 dark:bg-success-500/20',
      'text-success-600 dark:text-success-400'
    ),
    warning: cn(
      'bg-warning-500/10 dark:bg-warning-500/20',
      'text-warning-600 dark:text-warning-400'
    ),
    danger: cn(
      'bg-danger-500/10 dark:bg-danger-500/20',
      'text-danger-600 dark:text-danger-400'
    ),
  }

  const glowVariants = {
    default: '',
    primary: 'hover:shadow-glow-md',
    success: 'hover:shadow-glow-success',
    warning: 'hover:shadow-glow-warning',
    danger: 'hover:shadow-glow-danger',
  }

  const titleColorVariants = {
    default: 'text-surface-500 dark:text-surface-400',
    primary:
      'text-primary-800 dark:text-white font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.08)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]',
    success:
      'text-success-800 dark:text-white font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.08)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]',
    warning:
      'text-warning-800 dark:text-white font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.08)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]',
    danger:
      'text-danger-800 dark:text-white font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.08)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]',
  }

  const valueColorVariants = {
    default: 'text-surface-900 dark:text-white',
    primary:
      'text-primary-900 dark:text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.06)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.25)]',
    success:
      'text-success-900 dark:text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.06)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.25)]',
    warning:
      'text-warning-900 dark:text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.06)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.25)]',
    danger:
      'text-danger-900 dark:text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.06)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.25)]',
  }

  const subtitleColorVariants = {
    default: 'text-surface-400 dark:text-surface-500',
    primary: 'text-primary-700 dark:text-primary-100',
    success: 'text-success-700 dark:text-success-100',
    warning: 'text-warning-700 dark:text-warning-100',
    danger: 'text-danger-700 dark:text-danger-100',
  }

  const numericValue = typeof value === 'number' ? value : parseFloat(value)
  const isNumeric = !isNaN(numericValue)

  return (
    <motion.div
      className={cn(
        'rounded-2xl p-5 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lg',
        'dark:hover:shadow-surface-950/50',
        variants[variant],
        glowVariants[variant]
      )}
      variants={cardEntrance}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm', titleColorVariants[variant])}>
              {title}
            </p>
            {badge}
          </div>
          {value !== '' && (
            <p className={cn('mt-2 text-3xl font-bold', valueColorVariants[variant])}>
              {isNumeric ? (
                <AnimatedNumber value={numericValue} />
              ) : (
                value
              )}
            </p>
          )}
          {subtitle && (
            <p className={cn('mt-1 text-xs', subtitleColorVariants[variant])}>
              {subtitle}
            </p>
          )}
          {trend && (
            <motion.div
              className={cn(
                'mt-2 flex items-center gap-1 text-sm font-medium',
                trend.isPositive
                  ? 'text-success-600 dark:text-success-400'
                  : 'text-danger-600 dark:text-danger-400'
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.3 }}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {trend.isPositive ? '+' : ''}
                {trend.value}% from last week
              </span>
            </motion.div>
          )}
        </div>
        <motion.div
          className={cn('rounded-xl p-3', iconVariants[variant])}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      </div>
      {children && (
        <div
          className={cn(
            'mt-3',
            variant !== 'default' &&
              'text-surface-800 dark:text-white [&_p]:text-surface-800 dark:[&_p]:text-white'
          )}
        >
          {children}
        </div>
      )}
    </motion.div>
  )
}
