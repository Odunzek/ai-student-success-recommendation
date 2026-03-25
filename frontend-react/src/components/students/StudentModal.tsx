import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { LoadingState } from '../ui/Spinner'
import { Alert } from '../ui/Alert'
import { RiskCircle } from '../prediction/RiskCircle'
import { ShapFactors } from '../prediction/ShapFactors'
import { useStudent, useStudentPredict } from '../../api/hooks/useStudents'

interface StudentModalProps {
  studentId: string | null
  isOpen: boolean
  onClose: () => void
}

export function StudentModal({ studentId, isOpen, onClose }: StudentModalProps) {
  // Pass studentId directly - the hooks have enabled: !!id guard that handles null/empty
  const { data: student, isLoading: studentLoading, error: studentError } = useStudent(studentId ?? '')
  const { data: prediction, isLoading: predictionLoading } = useStudentPredict(studentId ?? '')

  const isLoading = studentLoading || predictionLoading

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Details" size="lg">
      {isLoading && <LoadingState message="Loading student data..." />}

      {studentError && (
        <Alert variant="error" title="Error">
          Failed to load student data.
        </Alert>
      )}

      {student && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Student Info */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">Demographics</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Student ID" value={student.student_id} />
                <InfoItem label="Gender" value={formatGender(student.gender)} />
                <InfoItem label="Age" value={formatAge(student.age, student.age_band)} />
                <InfoItem label="Address" value={formatAddress(student.address)} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">Engagement &amp; scores</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Avg score" value={student.avg_score != null ? Number(student.avg_score).toFixed(1) : undefined} />
                <InfoItem label="Total clicks" value={student.total_clicks} />
                <InfoItem label="Completion rate" value={student.completion_rate != null ? `${(Number(student.completion_rate) * 100).toFixed(0)}%` : undefined} />
                <InfoItem label="Prev attempts" value={student.num_of_prev_attempts} />
                <InfoItem label="Studied credits" value={student.studied_credits} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">Academic (grades)</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Grade 1 (G1)" value={student.g1} />
                <InfoItem label="Grade 2 (G2)" value={student.g2} />
                <InfoItem label="Grade 3 (G3)" value={student.g3} />
                <InfoItem label="Absences" value={student.absences} />
                <InfoItem label="Failures" value={student.failures} />
                <InfoItem label="Study time" value={student.study_time != null ? `${student.study_time}/4` : undefined} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">Family</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Family size" value={student.family_size} />
                <InfoItem label="Parental status" value={formatParentalStatus(student.parental_status)} />
                <InfoItem label="Guardian" value={student.guardian} />
                <InfoItem label="Family relations" value={student.family_relations != null ? `${student.family_relations}/5` : undefined} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">Support</h4>
              <div className="flex flex-wrap gap-2">
                {student.school_support && <Badge variant="primary">School Support</Badge>}
                {student.family_support && <Badge variant="primary">Family Support</Badge>}
                {student.extra_paid && <Badge variant="primary">Extra Classes</Badge>}
                {student.activities && <Badge variant="primary">Activities</Badge>}
                {student.internet && <Badge variant="primary">Internet</Badge>}
                {student.higher && <Badge variant="success">Wants Higher Ed</Badge>}
                {!student.school_support && !student.family_support && !student.extra_paid && !student.activities && !student.internet && !student.higher && (
                  <span className="text-sm text-surface-500 dark:text-surface-400">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Prediction */}
          <div className="space-y-4">
            {prediction ? (
              <>
                <div className="flex justify-center">
                  <RiskCircle probability={prediction.dropout_probability} size="lg" />
                </div>
                {prediction.shap_factors && prediction.shap_factors.length > 0 && (
                  <ShapFactors factors={prediction.shap_factors} maxDisplay={8} />
                )}
              </>
            ) : (
              <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                <p>No prediction data available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function formatGender(gender: string | number | undefined): string | undefined {
  if (gender === 'M' || gender === 1) return 'Male'
  if (gender === 'F' || gender === 0) return 'Female'
  return undefined
}

function formatAge(age: number | undefined, age_band: number | undefined): string | undefined {
  if (age != null) return `${age}`
  if (age_band != null) {
    const bands: Record<number, string> = { 0: '18-25', 1: '26-35', 2: '35-55', 3: '55+' }
    return bands[Number(age_band)] ?? `${age_band}`
  }
  return undefined
}

function formatAddress(address: string | undefined): string | undefined {
  if (address === 'U') return 'Urban'
  if (address === 'R') return 'Rural'
  return undefined
}

function formatParentalStatus(status: string | undefined): string | undefined {
  if (status === 'T') return 'Together'
  if (status === 'A') return 'Apart'
  return undefined
}

function InfoItem({ label, value }: { label: string; value: string | number | undefined }) {
  const display = value !== undefined && value !== null && value !== '' ? String(value) : '—'
  return (
    <div>
      <dt className="text-xs text-surface-500 dark:text-surface-400">{label}</dt>
      <dd className="text-sm font-medium text-surface-900 dark:text-white">{display}</dd>
    </div>
  )
}
