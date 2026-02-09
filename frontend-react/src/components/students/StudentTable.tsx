import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Eye, User } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { getRiskLevel } from '../../lib/utils'
import { tableRow, staggerContainer } from '../../lib/animations'
import type { Student } from '../../types/student'

interface StudentTableProps {
  students: Student[]
  onViewStudent: (studentId: string) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function StudentTable({
  students,
  onViewStudent,
  page,
  totalPages,
  onPageChange,
}: StudentTableProps) {
  const getRiskBadgeVariant = (risk: number | undefined) => {
    if (risk === undefined) return 'default'
    const level = getRiskLevel(risk)
    return level === 'high' ? 'danger' : level === 'medium' ? 'warning' : 'success'
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
              <th className="text-left py-4 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Student
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Age
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Grades
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Absences
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Risk
              </th>
              <th className="text-right py-4 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <AnimatePresence mode="wait">
            <motion.tbody
              key={page}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {students.map((student, index) => (
                <motion.tr
                  key={student.id}
                  variants={tableRow}
                  custom={index}
                  className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                  whileHover={{ x: 4 }}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">
                          {student.student_id}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {student.gender === 'M' ? 'Male' : 'Female'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {student.age} years
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <GradePill label="G1" value={student.g1} />
                      <GradePill label="G2" value={student.g2} />
                      <GradePill label="G3" value={student.g3} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {student.absences}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={getRiskBadgeVariant(student.dropout_risk)} animate>
                      {student.dropout_risk !== undefined
                        ? `${(student.dropout_risk * 100).toFixed(0)}%`
                        : 'N/A'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewStudent(student.student_id)}
                        className="opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </motion.div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>

      {/* Pagination */}
      <motion.div
        className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-sm text-surface-500 dark:text-surface-400">
          Page <span className="font-semibold text-surface-700 dark:text-surface-200">{page}</span> of{' '}
          <span className="font-semibold text-surface-700 dark:text-surface-200">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function GradePill({ label, value }: { label: string; value: number }) {
  const getGradeColor = (grade: number) => {
    if (grade >= 15) return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
    if (grade >= 10) return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
    return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${getGradeColor(value)}`}
    >
      <span className="opacity-70">{label}:</span>
      <span>{value}</span>
    </span>
  )
}
