export interface InterventionInput {
  student_id?: string
  risk_level: 'low' | 'medium' | 'high'
  risk_factors: string[]
  use_llm?: boolean
}

export interface Intervention {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: string
  estimated_impact: number
}

export interface InterventionResult {
  student_id?: string
  risk_level: string
  interventions: Intervention[]
  generated_by: 'rules' | 'llm'
  summary?: string
}
