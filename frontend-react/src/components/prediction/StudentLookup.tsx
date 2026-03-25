import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { LoadingState } from '../ui/Spinner'
import { Alert } from '../ui/Alert'
import { RiskCircle } from './RiskCircle'
import { ShapFactors } from './ShapFactors'
import { useStudents, useStudentPredict } from '../../api/hooks/useStudents'
import { formatPercentage } from '../../lib/utils'

export function StudentLookup() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const { data: studentsData } = useStudents({ per_page: 100 })
  // Pass selectedStudentId directly - hook has enabled: !!id guard that prevents API call when null/0
  const { data: prediction, isLoading: isPredicting, error: predictionError } = useStudentPredict(
    selectedStudentId ?? ''
  )

  useEffect(() => {
    if (studentsData && studentsData.students.length === 0) {
      setSearchQuery('')
      setSelectedStudentId(null)
    }
  }, [studentsData])

  const filteredStudents = useMemo(() => {
    if (!studentsData?.students || !searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return studentsData.students
      .filter((s) => {
        const id = s.student_id ?? ''
        return id.toString().toLowerCase().includes(query)
      })
      .slice(0, 8)
  }, [studentsData?.students, searchQuery])

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId || !studentsData?.students) return null
    return studentsData.students.find((s) => s.id === selectedStudentId)
  }, [selectedStudentId, studentsData?.students])

  const handleSearch = () => {
    if (filteredStudents.length === 1) {
      setSelectedStudentId(filteredStudents[0].id)
      setShowDropdown(false)
    } else if (filteredStudents.length > 0) {
      setShowDropdown(true)
    }
  }

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudentId(studentId)
    setShowDropdown(false)
    const student = studentsData?.students.find((s) => s.id === studentId)
    if (student) {
      setSearchQuery(student.student_id)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowDropdown(true)
    if (!e.target.value.trim()) {
      setSelectedStudentId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Lookup</CardTitle>
      </CardHeader>

      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Enter student ID..."
                className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 dark:text-surface-500" />
            </div>
            <Button onClick={handleSearch} size="md">
              View
            </Button>
          </div>

          {/* Dropdown */}
          {showDropdown && filteredStudents.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelectStudent(student.id)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-surface-50 dark:hover:bg-surface-800 focus:bg-surface-50 dark:focus:bg-surface-800 focus:outline-none"
                >
                  <span className="font-medium">{student.student_id}</span>
                  {student.dropout_risk !== undefined && (
                    <span className="ml-2 text-surface-500 dark:text-surface-400">
                      ({formatPercentage(student.dropout_risk)} risk)
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {!selectedStudentId && !isPredicting && (
          <div className="text-center py-8 text-surface-500 dark:text-surface-400">
            <p>Search for a student by ID to view their risk assessment.</p>
          </div>
        )}

        {isPredicting && <LoadingState message="Loading prediction..." />}

        {predictionError && (
          <Alert variant="error" title="Error">
            Failed to load prediction for this student.
          </Alert>
        )}

        {prediction && selectedStudent && !isPredicting && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <RiskCircle probability={prediction.dropout_probability} size="lg" />
            </div>

            <div className="text-center border-b border-surface-100 dark:border-surface-800 pb-4">
              <p className="text-sm font-medium text-surface-900 dark:text-white">
                Student: {selectedStudent.student_id}
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Confidence: {formatPercentage(prediction.confidence)}
              </p>
            </div>

            {prediction.shap_factors && prediction.shap_factors.length > 0 && (
              <ShapFactors factors={prediction.shap_factors} maxDisplay={5} />
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
