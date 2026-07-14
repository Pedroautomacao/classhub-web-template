import type { AvailabilityDay } from './teachers.types'

export type EnrollmentSubmissionType = 'enrollment' | 're_enrollment'

export interface SubmissionClassSnapshot {
  id: string | null
  name: string
  schedule: { day: string; start_time: string; end_time: string }[]
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
  created_at: string
}
