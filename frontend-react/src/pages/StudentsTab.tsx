/**
 * StudentsTab.tsx - Student Management Page
 *
 * Displays a searchable, filterable table of all students with:
 * - Search by student ID/name (supports global search from TopHeader)
 * - Filter by risk level
 * - Pagination
 * - View student details (opens global StudentModal)
 */

import { useState, useEffect } from 'react'
import { Search, Users } from 'lucide-react'
import { StudentTable } from '../components/students/StudentTable'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingState } from '../components/ui/Spinner'
import { Alert } from '../components/ui/Alert'
import { useStudents } from '../api/hooks/useStudents'
import { useAppStore } from '../store/useAppStore'

export function StudentsTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('')

  // Get openStudentModal from global store - modal is rendered in AppLayout
  const openStudentModal = useAppStore((s) => s.openStudentModal)

  /**
   * Listen for global search events from TopHeader
   * This allows users to search from anywhere in the app
   */
  useEffect(() => {
    // Check if there's a pending global search
    const pendingSearch = sessionStorage.getItem('global_search_query')
    if (pendingSearch) {
      setSearch(pendingSearch)
      setPage(1)
      sessionStorage.removeItem('global_search_query')
    }

    // Listen for global search events
    const handleGlobalSearch = (e: CustomEvent<string>) => {
      setSearch(e.detail)
      setPage(1)
    }

    window.addEventListener('globalSearch', handleGlobalSearch as EventListener)
    return () => {
      window.removeEventListener('globalSearch', handleGlobalSearch as EventListener)
    }
  }, [])

  const { data, isLoading, error } = useStudents({
    page,
    per_page: 10,
    search: search || undefined,
    risk_level: riskFilter as 'low' | 'medium' | 'high' | undefined,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Student Records</CardTitle>
              {data && (
                <span className="text-sm text-surface-500 dark:text-surface-400">
                  ({data.total} total)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Local search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 dark:text-surface-500" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 pr-4 py-2 text-sm border border-surface-300 dark:border-surface-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                />
              </div>
              {/* Risk level filter */}
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 text-sm border border-surface-300 dark:border-surface-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
              >
                <option value="">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
          </div>
        </CardHeader>

        {isLoading && <LoadingState message="Loading students..." />}

        {error && (
          <Alert variant="error" title="Error">
            Failed to load student records. Make sure you have uploaded student data.
          </Alert>
        )}

        {data && !isLoading && (
          <>
            {data.students.length === 0 ? (
              <div className="text-center py-12 text-surface-500 dark:text-surface-400">
                <Users className="h-12 w-12 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
                <p>No students found.</p>
                {(search || riskFilter) && (
                  <p className="text-sm mt-2">Try adjusting your filters.</p>
                )}
              </div>
            ) : (
              <StudentTable
                students={data.students}
                onViewStudent={openStudentModal}
                page={page}
                totalPages={data.total_pages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>
      {/* StudentModal is rendered globally in AppLayout */}
    </div>
  )
}
