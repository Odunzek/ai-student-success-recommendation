import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './components/layout/Navbar'
import { TabNav } from './components/layout/TabNav'
import { Footer } from './components/layout/Footer'
import { PredictionTab } from './pages/PredictionTab'
import { InterventionTab } from './pages/InterventionTab'
import { StudentsTab } from './pages/StudentsTab'
import { DataTab } from './pages/DataTab'
import { ChatTab } from './pages/ChatTab'
import { ToastProvider } from './components/ui/Toast'
import { useAppStore } from './store/useAppStore'
import { useThemeStore } from './store/useThemeStore'
import { pageTransition } from './lib/animations'

function App() {
  const activeTab = useAppStore((state) => state.activeTab)
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

  const tabs = {
    prediction: PredictionTab,
    intervention: InterventionTab,
    students: StudentsTab,
    data: DataTab,
    chat: ChatTab,
  }

  const TabComponent = tabs[activeTab] || PredictionTab

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
        {/* Background mesh gradient */}
        <div className="fixed inset-0 mesh-gradient pointer-events-none" />

        {/* Main content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <TabNav />

          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={pageTransition}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <TabComponent />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ToastProvider>
  )
}

export default App
