import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { modalBackdrop, modalContent, fadeInUp } from '../../lib/animations'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, closeOnEscape])

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-surface-950/60 dark:bg-surface-950/80 backdrop-blur-sm"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            className={cn(
              'relative z-10 w-full',
              'bg-white dark:bg-surface-900',
              'rounded-2xl shadow-2xl',
              'border border-surface-200 dark:border-surface-800',
              'max-h-[90vh] overflow-hidden',
              'flex flex-col',
              sizes[size]
            )}
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800">
                <motion.div variants={fadeInUp} initial="initial" animate="animate">
                  {title && (
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                      {description}
                    </p>
                  )}
                </motion.div>
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className={cn(
                      'p-2 -m-2 rounded-xl',
                      'text-surface-400 hover:text-surface-600',
                      'dark:text-surface-500 dark:hover:text-surface-300',
                      'hover:bg-surface-100 dark:hover:bg-surface-800',
                      'transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500'
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Body */}
            <div
              className={cn(
                'flex-1 overflow-auto custom-scrollbar',
                !title && !showCloseButton && 'pt-6',
                'px-6 py-4'
              )}
            >
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Modal Footer for action buttons
interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'px-6 py-4',
        'border-t border-surface-200 dark:border-surface-800',
        'bg-surface-50 dark:bg-surface-900/50',
        className
      )}
    >
      {children}
    </div>
  )
}
