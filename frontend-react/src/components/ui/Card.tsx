import { type HTMLAttributes, forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'
import { cardEntrance, cardHover, cardTap } from '../../lib/animations'

type CardVariant = 'default' | 'glass' | 'gradient' | 'elevated'
type HoverEffect = 'lift' | 'glow' | 'scale' | 'none'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: CardVariant
  hoverEffect?: HoverEffect
  animate?: boolean
  glowColor?: 'primary' | 'success' | 'warning' | 'danger'
  children?: React.ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      padding = 'md',
      variant = 'default',
      hoverEffect = 'lift',
      animate = true,
      glowColor = 'primary',
      children,
      ...props
    },
    ref
  ) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    const variants = {
      default:
        'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm',
      glass: 'glass',
      gradient:
        'bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border border-surface-200 dark:border-surface-800',
      elevated:
        'bg-white dark:bg-surface-900 shadow-lg shadow-surface-900/5 dark:shadow-surface-950/50 border border-surface-100 dark:border-surface-800',
    }

    const glowColors = {
      primary: 'hover:shadow-glow-md',
      success: 'hover:shadow-glow-success',
      warning: 'hover:shadow-glow-warning',
      danger: 'hover:shadow-glow-danger',
    }

    const hoverEffects = {
      lift: 'hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-surface-950/50',
      glow: glowColors[glowColor],
      scale: 'hover:scale-[1.02]',
      none: '',
    }

    const baseClasses = cn(
      'rounded-2xl transition-all duration-300',
      variants[variant],
      paddings[padding],
      hoverEffect !== 'none' && 'cursor-pointer',
      hoverEffects[hoverEffect],
      className
    )

    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={baseClasses}
          initial="initial"
          animate="animate"
          variants={cardEntrance}
          whileHover={hoverEffect === 'lift' ? cardHover : undefined}
          whileTap={hoverEffect !== 'none' ? cardTap : undefined}
          {...props}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseClasses} {...(props as HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  withBorder?: boolean
}

export function CardHeader({
  className,
  children,
  withBorder = false,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4',
        withBorder && 'pb-4 border-b border-surface-200 dark:border-surface-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-surface-900 dark:text-white',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-surface-500 dark:text-surface-400 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 flex items-center gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
