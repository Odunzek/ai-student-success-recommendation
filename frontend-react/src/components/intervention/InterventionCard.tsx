import { Target } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'
import type { Intervention } from '../../types/intervention'

interface InterventionCardProps {
  intervention: Intervention
}

export function InterventionCard({ intervention }: InterventionCardProps) {
  const priorityVariant = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
  } as const

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-gray-900">{intervention.title}</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">{intervention.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant={priorityVariant[intervention.priority]}>
              {intervention.priority} priority
            </Badge>
            <Badge variant="default">{intervention.category}</Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Est. Impact</div>
          <div className={cn(
            'text-lg font-semibold',
            intervention.estimated_impact >= 0.7 ? 'text-success' :
            intervention.estimated_impact >= 0.4 ? 'text-warning' : 'text-gray-600'
          )}>
            {(intervention.estimated_impact * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  )
}
