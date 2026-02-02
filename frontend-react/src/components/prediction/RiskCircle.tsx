import { cn } from '../../lib/utils'
import { getRiskLevel, getRiskColor, formatPercentage } from '../../lib/utils'

interface RiskCircleProps {
  probability: number
  size?: 'sm' | 'md' | 'lg'
}

export function RiskCircle({ probability, size = 'md' }: RiskCircleProps) {
  const risk = getRiskLevel(probability)
  const percentage = probability * 100
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const sizes = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const strokeColors = {
    low: 'stroke-success',
    medium: 'stroke-warning',
    high: 'stroke-danger',
  }

  return (
    <div className={cn('relative', sizes[size])}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={cn('transition-all duration-500', strokeColors[risk])}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', textSizes[size], getRiskColor(risk))}>
          {formatPercentage(probability)}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">
          {risk} Risk
        </span>
      </div>
    </div>
  )
}
