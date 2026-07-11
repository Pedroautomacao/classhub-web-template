import api from './axios'
import type { Contract, ContractStatus, PaginatedResponse } from '@/types'

export const contractsApi = {
  list: (params?: {
    student_id?: string
    contract_status?: ContractStatus
    search?: string
    expiring_soon?: boolean
    end_date_from?: string
    end_date_to?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    page?: number
    page_size?: number
  }) =>
    api.get<PaginatedResponse<Contract>>('/contracts/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Contract>(`/contracts/${id}`).then((r) => r.data),

  update: (id: string, data: { end_date?: string | null }) =>
    api.patch<Contract>(`/contracts/${id}`, data).then((r) => r.data),

  cancel: (id: string) =>
    api.patch<Contract>(`/contracts/${id}/cancel`).then((r) => r.data),
}
