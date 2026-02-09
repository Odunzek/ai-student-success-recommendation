import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
  dismissible?: boolean
  onDismiss?: () => void
  icon?: ReactNode
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  dismissible = false,
  onDismiss,
  icon,
}: AlertProps) {
  const variants = {
    info: {
      container: cn(
        'bg-primary-50 border-primary-200',
        'dark:bg-primary-950/30 dark:border-primary-800/50'
      ),
      icon: 'text-primary-600 dark:text-primary-400',
      title: 'text-primary-900 dark:text-primary-100',
      text: 'text-primary-700 dark:text-primary-300',
    },
    success: {
      container: cn(
        'bg-success-50 border-success-200',
        'dark:bg-success-950/30 dark:border-success-800/50'
      ),
      icon: 'text-success-600 dark:text-success-400',
      title: 'text-success-900 dark:text-success-100',
      text: 'text-success-700 dark:text-success-300',
    },
    warning: {
      container: cn(
        'bg-warning-50 border-warning-200',
        'dark:bg-warning-950/30 dark:border-warning-800/50'
      ),
      icon: 'text-warning-600 dark:text-warning-400',
      title: 'text-warning-900 dark:text-warning-100',
      text: 'text-warning-700 dark:text-warning-300',
    },
    error: {
      container: cn(
        'bg-danger-50 border-danger-200',
        'dark:bg-danger-950/30 dark:border-danger-800/50'
      ),
      icon: 'text-danger-600 dark:text-danger-400',
      title: 'text-danger-900 dark:text-danger-100',
      text: 'text-danger-700 dark:text-danger-300',
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
    <motion.div
      className={cn(
        'rounded-xl border p-4',
        styles.container,
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex gap-3">
        <div className={cn('flex-shrink-0', styles.icon)}>
          {icon || <Icon className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className={cn('font-semibold mb-1', styles.title)}>{title}</h4>
          )}
          <div className={cn('text-sm', styles.text)}>{children}</div>
        </div>
        {dismissible && onDismiss && (
          <motion.button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-lg transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/5',
              styles.icon
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// Animated alert wrapper for show/hide
interface AnimatedAlertProps extends AlertProps {
  show: boolean
}

export function AnimatedAlert({ show, ...props }: AnimatedAlertProps) {
  return (
    <AnimatePresence>
      {show && <Alert {...props} />}
    </AnimatePresence>
  )
}
