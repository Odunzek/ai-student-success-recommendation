export interface ShapFactor {
  feature: string
  impact: number
  direction: string
  value?: number
}

export interface InterventionInput {
  risk_score: number          // 0-100
  completion_rate?: number    // 0-1
  avg_score?: number          // 0-100
  total_clicks?: number
  studied_credits?: number
  num_of_prev_attempts?: number
  student_name?: string
  module_name?: string
  use_llm?: boolean
  shap_factors?: ShapFactor[]  // top model drivers — makes LLM interventions target the right features
}

export interface Intervention {
  type: string                // 'academic' | 'engagement' | 'support' | 'urgent'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  actions: string[]
}

export interface InterventionResult {
  risk_level: string
  interventions: Intervention[]
  summary: string
  llm_enhanced: boolean
}
