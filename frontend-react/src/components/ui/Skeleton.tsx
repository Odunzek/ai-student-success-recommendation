import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  lines?: number
  animate?: boolean
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
  animate = true,
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-surface-200 dark:bg-surface-700',
    animate && 'shimmer',
    className
  )

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  }

  const style = {
    width: width ?? (variant === 'circular' ? height : '100%'),
    height: height ?? (variant === 'circular' ? width : undefined),
  }

  if (lines > 1 && variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variants[variant])}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn(baseClasses, variants[variant])} style={style} />
  )
}

// Preset skeleton components for common use cases
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-surface-200 dark:border-surface-800',
        'bg-white dark:bg-surface-900',
        className
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-surface-200 dark:border-surface-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1" height={16} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-end justify-center gap-2 h-48', className)}>
      {[60, 80, 45, 90, 65, 75, 50].map((height, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          width={24}
          height={`${height}%`}
          className="flex-shrink-0"
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
  }

  return (
    <Skeleton
      variant="circular"
      width={sizes[size]}
      height={sizes[size]}
      className={className}
    />
  )
}

export function SkeletonButton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: { width: 80, height: 32 },
    md: { width: 100, height: 40 },
    lg: { width: 120, height: 48 },
  }

  return (
    <Skeleton
      variant="rounded"
      width={sizes[size].width}
      height={sizes[size].height}
      className={className}
    />
  )
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-surface-200 dark:border-surface-800',
        'bg-white dark:bg-surface-900',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width={100} height={14} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="text" width={80} height={32} className="mb-2" />
      <Skeleton variant="text" width={120} height={12} />
    </div>
  )
}

export function SkeletonList({
  items = 5,
  className,
}: {
  items?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton variant="text" width="80%" className="mb-2" />
            <Skeleton variant="text" width="60%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}
