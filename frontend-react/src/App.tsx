import { Navbar } from './components/layout/Navbar'
import { TabNav } from './components/layout/TabNav'
import { Footer } from './components/layout/Footer'
import { PredictionTab } from './pages/PredictionTab'
import { InterventionTab } from './pages/InterventionTab'
import { StudentsTab } from './pages/StudentsTab'
import { DataTab } from './pages/DataTab'
import { ChatTab } from './pages/ChatTab'
import { useAppStore } from './store/useAppStore'

function App() {
  const activeTab = useAppStore((state) => state.activeTab)

  const renderTab = () => {
    switch (activeTab) {
      case 'prediction':
        return <PredictionTab />
      case 'intervention':
        return <InterventionTab />
      case 'students':
        return <StudentsTab />
      case 'data':
        return <DataTab />
      case 'chat':
        return <ChatTab />
      default:
        return <PredictionTab />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <TabNav />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderTab()}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
