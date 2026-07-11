import type { Student } from './students.types'
import type { AvailabilityDay } from './teachers.types'
import type { Contract } from './contracts.types'

export interface EnrollmentRequest {
  full_name: string
  cpf?: string
  email?: string
  phone?: string
  instagram?: string
  birth_date?: string
  availability?: AvailabilityDay[] | null
  coupon?: string
  plan_id: string
  payment_method: string
  payment_day: number
  contract_accepted: boolean
  start_date: string
  grace_period_days?: number
  contract_file?: string        // base64
  contract_file_name?: string
}

export interface ReEnrollmentRequest {
  student_id: string
  plan_id: string
  payment_method: string
  payment_day: number
  start_date: string
  grace_period_days?: number
  availability?: AvailabilityDay[] | null
}

export interface PublicEnrollmentRequest {
  full_name: string
  cpf?: string
  email?: string
  phone?: string
  instagram?: string
  birth_date?: string
  availability?: AvailabilityDay[] | null
  coupon?: string
  plan_id: string
  payment_method: string
  start_date: string
  grace_period_days?: number
  contract_accepted: boolean
}

export interface PublicReEnrollmentRequest {
  cpf?: string
  email?: string
  phone?: string
  instagram?: string
  birth_date?: string
  availability?: AvailabilityDay[] | null
  opt_out?: boolean
  plan_id?: string
  payment_method?: string
  start_date?: string
  grace_period_days?: number
  contract_accepted?: boolean
}

export interface StudentLookupResult {
  full_name: string
  cpf: string | null
  email: string | null
  phone: string | null
  instagram: string | null
  birth_date: string | null
  availability: AvailabilityDay[] | null
}

export interface EnrollmentResponse {
  student: Student
  contract: Contract
}
