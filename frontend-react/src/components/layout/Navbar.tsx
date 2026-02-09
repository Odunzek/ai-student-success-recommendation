import { GraduationCap, Activity, Moon, Sun, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useApiStatus } from '../../api/hooks/useDashboard'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/utils'

export function Navbar() {
  const { data: health, isError, isLoading } = useApiStatus()
  const { resolvedTheme, toggleTheme } = useThemeStore()

  const isHealthy = !isError && health?.status === 'healthy' && health?.model_loaded
  const statusText = isLoading
    ? 'Connecting...'
    : isError
    ? 'Backend Offline'
    : isHealthy
    ? 'System Online'
    : 'Connecting...'

  return (
    <header className="sticky top-0 z-40 glass border-b border-surface-200/50 dark:border-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary shadow-lg shadow-primary-500/25"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <GraduationCap className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                Student Success Platform
                <Sparkles className="h-4 w-4 text-accent-500" />
              </h1>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                AI-Powered Dropout Prevention
              </p>
            </div>
          </motion.div>

          {/* Right side: Status and Theme Toggle */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* System Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800">
              <motion.div
                animate={
                  isHealthy
                    ? {
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Activity
                  className={cn(
                    'h-4 w-4',
                    isHealthy
                      ? 'text-success-500'
                      : isError
                      ? 'text-danger-500'
                      : 'text-surface-400 dark:text-surface-500'
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  'text-sm font-medium',
                  isHealthy
                    ? 'text-success-600 dark:text-success-400'
                    : isError
                    ? 'text-danger-600 dark:text-danger-400'
                    : 'text-surface-500 dark:text-surface-400'
                )}
              >
                {statusText}
              </span>
            </div>

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className={cn(
                'p-2.5 rounded-xl',
                'bg-surface-100 dark:bg-surface-800',
                'hover:bg-surface-200 dark:hover:bg-surface-700',
                'text-surface-600 dark:text-surface-300',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
            >
              <motion.div
                initial={false}
                animate={{ rotate: resolvedTheme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </motion.div>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </header>
  )
}
