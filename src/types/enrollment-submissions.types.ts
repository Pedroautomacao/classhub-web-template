import type { AvailabilityDay } from './teachers.types'
import type { ClassFrequency } from './classes.types'

export type EnrollmentSubmissionType = 'enrollment' | 're_enrollment'

export interface SubmissionClassSnapshot {
  id: string | null
  name: string
  schedule: { day: string; start_time: string; end_time: string }[]
}

export interface SubmissionPlanInfo {
  name: string
  covers_grammar: boolean
  covers_conversation: boolean
  grammar_frequency: ClassFrequency
  conversation_frequency: ClassFrequency
}

export interface EnrollmentSubmission {
  id: string
  type: EnrollmentSubmissionType
  student_id: string | null
  full_name: string
  cpf: string | null
  renewed: boolean
  availability_snapshot: AvailabilityDay[] | null
  classes_snapshot: SubmissionClassSnapshot[] | null
  has_conflict: boolean
  conflict_active: boolean
  student_level: string | null
  student_plan: SubmissionPlanInfo | null
  created_at: string
}
