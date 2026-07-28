import type { ClassType, ClassScheduleEntry } from './classes.types'
import type { ClassFrequency } from './classes.types'

export interface SuggestionStudent {
  id: string
  full_name: string
  level: string | null
}

export interface ExistingClassMatch {
  class_id: string
  class_name: string
  class_type: ClassType
  frequency: ClassFrequency
  levels: string[] | null
  schedule: ClassScheduleEntry[]
  students: SuggestionStudent[]
}

export interface SuggestedClass {
  class_type: ClassType
  frequency: ClassFrequency
  level: string
  day: string
  start_time: string
  end_time: string
  students: SuggestionStudent[]
}

export interface PendingStudent {
  id: string
  full_name: string
  reasons: string[]
}

export interface AllocationSuggestions {
  existing_matches: ExistingClassMatch[]
  suggested_classes: SuggestedClass[]
  pending: PendingStudent[]
  analyzed_count: number
  ready_count: number
  pending_count: number
}
