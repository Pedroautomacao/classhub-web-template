import api from './axios'
import type { Student, StudentStatus, AvailabilityDay } from '@/types'

export interface StudentUpdate {
  full_name?: string
  cpf?: string | null
  email?: string | null
  phone?: string | null
  instagram?: string | null
  birth_date?: string | null
  plan_id?: string | null
  payment_method?: string | null
  payment_day?: number | null
  availability?: AvailabilityDay[] | null
  level?: string | null
  contract_accepted?: boolean
  coupon?: string | null
}

export interface StudentListParams {
  status?: StudentStatus
  created_after?: string
  created_before?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export const studentsApi = {
  list: (params?: StudentListParams) =>
    api.get<Student[]>('/students/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Student>(`/students/${id}`).then((r) => r.data),

  update: (id: string, data: StudentUpdate) =>
    api.patch<Student>(`/students/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch<Student>(`/students/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch<Student>(`/students/${id}/reactivate`).then((r) => r.data),
}
