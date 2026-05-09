export interface Plan {
  id: string
  name: string
  description: string | null
  duration_months: number
  price: string
  benefits: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}
