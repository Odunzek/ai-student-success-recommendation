import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import { StudentTable } from '../components/students/StudentTable'
import { StudentModal } from '../components/students/StudentModal'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingState } from '../components/ui/Spinner'
import { Alert } from '../components/ui/Alert'
import { useStudents } from '../api/hooks/useStudents'
import { useAppStore } from '../store/useAppStore'

export function StudentsTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('')

  const { selectedStudentId, isStudentModalOpen, openStudentModal, closeStudentModal } = useAppStore()

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
                <span className="text-sm text-gray-500">
                  ({data.total} total)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
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
            Failed to load student records.
          </Alert>
        )}

        {data && !isLoading && (
          <>
            {data.students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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

      <StudentModal
        studentId={selectedStudentId}
        isOpen={isStudentModalOpen}
        onClose={closeStudentModal}
      />
    </div>
  )
}
