import { Brain, Lightbulb, Users, Database, MessageSquare } from 'lucide-react'
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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
