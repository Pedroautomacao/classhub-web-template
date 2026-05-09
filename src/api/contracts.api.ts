import api from './axios'
import type { Contract, ContractStatus } from '@/types'

export const contractsApi = {
  list: (params?: { student_id?: string; contract_status?: ContractStatus; search?: string; expiring_soon?: boolean }) =>
    api.get<Contract[]>('/contracts/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Contract>(`/contracts/${id}`).then((r) => r.data),

  cancel: (id: string) =>
    api.patch<Contract>(`/contracts/${id}/cancel`).then((r) => r.data),
}
