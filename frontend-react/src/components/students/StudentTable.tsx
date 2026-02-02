import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { getRiskLevel } from '../../lib/utils'
import type { Student } from '../../types/student'

interface StudentTableProps {
  students: Student[]
  onViewStudent: (studentId: string) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function StudentTable({ students, onViewStudent, page, totalPages, onPageChange }: StudentTableProps) {
  const getRiskBadgeVariant = (risk: number | undefined) => {
    if (risk === undefined) return 'default'
    const level = getRiskLevel(risk)
    return level === 'high' ? 'danger' : level === 'medium' ? 'warning' : 'success'
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Gender</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Age</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">G1</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">G2</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">G3</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Absences</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Risk</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {student.student_id}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {student.gender === 'M' ? 'Male' : 'Female'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.age}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.g1}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.g2}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.g3}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.absences}</td>
                <td className="py-3 px-4">
                  <Badge variant={getRiskBadgeVariant(student.dropout_risk)}>
                    {student.dropout_risk !== undefined
                      ? `${(student.dropout_risk * 100).toFixed(0)}%`
                      : 'N/A'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewStudent(student.student_id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
