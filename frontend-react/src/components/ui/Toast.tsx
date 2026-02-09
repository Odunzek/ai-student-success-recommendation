import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toastSlideIn } from '../../lib/animations'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = { ...toast, id }
      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss
      const duration = toast.duration ?? 5000
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast]
  )

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ type: 'success', title, description })
    },
    [addToast]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ type: 'error', title, description })
    },
    [addToast]
  )

  const warning = useCallback(
    (title: string, description?: string) => {
      addToast({ type: 'warning', title, description })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ type: 'info', title, description })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const styles = {
    success: {
      bg: 'bg-success-50 dark:bg-success-950/50',
      border: 'border-success-200 dark:border-success-800',
      icon: 'text-success-500',
      title: 'text-success-900 dark:text-success-100',
      description: 'text-success-700 dark:text-success-300',
    },
    error: {
      bg: 'bg-danger-50 dark:bg-danger-950/50',
      border: 'border-danger-200 dark:border-danger-800',
      icon: 'text-danger-500',
      title: 'text-danger-900 dark:text-danger-100',
      description: 'text-danger-700 dark:text-danger-300',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-950/50',
      border: 'border-warning-200 dark:border-warning-800',
      icon: 'text-warning-500',
      title: 'text-warning-900 dark:text-warning-100',
      description: 'text-warning-700 dark:text-warning-300',
    },
    info: {
      bg: 'bg-primary-50 dark:bg-primary-950/50',
      border: 'border-primary-200 dark:border-primary-800',
      icon: 'text-primary-500',
      title: 'text-primary-900 dark:text-primary-100',
      description: 'text-primary-700 dark:text-primary-300',
    },
  }

  const Icon = icons[toast.type]
  const style = styles[toast.type]

  return (
    <motion.div
      layout
      variants={toastSlideIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'pointer-events-auto w-80 rounded-xl border shadow-lg',
        'backdrop-blur-sm',
        style.bg,
        style.border
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', style.icon)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', style.title)}>{toast.title}</p>
          {toast.description && (
            <p className={cn('mt-1 text-sm', style.description)}>
              {toast.description}
            </p>
          )}
        </div>
        <motion.button
          onClick={() => onDismiss(toast.id)}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg',
            'text-surface-400 hover:text-surface-600',
            'dark:text-surface-500 dark:hover:text-surface-300',
            'hover:bg-surface-100 dark:hover:bg-surface-800',
            'transition-colors duration-200'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// Standalone toast component for simpler use cases
interface SimpleToastProps {
  type: ToastType
  title: string
  description?: string
  isVisible: boolean
  onClose: () => void
}

export function SimpleToast({
  type,
  title,
  description,
  isVisible,
  onClose,
}: SimpleToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-4 right-4 z-[100]">
          <ToastItem
            toast={{ id: '1', type, title, description }}
            onDismiss={onClose}
          />
        </div>
      )}
    </AnimatePresence>
  )
}
