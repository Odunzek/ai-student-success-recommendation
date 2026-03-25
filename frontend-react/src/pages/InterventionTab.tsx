import { useState, useMemo } from 'react'
import { Sparkles, BookOpen, Search, UserCircle } from 'lucide-react'
import { InterventionCard } from '../components/intervention/InterventionCard'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Toggle } from '../components/ui/Toggle'
import { LoadingState } from '../components/ui/Spinner'
import { RiskCircle } from '../components/prediction/RiskCircle'
import { ShapFactors } from '../components/prediction/ShapFactors'
import { useIntervention } from '../api/hooks/useIntervention'
import { useStudents, useStudentPredict } from '../api/hooks/useStudents'
import { useAppStore } from '../store/useAppStore'
import { useDebounce } from '../hooks/useDebounce'
import { formatPercentage } from '../lib/utils'
import { ApiError } from '../api/client'

// Helper to extract error message from various error types
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An error occurred while generating interventions.'
}

export function InterventionTab() {
  // Use Zustand store for persistent state (survives tab switches)
  const {
    useLlm,
    setUseLlm,
    interventionStudentId,
    interventionSearchQuery,
    interventionResult,
    setInterventionStudentId,
    setInterventionSearchQuery,
    setInterventionResult,
  } = useAppStore()

  // Local UI state (dropdowns don't need persistence)
  const [showDropdown, setShowDropdown] = useState(false)

  const intervention = useIntervention()
  const { data: studentsData } = useStudents({ per_page: 100 })
  const { data: prediction, isLoading: isPredicting } = useStudentPredict(interventionStudentId ?? '')

  // Debounce search query to reduce filtering overhead
  const debouncedSearchQuery = useDebounce(interventionSearchQuery, 200)

  // Filter students based on debounced search
  const filteredStudents = useMemo(() => {
    if (!studentsData?.students || !debouncedSearchQuery.trim()) return []
    const query = debouncedSearchQuery.toLowerCase()
    return studentsData.students.filter(
      (s) => s.student_id.toLowerCase().includes(query)
    ).slice(0, 8)
  }, [studentsData?.students, debouncedSearchQuery])

  // Get selected student data
  const selectedStudent = useMemo(() => {
    if (!interventionStudentId || !studentsData?.students) return null
    return studentsData.students.find((s) => String(s.id) === interventionStudentId)
  }, [interventionStudentId, studentsData?.students])

  const handleSelectStudent = (studentId: number, studentIdStr: string) => {
    setInterventionStudentId(String(studentId))
    setInterventionSearchQuery(studentIdStr)
    setShowDropdown(false)
    // Clear previous result when selecting new student
    setInterventionResult(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInterventionSearchQuery(e.target.value)
    setShowDropdown(true)
    if (!e.target.value.trim()) {
      setInterventionStudentId(null)
      setInterventionResult(null)
    }
  }

  const handleGenerateInterventions = async () => {
    if (!selectedStudent || !prediction) return

    const interventionInput = {
      risk_score: Math.round(prediction.dropout_probability * 100),
      completion_rate: selectedStudent.completion_rate ?? 0.5,
      avg_score: selectedStudent.avg_score ?? 50,
      total_clicks: selectedStudent.total_clicks ?? 0,
      studied_credits: selectedStudent.studied_credits ?? 60,
      num_of_prev_attempts: selectedStudent.num_of_prev_attempts ?? 0,
      student_name: selectedStudent.student_id,
      use_llm: useLlm,
    }

    const result = await intervention.mutateAsync(interventionInput)
    setInterventionResult(result)
  }

  const hasNoData = !studentsData?.students || studentsData.students.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Intervention Generator
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Select a student to generate personalized intervention recommendations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Toggle
            checked={useLlm}
            onChange={setUseLlm}
            label="AI-Enhanced"
          />
        </div>
      </div>

      {hasNoData ? (
        <Alert variant="warning" title="No Student Data">
          Upload student data first to generate interventions. Go to the Data Upload tab.
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Student Selection & Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Student Selection
              </CardTitle>
              <CardDescription>
                Search and select a student to view their risk profile
              </CardDescription>
            </CardHeader>

            {/* Search Input */}
            <div className="relative mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={interventionSearchQuery}
                  onChange={handleInputChange}
                  onFocus={() => interventionSearchQuery && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Search by student ID..."
                  className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 dark:text-surface-500" />
              </div>

              {/* Dropdown */}
              {showDropdown && filteredStudents.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectStudent(student.id, student.student_id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-surface-50 dark:hover:bg-surface-800 focus:bg-surface-50 dark:focus:bg-surface-800 focus:outline-none"
                    >
                      <span className="font-medium">{student.student_id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Student Profile */}
            {!interventionStudentId && (
              <div className="text-center py-12 text-surface-500 dark:text-surface-400">
                <UserCircle className="h-16 w-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
                <p>Search and select a student to view their risk profile</p>
              </div>
            )}

            {isPredicting && <LoadingState message="Loading student profile..." />}

            {selectedStudent && prediction && (
              <div className="space-y-6">
                {/* Risk Circle */}
                <div className="flex justify-center">
                  <RiskCircle probability={prediction.dropout_probability} size="lg" />
                </div>

                {/* Student Info */}
                <div className="text-center border-b border-surface-100 dark:border-surface-800 pb-4">
                  <p className="text-lg font-semibold text-surface-900 dark:text-white">
                    {selectedStudent.student_id}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    Risk Level: <span className={`font-medium ${
                      (interventionResult?.risk_level || prediction.risk_level) === 'high' ? 'text-red-500' :
                      (interventionResult?.risk_level || prediction.risk_level) === 'medium' ? 'text-amber-500' : 'text-green-500'
                    }`}>
                      {(interventionResult?.risk_level || prediction.risk_level)?.toUpperCase()}
                    </span>
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                    <p className="text-surface-500 dark:text-surface-400">Avg Score</p>
                    <p className="font-semibold text-surface-900 dark:text-white">
                      {selectedStudent.avg_score?.toFixed(1) ?? 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                    <p className="text-surface-500 dark:text-surface-400">Completion</p>
                    <p className="font-semibold text-surface-900 dark:text-white">
                      {selectedStudent.completion_rate != null
                        ? formatPercentage(selectedStudent.completion_rate)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                    <p className="text-surface-500 dark:text-surface-400">VLE Clicks</p>
                    <p className="font-semibold text-surface-900 dark:text-white">
                      {selectedStudent.total_clicks ?? 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                    <p className="text-surface-500 dark:text-surface-400">Prev Attempts</p>
                    <p className="font-semibold text-surface-900 dark:text-white">
                      {selectedStudent.num_of_prev_attempts ?? 0}
                    </p>
                  </div>
                </div>

                {/* SHAP Factors */}
                {prediction.shap_factors && prediction.shap_factors.length > 0 && (
                  <ShapFactors factors={prediction.shap_factors} maxDisplay={5} />
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateInterventions}
                  isLoading={intervention.isPending}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Interventions
                </Button>
              </div>
            )}
          </Card>

          {/* Right: Intervention Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recommended Interventions</CardTitle>
                {interventionResult && (
                  <Badge variant={interventionResult.llm_enhanced ? 'primary' : 'default'}>
                    {interventionResult.llm_enhanced ? (
                      <><Sparkles className="h-3 w-3 mr-1" /> AI Enhanced</>
                    ) : (
                      <><BookOpen className="h-3 w-3 mr-1" /> Rule-Based</>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>

            {intervention.isPending && <LoadingState message="Generating interventions..." />}

            {intervention.isError && (
              <Alert variant="error" title="Generation Failed">
                {getErrorMessage(intervention.error)}
              </Alert>
            )}

            {!intervention.isPending && !interventionResult && !intervention.isError && (
              <div className="text-center py-12 text-surface-500 dark:text-surface-400">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
                <p>Select a student and click "Generate Interventions" to see personalized recommendations.</p>
              </div>
            )}

            {interventionResult && !intervention.isPending && (
              <div className="space-y-4">
                {interventionResult.summary && (
                  <Alert variant="info">
                    {interventionResult.summary}
                  </Alert>
                )}

                {interventionResult.interventions.length === 0 ? (
                  <p className="text-center py-8 text-surface-500 dark:text-surface-400">
                    No interventions generated for this student.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {interventionResult.interventions.map((item, index) => (
                      <InterventionCard key={`${item.type}-${item.title}-${index}`} intervention={item} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
