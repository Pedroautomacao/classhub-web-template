import api from './axios'
import type { PaginatedResponse, PaymentRow, PaymentUpdate, PaymentMethod } from '@/types'

export interface PaymentListParams {
  search?: string
  plan_id?: string
  payment_method?: PaymentMethod
  payment_day?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export const paymentsApi = {
  list: (params?: PaymentListParams) =>
    api.get<PaginatedResponse<PaymentRow>>('/payments/', { params }).then((r) => r.data),

  update: (studentId: string, data: PaymentUpdate) =>
    api.patch<PaymentRow>(`/payments/${studentId}`, data).then((r) => r.data),
}
