import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { PredictionTab } from './pages/PredictionTab'
import { InterventionTab } from './pages/InterventionTab'
import { StudentsTab } from './pages/StudentsTab'
import { DataTab } from './pages/DataTab'
import { ChatTab } from './pages/ChatTab'
import { ToastProvider } from './components/ui/Toast'
import { useAppStore, type NavRoute } from './store/useAppStore'
import { useThemeStore } from './store/useThemeStore'
import { pageTransition } from './lib/animations'

const routes: Record<NavRoute, React.ComponentType> = {
  'dashboard': DashboardPage,
  'risk-assessment': PredictionTab,
  'students': StudentsTab,
  'interventions': InterventionTab,
  'chat': ChatTab,
  'data': DataTab,
}

function App() {
  const activeRoute = useAppStore((state) => state.activeRoute)
  const { resolvedTheme } = useThemeStore()

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolvedTheme])

  const PageComponent = routes[activeRoute] || PredictionTab

  return (
    <ToastProvider>
      <AppLayout>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRoute}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </AppLayout>
    </ToastProvider>
  )
}

export default App
