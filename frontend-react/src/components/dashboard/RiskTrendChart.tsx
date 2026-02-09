import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { cn } from '../../lib/utils'

export interface TrendDataPoint {
  date: string
  highRisk: number
  mediumRisk: number
}

interface RiskTrendChartProps {
  data: TrendDataPoint[]
  isMockData?: boolean
}

const CHART_HEIGHT = 200
const CHART_PADDING = { top: 20, right: 20, bottom: 30, left: 40 }

export function RiskTrendChart({ data, isMockData = false }: RiskTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <Card animate={false} hoverEffect="none">
        <CardHeader>
          <CardTitle>Risk Trend Analysis</CardTitle>
          <CardDescription>Last 30 Days</CardDescription>
        </CardHeader>
        <div className="h-[240px] flex items-center justify-center text-surface-500">
          No trend data available
        </div>
      </Card>
    )
  }

  const width = 500
  const height = CHART_HEIGHT
  const plotWidth = width - CHART_PADDING.left - CHART_PADDING.right
  const plotHeight = height - CHART_PADDING.top - CHART_PADDING.bottom

  const allValues = data.flatMap((d) => [d.highRisk, d.mediumRisk])
  const maxVal = Math.max(...allValues, 10)
  const minVal = 0

  const xScale = (i: number) => CHART_PADDING.left + (i / (data.length - 1)) * plotWidth
  const yScale = (v: number) => CHART_PADDING.top + plotHeight - ((v - minVal) / (maxVal - minVal)) * plotHeight

  const buildPath = (key: 'highRisk' | 'mediumRisk') => {
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d[key])}`)
      .join(' ')
  }

  const buildAreaPath = (key: 'highRisk' | 'mediumRisk') => {
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d[key])}`).join(' ')
    const bottom = `L ${xScale(data.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`
    return `${line} ${bottom}`
  }

  const highPath = buildPath('highRisk')
  const mediumPath = buildPath('mediumRisk')
  const highArea = buildAreaPath('highRisk')
  const mediumArea = buildAreaPath('mediumRisk')

  // Y-axis ticks
  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal]

  // X-axis labels (show every ~7th label)
  const xLabelInterval = Math.max(1, Math.floor(data.length / 5))

  return (
    <Card animate={false} hoverEffect="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Risk Trend Analysis</CardTitle>
            <CardDescription>Last 30 Days</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {isMockData && (
              <div className="flex items-center gap-1.5 text-warning-500 bg-warning-500/10 px-2 py-1 rounded-md">
                <AlertCircle className="h-3 w-3" />
                <span>Sample Data</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-danger-500" />
              <span className="text-surface-400">High Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-warning-500" />
              <span className="text-surface-400">Medium Risk</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="relative px-4 pb-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="highRiskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mediumRiskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={CHART_PADDING.left}
                y1={yScale(tick)}
                x2={width - CHART_PADDING.right}
                y2={yScale(tick)}
                className="stroke-surface-800"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
              <text
                x={CHART_PADDING.left - 8}
                y={yScale(tick) + 4}
                textAnchor="end"
                className="fill-surface-500 text-[10px]"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => {
            if (i % xLabelInterval !== 0 && i !== data.length - 1) return null
            return (
              <text
                key={i}
                x={xScale(i)}
                y={height - 5}
                textAnchor="middle"
                className="fill-surface-500 text-[9px]"
              >
                {d.date}
              </text>
            )
          })}

          {/* Area fills */}
          <motion.path
            d={mediumArea}
            fill="url(#mediumRiskGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.path
            d={highArea}
            fill="url(#highRiskGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />

          {/* Lines */}
          <motion.path
            d={mediumPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
          />
          <motion.path
            d={highPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.2, ease: 'easeInOut' }}
          />

          {/* Hover points */}
          {data.map((d, i) => (
            <g key={i}>
              <rect
                x={xScale(i) - (plotWidth / data.length) / 2}
                y={CHART_PADDING.top}
                width={plotWidth / data.length}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {hoveredIndex === i && (
                <>
                  <line
                    x1={xScale(i)}
                    y1={CHART_PADDING.top}
                    x2={xScale(i)}
                    y2={CHART_PADDING.top + plotHeight}
                    className="stroke-surface-600"
                    strokeWidth="0.5"
                    strokeDasharray="3 3"
                  />
                  <circle cx={xScale(i)} cy={yScale(d.highRisk)} r="4" fill="#ef4444" stroke="#1a1a1a" strokeWidth="2" />
                  <circle cx={xScale(i)} cy={yScale(d.mediumRisk)} r="4" fill="#f59e0b" stroke="#1a1a1a" strokeWidth="2" />
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div
            className={cn(
              'absolute z-10 px-3 py-2 rounded-lg text-xs',
              'bg-surface-800 border border-surface-700 shadow-xl',
              'pointer-events-none'
            )}
            style={{
              left: `${((xScale(hoveredIndex) / width) * 100)}%`,
              top: '20px',
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-medium text-white mb-1">{data[hoveredIndex].date}</p>
            <p className="text-danger-400">High Risk: {data[hoveredIndex].highRisk}</p>
            <p className="text-warning-400">Medium Risk: {data[hoveredIndex].mediumRisk}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
