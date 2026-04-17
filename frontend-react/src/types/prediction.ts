// Matches the 12-feature contract of catboost_baseline_production.pkl
export interface PredictionInput {
  // Numeric features
  num_of_prev_attempts: number
  studied_credits: number
  avg_score: number
  total_clicks: number
  completion_rate: number
  // Categorical features (raw strings — no encoding needed)
  code_module: string
  gender: string
  region: string
  highest_education: string
  imd_band: string
  age_band: string
  disability: string
}

export interface ShapFactor {
  feature: string
  value: number
  impact: number
  direction: 'positive' | 'negative'
}

// Matches /predict/explain API response
export interface PredictionResult {
  risk_score: number          // 0–100 integer
  risk_probability: number    // 0–1 float (raw model output)
  risk_level: 'low' | 'medium' | 'high'
  prediction: number          // 0 or 1
  top_factors: ShapFactor[] | null
}

export interface DashboardStats {
  total_students: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  avg_dropout_probability: number
  model_accuracy?: number
}
