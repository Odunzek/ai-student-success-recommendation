import {
  LayoutDashboard,
  BarChart3,
  Users,
  Lightbulb,
  MessageSquare,
  Database,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  HelpCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useAppStore, type NavRoute } from '../../store/useAppStore'
import { useThemeStore } from '../../store/useThemeStore'
import { useMediaQuery } from '../../lib/hooks'
import { cn } from '../../lib/utils'

const navItems = [
  { route: 'dashboard' as NavRoute, label: 'Dashboard', icon: LayoutDashboard },
  { route: 'risk-assessment' as NavRoute, label: 'Risk Assessment', icon: BarChart3 },
  { route: 'students' as NavRoute, label: 'Student Management', icon: Users },
  { route: 'interventions' as NavRoute, label: 'Interventions', icon: Lightbulb },
  { route: 'chat' as NavRoute, label: 'AI Chat Interface', icon: MessageSquare },
  { route: 'data' as NavRoute, label: 'Data Upload',         icon: Database },
  { route: 'help' as NavRoute, label: 'Help & Documentation', icon: HelpCircle },
]

export function Sidebar() {
  const { activeRoute, setActiveRoute, isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useAppStore()
  const { resolvedTheme, toggleTheme } = useThemeStore()
  const isMobile = useMediaQuery('(max-width: 1024px)')

  // Auto-collapse on small screens
  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true)
  }, [isMobile, setSidebarCollapsed])

  const handleNavClick = (route: NavRoute) => {
    setActiveRoute(route)
    // Auto-close sidebar on mobile after navigation
    if (isMobile) setSidebarCollapsed(true)
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {isMobile && !isSidebarCollapsed && (
          <motion.div
            className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
      </AnimatePresence>

      <motion.nav
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40',
          'bg-surface-950 border-r border-surface-800',
          'flex flex-col',
          // On mobile, use absolute positioning (overlay mode)
          isMobile && isSidebarCollapsed && '-translate-x-full',
        )}
        animate={{
          width: isMobile ? 256 : (isSidebarCollapsed ? 80 : 256),
          x: (isMobile && isSidebarCollapsed) ? -256 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-800 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-400" />
          </div>
          <AnimatePresence>
            {(!isSidebarCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-sm font-bold text-white truncate">AI-Powered</span>
                <span className="text-xs text-surface-400 truncate">Student Success</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeRoute === item.route
            const showLabel = !isSidebarCollapsed || isMobile
            return (
              <motion.button
                key={item.route}
                onClick={() => handleNavClick(item.route)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'text-sm font-medium transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  isActive
                    ? 'text-white bg-primary-600/15'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800/60'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', !showLabel && 'mx-auto')} />

                <AnimatePresence>
                  {showLabel && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>

        {/* Bottom Section: User + Controls */}
        <div className="border-t border-surface-800 p-3 space-y-2">
          {/* User Profile */}
          <div className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-xl',
            !isMobile && isSidebarCollapsed && 'justify-center'
          )}>
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-600/30 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-300">DA</span>
            </div>
            <AnimatePresence>
              {(!isSidebarCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col min-w-0"
                >
                  <span className="text-sm font-medium text-white truncate">Dr. A. Advisor</span>
                  <span className="text-xs text-surface-500 truncate">Academic Advisor</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls Row */}
          <div className={cn(
            'flex items-center',
            !isMobile && isSidebarCollapsed ? 'flex-col gap-2' : 'gap-1 px-1'
          )}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Logout */}
            <button
              className="p-2 rounded-lg text-surface-400 hover:text-danger-400 hover:bg-surface-800 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Collapse Toggle (hidden on mobile) */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className={cn(
                  'p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors',
                  !isSidebarCollapsed && 'ml-auto'
                )}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!isSidebarCollapsed}
              >
                {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </motion.nav>
    </>
  )
}
