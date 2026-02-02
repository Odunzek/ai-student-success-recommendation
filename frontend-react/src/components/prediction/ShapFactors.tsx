import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ShapFactor } from '../../types/prediction'

interface ShapFactorsProps {
  factors: ShapFactor[]
  maxDisplay?: number
}

export function ShapFactors({ factors, maxDisplay = 10 }: ShapFactorsProps) {
  const sortedFactors = [...factors]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, maxDisplay)

  const maxImpact = Math.max(...sortedFactors.map((f) => Math.abs(f.impact)))

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Key Risk Factors</h4>
      <div className="space-y-2">
        {sortedFactors.map((factor, index) => {
          const isPositive = factor.direction === 'positive'
          const barWidth = (Math.abs(factor.impact) / maxImpact) * 100

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600 truncate" title={factor.feature}>
                {formatFeatureName(factor.feature)}
              </div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isPositive ? 'bg-danger' : 'bg-success'
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="flex items-center gap-1 w-16">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-danger" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-success" />
                )}
                <span className={cn('text-xs font-medium', isPositive ? 'text-danger' : 'text-success')}>
                  {(factor.impact * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-6 pt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-danger" />
          <span>Increases Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-success" />
          <span>Decreases Risk</span>
        </div>
      </div>
    </div>
  )
}

function formatFeatureName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
