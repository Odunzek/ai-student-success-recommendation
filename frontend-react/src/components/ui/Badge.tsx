import { type HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'accent'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  animate?: boolean
  pulse?: boolean
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  animate = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: cn(
      'bg-surface-100 text-surface-700',
      'dark:bg-surface-800 dark:text-surface-300'
    ),
    primary: cn(
      'bg-primary-100 text-primary-700',
      'dark:bg-primary-900/30 dark:text-primary-400'
    ),
    accent: cn(
      'bg-accent-100 text-accent-700',
      'dark:bg-accent-900/30 dark:text-accent-400'
    ),
    success: cn(
      'bg-success-100 text-success-700',
      'dark:bg-success-900/30 dark:text-success-400'
    ),
    warning: cn(
      'bg-warning-100 text-warning-700',
      'dark:bg-warning-900/30 dark:text-warning-400'
    ),
    danger: cn(
      'bg-danger-100 text-danger-700',
      'dark:bg-danger-900/30 dark:text-danger-400'
    ),
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }

  const dotColors = {
    default: 'bg-surface-500',
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  }

  const baseClasses = cn(
    'inline-flex items-center gap-1.5 rounded-full font-medium',
    'transition-all duration-200',
    variants[variant],
    sizes[size],
    className
  )

  const content = (
    <>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', dotColors[variant])}
          />
        </span>
      )}
      {children}
    </>
  )

  if (animate) {
    return (
      <motion.span
        className={baseClasses}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.05 }}
      >
        {content}
      </motion.span>
    )
  }

  return (
    <span className={baseClasses} {...props}>
      {content}
    </span>
  )
}

// Badge Group for multiple badges
interface BadgeGroupProps {
  children: React.ReactNode
  className?: string
}

export function BadgeGroup({ children, className }: BadgeGroupProps) {
  return <div className={cn('flex flex-wrap gap-1.5', className)}>{children}</div>
}
