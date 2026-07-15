import type { FileMetadata } from './files.types'

export type ContractStatus = 'active' | 'expired' | 'cancelled'

export interface Contract {
  id: string
  student_id: string
  student: { id: string; full_name: string }
  plan_id: string | null
  start_date: string
  end_date: string | null
  grace_period_days: number
  status: ContractStatus
  is_deleted: boolean
  has_successor: boolean
  created_at: string
  updated_at: string
  file: FileMetadata | null
}
