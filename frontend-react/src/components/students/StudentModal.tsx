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
  const { data: student, isLoading: studentLoading, error: studentError } = useStudent(studentId || '')
  const { data: prediction, isLoading: predictionLoading } = useStudentPredict(studentId || '')

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
              <h4 className="text-sm font-medium text-gray-500 mb-2">Demographics</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Student ID" value={student.student_id} />
                <InfoItem label="Gender" value={student.gender === 'M' ? 'Male' : 'Female'} />
                <InfoItem label="Age" value={student.age} />
                <InfoItem label="Address" value={student.address === 'U' ? 'Urban' : 'Rural'} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Family</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Family Size" value={student.family_size} />
                <InfoItem label="Parental Status" value={student.parental_status === 'T' ? 'Together' : 'Apart'} />
                <InfoItem label="Guardian" value={student.guardian} />
                <InfoItem label="Family Relations" value={`${student.family_relations}/5`} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Academic</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Grade 1" value={student.g1} />
                <InfoItem label="Grade 2" value={student.g2} />
                <InfoItem label="Grade 3" value={student.g3} />
                <InfoItem label="Absences" value={student.absences} />
                <InfoItem label="Failures" value={student.failures} />
                <InfoItem label="Study Time" value={`${student.study_time}/4`} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Support</h4>
              <div className="flex flex-wrap gap-2">
                {student.school_support && <Badge variant="primary">School Support</Badge>}
                {student.family_support && <Badge variant="primary">Family Support</Badge>}
                {student.extra_paid && <Badge variant="primary">Extra Classes</Badge>}
                {student.activities && <Badge variant="primary">Activities</Badge>}
                {student.internet && <Badge variant="primary">Internet</Badge>}
                {student.higher && <Badge variant="success">Wants Higher Ed</Badge>}
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
              <div className="text-center py-8 text-gray-500">
                <p>No prediction data available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}
