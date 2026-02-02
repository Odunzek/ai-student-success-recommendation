import { type ReactNode } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
    success: {
      container: 'bg-success-light border-green-200',
      icon: 'text-success',
      title: 'text-green-800',
      text: 'text-green-700',
    },
    warning: {
      container: 'bg-warning-light border-yellow-200',
      icon: 'text-warning',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
    },
    error: {
      container: 'bg-danger-light border-red-200',
      icon: 'text-danger',
      title: 'text-red-800',
      text: 'text-red-700',
    },
  }

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
  }

  const Icon = icons[variant]
  const styles = variants[variant]

  return (
    <div className={cn('rounded-lg border p-4', styles.container, className)}>
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0', styles.icon)} />
        <div>
          {title && <h4 className={cn('font-medium mb-1', styles.title)}>{title}</h4>}
          <div className={cn('text-sm', styles.text)}>{children}</div>
        </div>
      </div>
    </div>
  )
}
