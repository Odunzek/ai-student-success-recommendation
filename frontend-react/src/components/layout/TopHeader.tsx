/**
 * TopHeader.tsx - Top navigation header with search and status
 *
 * Features:
 * - Page title display
 * - Global student search (navigates to Students page with filter)
 * - Mobile hamburger menu
 * - API health status indicator
 */

import { useState, useEffect, useCallback } from 'react'
import { Search, Menu } from 'lucide-react'
import { useAppStore, type NavRoute } from '../../store/useAppStore'
import { useApiStatus } from '../../api/hooks/useDashboard'
import { useMediaQuery } from '../../lib/hooks'
import { cn } from '../../lib/utils'

const pageTitles: Record<NavRoute, string> = {
  'dashboard': 'Advisor Dashboard - Spring 2026 Term',
  'risk-assessment': 'Risk Assessment',
  'students': 'Student Management',
  'interventions': 'Intervention Planning',
  'chat': 'AI Chat Interface',
  'data': 'Data Management',
}

export function TopHeader() {
  const activeRoute = useAppStore((s) => s.activeRoute)
  const setActiveRoute = useAppStore((s) => s.setActiveRoute)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const { data: health } = useApiStatus()
  const isMobile = useMediaQuery('(max-width: 1024px)')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  /**
   * Handle search submission - navigate to students page with search filter
   */
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // Navigate to students page - the search will be handled there
      setActiveRoute('students')
      // Store search query in sessionStorage for students page to pick up
      sessionStorage.setItem('global_search_query', searchQuery.trim())
      // Dispatch custom event so StudentsTab can react
      window.dispatchEvent(new CustomEvent('globalSearch', { detail: searchQuery.trim() }))
    }
  }, [searchQuery, setActiveRoute])

  /**
   * Handle keyboard shortcuts (Ctrl+K to focus search)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        searchInput?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30',
        'h-16 px-6',
        'flex items-center justify-between',
        'bg-surface-900/80 backdrop-blur-md',
        'border-b border-surface-800',
      )}
      role="banner"
    >
      {/* Left: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 -ml-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-white">
          {pageTitles[activeRoute]}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Global Search - searches students by ID */}
        <form
          className="relative hidden md:block"
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
          <input
            id="global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students... (Ctrl+K)"
            className={cn(
              'w-64 pl-9 pr-4 py-2 rounded-xl text-sm',
              'bg-surface-800/60 border border-surface-700',
              'text-surface-300 placeholder:text-surface-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'transition-colors',
            )}
          />
        </form>

        {/* API Status */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              health?.status === 'healthy'
                ? 'bg-success-500 shadow-[0_0_6px] shadow-success-500/50'
                : 'bg-danger-500 shadow-[0_0_6px] shadow-danger-500/50'
            )}
          />
          <span className="text-xs text-surface-400 hidden sm:inline">
            {health?.status === 'healthy' ? 'System Online' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
