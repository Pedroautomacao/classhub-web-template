import type { PaymentMethod } from './students.types'
import type { Plan } from './plans.types'

export type ContractDisplayStatus =
  | 'active'
  | 'expired'
  | 'expiring_soon'
  | 'cancelled'
  | 'no_contract'

export interface PaymentRow {
  id: string
  full_name: string
  phone: string | null
  plan_id: string | null
  plan: Plan | null
  payment_method: PaymentMethod | null
  payment_day: number | null
  monthly_value: string | null
  contract_status: ContractDisplayStatus
  contract_end_date: string | null
  next_due_date: string | null
}

export interface PaymentUpdate {
  plan_id?: string | null
  payment_method?: PaymentMethod | null
  payment_day?: number | null
}
