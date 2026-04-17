import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getRiskLevel(probability: number): 'low' | 'medium' | 'high' {
  // Match backend thresholds (rules.py): high >= 70%, medium >= 40%, low < 40%
  // Backend uses Math.round on the percentage, so we must do the same for consistency
  // This ensures 69.7% rounds to 70% = HIGH (same as backend)
  const percentage = Math.round(probability * 100)
  if (percentage >= 70) return 'high'
  if (percentage >= 40) return 'medium'
  return 'low'
}

export function getRiskColor(risk: 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'low':
      return 'text-success'
    case 'medium':
      return 'text-warning'
    case 'high':
      return 'text-danger'
  }
}

export function getRiskBgColor(risk: 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'low':
      return 'bg-success-light'
    case 'medium':
      return 'bg-warning-light'
    case 'high':
      return 'bg-danger-light'
  }
}
