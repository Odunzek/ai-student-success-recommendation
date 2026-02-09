import { motion } from 'framer-motion'
import { Heart, Github, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-surface-200 dark:border-surface-800 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Main text */}
          <motion.div
            className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4 text-accent-500" />
            <span>Student Success Platform</span>
            <span className="text-surface-300 dark:text-surface-600">•</span>
            <span>Built with ML & AI for dropout prevention</span>
          </motion.div>

          {/* Right side */}
          <motion.div
            className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="flex items-center gap-1">
              Made with{' '}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Heart className="h-4 w-4 text-danger-500 fill-danger-500" />
              </motion.span>
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
