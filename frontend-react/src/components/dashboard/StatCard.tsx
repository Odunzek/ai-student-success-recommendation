import { type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-white border-gray-200',
    primary: 'bg-primary-light border-primary/20',
    success: 'bg-success-light border-green-200',
    warning: 'bg-warning-light border-yellow-200',
    danger: 'bg-danger-light border-red-200',
  }

  const iconVariants = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  }

  return (
    <div className={cn('rounded-xl border p-5', variants[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={cn('mt-2 text-sm', trend.isPositive ? 'text-success' : 'text-danger')}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last week
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', iconVariants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
