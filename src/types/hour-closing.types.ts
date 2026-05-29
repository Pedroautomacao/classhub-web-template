import type { Teacher } from './teachers.types'

export type HourClosingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface HourClosingEntry {
  id: string
  submission_id: string | null
  class_id: string | null
  class_name: string
  lesson_date: string
  start_time: string
  end_time: string
  hourly_rate_snapshot: number
}

export interface HourClosing {
  id: string
  teacher_id: string
  teacher: Teacher
  date_from: string
  date_to: string
  total_hours: number
  suggested_value: number
  final_value: number
  notes: string | null
  reviewer_response: string | null
  status: HourClosingStatus
  reviewed_by: string | null
  reviewed_at: string | null
  entries: HourClosingEntry[]
  created_at: string
  updated_at: string
}

export interface HourClosingEntryPayload {
  class_id?: string | null
  class_name: string
  lesson_date: string
  start_time: string
  end_time: string
}

export interface HourClosingCreatePayload {
  date_from: string
  date_to: string
  notes?: string | null
  entries: HourClosingEntryPayload[]
}

export interface HourClosingUpdatePayload {
  final_value?: number
  notes?: string | null
}

export interface HourClosingApprovalPayload {
  status: 'approved' | 'rejected'
  final_value?: number
}

export interface AvailableClassForClosing {
  class_id: string
  class_name: string
  start_time: string
  end_time: string
}
