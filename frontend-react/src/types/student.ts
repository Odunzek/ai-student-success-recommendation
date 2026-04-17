export interface Student {
  id: number
  student_id: string
  name?: string

  // OULAD numeric features
  avg_score?: number
  total_clicks?: number
  completion_rate?: number
  studied_credits?: number
  num_of_prev_attempts?: number

  // OULAD categorical features
  code_module?: string
  gender?: string
  region?: string
  highest_education?: string
  imd_band?: string
  age_band?: string
  disability?: string

  // Risk output (populated after prediction)
  dropout_risk?: number
}

export interface StudentListResponse {
  students: Student[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface StudentFilters {
  page?: number
  per_page?: number
  search?: string
  risk_level?: 'low' | 'medium' | 'high'
}
