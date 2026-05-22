import type { AvailabilityDay } from './teachers.types'
import type { Plan } from './plans.types'

export type StudentStatus = 'active' | 'inactive'
export type PaymentMethod = 'pix' | 'credit_card' | 'bank_slip' | 'cash'

export interface StudentClassRef {
  id: string
  name: string
}

export interface Student {
  id: string
  full_name: string
  cpf: string | null
  email: string | null
  phone: string | null
  instagram: string | null
  birth_date: string | null
  plan_id: string | null
  plan: Plan | null
  payment_method: PaymentMethod | null
  payment_day: number | null
  availability: AvailabilityDay[] | null
  level: string | null
  contract_accepted: boolean
  coupon: string | null
  status: StudentStatus
  classes: StudentClassRef[]
  created_at: string
  updated_at: string
}
