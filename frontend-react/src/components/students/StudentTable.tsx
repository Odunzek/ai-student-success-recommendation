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
                Module
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Avg Score
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Completion
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
                  {/* Name / ID + gender */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">
                          {student.name ?? student.student_id}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {student.student_id}
                          {student.gender ? ` · ${student.gender === 'M' ? 'Male' : 'Female'}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Module */}
                  <td className="py-4 px-4">
                    {student.code_module ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {student.code_module}
                      </span>
                    ) : (
                      <span className="text-sm text-surface-400 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Avg Score */}
                  <td className="py-4 px-4">
                    {student.avg_score != null ? (
                      <ScorePill value={Number(student.avg_score)} />
                    ) : (
                      <span className="text-sm text-surface-400 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Completion Rate */}
                  <td className="py-4 px-4">
                    {student.completion_rate != null ? (
                      <CompletionBar value={Number(student.completion_rate)} />
                    ) : (
                      <span className="text-sm text-surface-400 dark:text-surface-600">—</span>
                    )}
                  </td>

                  {/* Risk Badge */}
                  <td className="py-4 px-4">
                    <Badge variant={getRiskBadgeVariant(student.dropout_risk)} animate>
                      {student.dropout_risk !== undefined
                        ? `${(student.dropout_risk * 100).toFixed(0)}%`
                        : 'N/A'}
                    </Badge>
                  </td>

                  {/* Actions */}
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

// --- Sub-components ---

function ScorePill({ value }: { value: number }) {
  const color =
    value >= 70 ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' :
    value >= 50 ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' :
                  'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${color}`}>
      {value.toFixed(1)}
    </span>
  )
}

function CompletionBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 80 ? 'bg-success-500' :
    pct >= 50 ? 'bg-warning-500' :
                'bg-danger-500'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-surface-500 dark:text-surface-400 w-8 text-right">{pct}%</span>
    </div>
  )
}
