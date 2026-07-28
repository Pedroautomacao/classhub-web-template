import type { ClassFrequency } from './classes.types'

export interface Plan {
  id: string
  name: string
  description: string | null
  duration_months: number
  price: string
  is_active: boolean
  benefits: string[] | null
  covers_grammar: boolean
  covers_conversation: boolean
  frequency: ClassFrequency
  created_at: string
  updated_at: string
}
