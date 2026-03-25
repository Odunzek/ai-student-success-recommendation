import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'
import { buttonHover, buttonPress } from '../../lib/animations'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: cn(
        'bg-primary-500 text-white',
        'hover:bg-primary-600 active:bg-primary-700',
        'shadow-md hover:shadow-lg hover:shadow-primary-500/25',
        'dark:bg-primary-600 dark:hover:bg-primary-500',
        'focus:ring-primary-500'
      ),
      secondary: cn(
        'bg-surface-100 text-surface-700',
        'hover:bg-surface-200 active:bg-surface-300',
        'dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700',
        'focus:ring-surface-500'
      ),
      danger: cn(
        'bg-danger-500 text-white',
        'hover:bg-danger-600 active:bg-danger-700',
        'shadow-md hover:shadow-lg hover:shadow-danger-500/25',
        'focus:ring-danger-500'
      ),
      ghost: cn(
        'bg-transparent text-surface-600',
        'hover:bg-surface-100 active:bg-surface-200',
        'dark:text-surface-400 dark:hover:bg-surface-800',
        'focus:ring-surface-500'
      ),
      gradient: cn(
        'text-white bg-gradient-primary',
        'shadow-lg hover:shadow-xl hover:shadow-primary-500/30',
        'dark:hover:shadow-primary-500/20',
        'focus:ring-primary-500'
      ),
      outline: cn(
        'bg-transparent border-2 border-primary-500 text-primary-500',
        'hover:bg-primary-50 active:bg-primary-100',
        'dark:hover:bg-primary-950 dark:text-primary-400',
        'focus:ring-primary-500'
      ),
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
      icon: 'p-2.5',
    }

    const iconSizes = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      icon: 'h-5 w-5',
    }

    const isDisabled = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'dark:focus:ring-offset-surface-900',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isDisabled}
        whileHover={!isDisabled ? buttonHover : undefined}
        whileTap={!isDisabled ? buttonPress : undefined}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
        ) : (
          leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className={iconSizes[size]}>{rightIcon}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

// Icon-only button variant
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'icon', ...props }, ref) => {
    return (
      <Button ref={ref} size={size} className={cn('aspect-square', className)} {...props}>
        {icon}
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'
