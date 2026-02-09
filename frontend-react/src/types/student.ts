export interface Student {
  id: number
  student_id: string
  gender?: string
  age?: number
  address?: string
  family_size?: string
  parental_status?: string
  mother_education?: number
  father_education?: number
  mother_job?: string
  father_job?: string
  reason?: string
  guardian?: string
  travel_time?: number
  study_time?: number
  failures?: number
  school_support?: boolean
  family_support?: boolean
  extra_paid?: boolean
  activities?: boolean
  nursery?: boolean
  higher?: boolean
  internet?: boolean
  romantic?: boolean
  family_relations?: number
  free_time?: number
  social?: number
  weekday_alcohol?: number
  weekend_alcohol?: number
  health?: number
  absences?: number
  g1?: number
  g2?: number
  g3?: number
  dropout_risk?: number
  // Fields from OULAD dataset
  completion_rate?: number
  avg_score?: number
  total_clicks?: number
  studied_credits?: number
  num_of_prev_attempts?: number
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
