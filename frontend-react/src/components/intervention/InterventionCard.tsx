import { Target, CheckCircle2, User, Clock, BarChart2, Zap } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { Intervention } from '../../types/intervention'

interface InterventionCardProps {
  intervention: Intervention
}

/**
 * Renders a single intervention recommendation card.
 *
 * LLM-enhanced interventions produce structured action items prefixed with
 * "Action:", "Owner:", "Timeline:", or "Success:" — these are rendered with
 * distinct icons and labels.
 *
 * Rule-based interventions produce plain action strings — these are rendered
 * as a simple checklist.
 */
export function InterventionCard({ intervention }: InterventionCardProps) {
  const priorityVariant = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  } as const

  // Detect whether actions are LLM-structured (have "Label: value" prefixes)
  const isStructured = intervention.actions.some((a) =>
    /^(Action|Owner|Timeline|Success):/i.test(a.trim())
  )

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">

          {/* Title row */}
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary flex-shrink-0" />
            <h4 className="font-medium text-surface-900 dark:text-white">{intervention.title}</h4>
          </div>

          {/* Description */}
          {intervention.description && (
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
              {intervention.description}
            </p>
          )}

          {/* Priority + type badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant={priorityVariant[intervention.priority] ?? 'default'}>
              {intervention.priority} priority
            </Badge>
            <Badge variant="default">{intervention.type}</Badge>
          </div>

          {/* Actions */}
          {intervention.actions.length > 0 && (
            isStructured
              ? <StructuredActions actions={intervention.actions} />
              : <PlainActions actions={intervention.actions} />
          )}

        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Renders LLM-structured actions (Action / Owner / Timeline / Success labels) */
function StructuredActions({ actions }: { actions: string[] }) {
  const labelConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    action: {
      icon: <Zap className="h-3.5 w-3.5 flex-shrink-0" />,
      color: 'text-primary dark:text-primary-400',
    },
    owner: {
      icon: <User className="h-3.5 w-3.5 flex-shrink-0" />,
      color: 'text-surface-500 dark:text-surface-400',
    },
    timeline: {
      icon: <Clock className="h-3.5 w-3.5 flex-shrink-0" />,
      color: 'text-amber-600 dark:text-amber-400',
    },
    success: {
      icon: <BarChart2 className="h-3.5 w-3.5 flex-shrink-0" />,
      color: 'text-green-600 dark:text-green-400',
    },
  }

  return (
    <div className="space-y-2 mt-1">
      {actions.map((action, i) => {
        const match = action.match(/^(\w+):\s*(.+)/s)
        if (!match) {
          // Fallback: plain line
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <span>{action}</span>
            </div>
          )
        }

        const label = match[1].toLowerCase()
        const value = match[2].trim()
        const config = labelConfig[label] ?? {
          icon: <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />,
          color: 'text-surface-600 dark:text-surface-400',
        }

        return (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-0.5 ${config.color}`}>{config.icon}</span>
            <span>
              <span className={`font-medium ${config.color}`}>{match[1]}: </span>
              <span className="text-surface-600 dark:text-surface-400">{value}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Renders plain rule-based actions as a simple checklist */
function PlainActions({ actions }: { actions: string[] }) {
  return (
    <ul className="space-y-1 mt-1">
      {actions.map((action, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
          <span>{action}</span>
        </li>
      ))}
    </ul>
  )
}
