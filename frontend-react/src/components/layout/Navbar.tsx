import { GraduationCap, Activity } from 'lucide-react'
import { useApiStatus } from '../../api/hooks/useDashboard'
import { cn } from '../../lib/utils'

export function Navbar() {
  const { data: health, isError, isLoading } = useApiStatus()
  const isHealthy = !isError && health?.status === 'healthy' && health?.model_loaded
  const statusText = isLoading ? 'Connecting...' : isError ? 'Backend Offline' : isHealthy ? 'System Online' : 'Connecting...'

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Student Success Platform</h1>
              <p className="text-xs text-gray-500">AI-Powered Dropout Prevention</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className={cn('h-4 w-4', isHealthy ? 'text-success' : isError ? 'text-danger' : 'text-gray-400')} />
            <span className={cn('text-sm', isHealthy ? 'text-success' : isError ? 'text-danger' : 'text-gray-500')}>
              {statusText}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
