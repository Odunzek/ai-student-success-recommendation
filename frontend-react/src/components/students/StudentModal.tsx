import { Modal } from '../ui/Modal'
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

          {/* Left Column — Student Info */}
          <div className="space-y-5">

            {/* Identity */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
                Identity
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Name"       value={student.name} />
                <InfoItem label="Student ID" value={student.student_id} />
                <InfoItem label="Gender"     value={formatGender(student.gender)} />
                <InfoItem label="Age Band"   value={student.age_band} />
                <InfoItem label="Disability" value={formatDisability(student.disability)} />
              </div>
            </section>

            {/* Academic context */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
                Academic Context
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Module"          value={student.code_module} />
                <InfoItem label="Studied Credits" value={student.studied_credits} />
                <InfoItem label="Prev Attempts"   value={student.num_of_prev_attempts} />
                <InfoItem label="Education"       value={student.highest_education} />
              </div>
            </section>

            {/* Engagement */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
                Engagement &amp; Performance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem
                  label="Avg Score"
                  value={student.avg_score != null ? `${Number(student.avg_score).toFixed(1)} / 100` : undefined}
                />
                <InfoItem
                  label="Completion Rate"
                  value={student.completion_rate != null ? `${(Number(student.completion_rate) * 100).toFixed(0)}%` : undefined}
                />
                <InfoItem label="Total VLE Clicks" value={student.total_clicks} />
              </div>
            </section>

            {/* Socioeconomic */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
                Background
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Region"    value={student.region} />
                <InfoItem label="IMD Band"  value={student.imd_band} />
              </div>
            </section>
          </div>

          {/* Right Column — Prediction */}
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

// --- Helpers ---

function formatGender(gender: string | undefined): string | undefined {
  if (gender === 'M') return 'Male'
  if (gender === 'F') return 'Female'
  return gender
}

function formatDisability(disability: string | undefined): string | undefined {
  if (disability === 'Y') return 'Yes'
  if (disability === 'N') return 'No'
  return disability
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
