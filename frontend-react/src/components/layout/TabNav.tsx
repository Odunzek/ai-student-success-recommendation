import { Brain, Lightbulb, Users, Database, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/utils'

const tabs = [
  { id: 'prediction', label: 'Prediction', icon: Brain },
  { id: 'intervention', label: 'Intervention', icon: Lightbulb },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
] as const

export function TabNav() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav className="sticky top-16 z-30 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto py-3 no-scrollbar">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
                  'transition-colors duration-200 whitespace-nowrap',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'dark:focus:ring-offset-surface-900',
                  isActive
                    ? 'text-white'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800'
                )}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={!isActive ? { scale: 1.02 } : undefined}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-gradient-primary rounded-xl shadow-lg shadow-primary-500/25"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                {/* Tab content */}
                <span className="relative z-10 flex items-center gap-2">
                  <motion.span
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.span>
                  <span>{tab.label}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
