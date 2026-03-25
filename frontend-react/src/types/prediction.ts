export interface PredictionInput {
  gender: string
  age: number
  address: string
  family_size: string
  parental_status: string
  mother_education: number
  father_education: number
  mother_job: string
  father_job: string
  reason: string
  guardian: string
  travel_time: number
  study_time: number
  failures: number
  school_support: boolean
  family_support: boolean
  extra_paid: boolean
  activities: boolean
  nursery: boolean
  higher: boolean
  internet: boolean
  romantic: boolean
  family_relations: number
  free_time: number
  social: number
  weekday_alcohol: number
  weekend_alcohol: number
  health: number
  absences: number
  g1: number
  g2: number
}

export interface ShapFactor {
  feature: string
  value: number
  impact: number
  direction: 'positive' | 'negative'
}

export interface PredictionResult {
  dropout_probability: number
  risk_level: 'low' | 'medium' | 'high'
  shap_factors: ShapFactor[]
  confidence: number
}

export interface DashboardStats {
  total_students: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  avg_dropout_probability: number
  model_accuracy?: number
}
