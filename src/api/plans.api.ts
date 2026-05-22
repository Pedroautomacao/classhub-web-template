import api from './axios'
import type { Plan } from '@/types'

export interface PlanListParams {
  only_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export const plansApi = {
  listPublic: () =>
    api.get<Plan[]>('/plans/public').then((r) => r.data),

  list: (params?: PlanListParams | boolean) => {
    const p: PlanListParams = typeof params === 'boolean' ? { only_active: params } : (params ?? {})
    return api.get<Plan[]>('/plans/', { params: p }).then((r) => r.data)
  },

  get: (id: string) =>
    api.get<Plan>(`/plans/${id}`).then((r) => r.data),

  create: (data: Omit<Plan, 'id' | 'is_active' | 'created_at' | 'updated_at'>) =>
    api.post<Plan>('/plans/', data).then((r) => r.data),

  update: (id: string, data: Partial<Plan>) =>
    api.patch<Plan>(`/plans/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/plans/${id}`),
}
