import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { staggerContainer, tableRow } from '../../lib/animations'
import { cn } from '../../lib/utils'

export interface AlertItem {
  studentId: string
  riskLevel: 'high' | 'medium' | 'low'
  description: string
  aiRecommendation: string
}

interface AlertsTableProps {
  alerts: AlertItem[]
  onViewProfile: (studentId: string) => void
}

const riskBadgeVariant: Record<string, 'danger' | 'warning' | 'success'> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
}

const riskBarColor: Record<string, string> = {
  high: 'bg-danger-500',
  medium: 'bg-warning-500',
  low: 'bg-success-500',
}

export function AlertsTable({ alerts, onViewProfile }: AlertsTableProps) {
  if (alerts.length === 0) {
    return (
      <Card animate={false} hoverEffect="none">
        <CardHeader>
          <CardTitle>Recent Alerts & Recommended Actions</CardTitle>
        </CardHeader>
        <div className="p-6 text-center text-surface-500">
          No alerts at this time
        </div>
      </Card>
    )
  }

  return (
    <Card animate={false} hoverEffect="none" className="overflow-hidden">
      <CardHeader>
        <CardTitle>Recent Alerts & Recommended Actions</CardTitle>
      </CardHeader>

      <motion.div
        className="divide-y divide-surface-800"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.studentId + index}
            className={cn(
              'relative flex items-center gap-4 px-6 py-4',
              'hover:bg-surface-800/30 transition-colors group'
            )}
            variants={tableRow}
          >
            {/* Risk color bar */}
            <div className={cn('absolute left-0 top-0 bottom-0 w-1', riskBarColor[alert.riskLevel])} />

            {/* Student ID */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center">
                <User className="h-4 w-4 text-surface-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Student ID: {alert.studentId}</p>
                <Badge variant={riskBadgeVariant[alert.riskLevel]} size="sm">
                  {alert.riskLevel.charAt(0).toUpperCase() + alert.riskLevel.slice(1)} Risk
                </Badge>
              </div>
            </div>

            {/* Description + AI Recommendation */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-surface-300 truncate">{alert.description}</p>
              <p className="text-xs text-surface-500 mt-0.5">
                <span className="text-primary-400 font-medium">AI Rec:</span>{' '}
                {alert.aiRecommendation}
              </p>
            </div>

            {/* View Profile Button - disabled for group alerts */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProfile(alert.studentId)}
              disabled={alert.studentId.startsWith('Group:')}
              className="opacity-70 group-hover:opacity-100 transition-opacity"
            >
              View Profile
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </Card>
  )
}
