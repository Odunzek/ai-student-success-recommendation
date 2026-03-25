import { Target, CheckCircle2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { Intervention } from '../../types/intervention'

interface InterventionCardProps {
  intervention: Intervention
}

export function InterventionCard({ intervention }: InterventionCardProps) {
  const priorityVariant = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  } as const

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-surface-900 dark:text-white">{intervention.title}</h4>
          </div>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">{intervention.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityVariant[intervention.priority] ?? 'default'}>
              {intervention.priority} priority
            </Badge>
            <Badge variant="default">{intervention.type}</Badge>
          </div>

          {intervention.actions.length > 0 && (
            <ul className="mt-3 space-y-1">
              {intervention.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
