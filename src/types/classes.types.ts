export type ClassType = 'grammar' | 'conversation' | 'private_lesson'
export type ClassFrequency = 'weekly' | 'biweekly'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface ClassScheduleEntry {
  day: DayOfWeek
  start_time: string
  end_time: string
}

export interface ClassStudent {
  id: string
  full_name: string
}

export interface Class {
  id: string
  name: string
  teacher_id: string | null
  teacher?: import('./teachers.types').Teacher | null
  schedule: ClassScheduleEntry[]
  class_type: ClassType
  frequency: ClassFrequency
  meeting_link: string | null
  levels: string[] | null
  biweekly_start_date: string | null
  students: ClassStudent[]
  created_at: string
  updated_at: string
}
