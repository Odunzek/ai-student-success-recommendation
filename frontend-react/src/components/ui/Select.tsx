import { forwardRef, type SelectHTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string | number; label: string; disabled?: boolean }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      options,
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl border px-4 py-2.5 text-sm appearance-none',
              'bg-white dark:bg-surface-900',
              'text-surface-900 dark:text-white',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'disabled:bg-surface-100 dark:disabled:bg-surface-800',
              'pr-10',
              error
                ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
                : 'border-surface-300 dark:border-surface-700 focus:border-primary-500 focus:ring-primary-500/20',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400 dark:text-surface-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        {/* Error/Hint messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1.5 text-sm text-danger-600 dark:text-danger-400"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </motion.p>
          )}
          {hint && !error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-surface-500 dark:text-surface-400"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Select.displayName = 'Select'
