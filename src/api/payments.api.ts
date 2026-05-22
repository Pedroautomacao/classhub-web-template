import api from './axios'
import type { PaymentRow, PaymentUpdate, PaymentMethod } from '@/types'

export interface PaymentListParams {
  search?: string
  plan_id?: string
  payment_method?: PaymentMethod
  payment_day?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export const paymentsApi = {
  list: (params?: PaymentListParams) =>
    api.get<PaymentRow[]>('/payments/', { params }).then((r) => r.data),

  update: (studentId: string, data: PaymentUpdate) =>
    api.patch<PaymentRow>(`/payments/${studentId}`, data).then((r) => r.data),
}
