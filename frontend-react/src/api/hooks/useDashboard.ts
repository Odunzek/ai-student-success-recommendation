/**
 * Dashboard API hooks for fetching statistics, trends, and risk summaries.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { DashboardStats } from '../../types/prediction'
import type { TrendDataPoint } from '../../components/dashboard/RiskTrendChart'

/**
 * Risk summary response from /dashboard/risk-summary endpoint
 */
export interface RiskSummaryStudent {
  student_id: string
  risk_score: number
  avg_score: number | null
  completion_rate: number | null
}

export interface RiskGroup {
  count: number
  students: RiskSummaryStudent[]
}

export interface RiskSummaryResponse {
  high_risk: RiskGroup
  medium_risk: RiskGroup
  low_risk: RiskGroup
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
    staleTime: 60 * 1000, // 1 minute - balance between freshness and API calls
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export function useApiStatus() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ status: string; model_loaded: boolean }>('/health'),
    refetchInterval: 30000,
    retry: 1,
  })
}

// Generate mock trend data for the last 30 days
function generateMockTrendData(): TrendDataPoint[] {
  const data: TrendDataPoint[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    data.push({
      date: label,
      highRisk: Math.floor(12 + Math.random() * 8 + (i < 10 ? 3 : 0)),
      mediumRisk: Math.floor(25 + Math.random() * 12 - (i < 15 ? 2 : 0)),
    })
  }
  return data
}

export interface RiskTrendResult {
  data: TrendDataPoint[]
  isMockData: boolean
}

export function useRiskTrend() {
  return useQuery({
    queryKey: ['dashboard', 'trend'],
    queryFn: async (): Promise<RiskTrendResult> => {
      try {
        const data = await api.get<TrendDataPoint[]>('/dashboard/trend')
        return { data, isMockData: false }
      } catch {
        // Fallback to mock data if endpoint doesn't exist
        return { data: generateMockTrendData(), isMockData: true }
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

/**
 * Fetch risk summary with actual student data grouped by risk level.
 * Returns top 10 students per risk level with their IDs and scores.
 */
export function useRiskSummary() {
  return useQuery({
    queryKey: ['dashboard', 'risk-summary'],
    queryFn: () => api.get<RiskSummaryResponse>('/dashboard/risk-summary'),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}
