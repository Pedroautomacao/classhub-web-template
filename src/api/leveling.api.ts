import api from './axios'
import type { LevelingFormCreate, LevelingFormResponse, ContactStatus, PaginatedResponse } from '@/types'

interface LevelingStatusUpdate {
  contact_status: ContactStatus
  level_result?: string
  recommendation?: string
}

interface LevelingListParams {
  contact_status?: ContactStatus
  name?: string
  phone?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export const levelingApi = {
  submit: (data: LevelingFormCreate) =>
    api.post<LevelingFormResponse>('/leveling/', data).then((r) => r.data),

  list: (params?: LevelingListParams) =>
    api.get<PaginatedResponse<LevelingFormResponse>>('/leveling/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<LevelingFormResponse>(`/leveling/${id}`).then((r) => r.data),

  updateStatus: (id: string, data: LevelingStatusUpdate) =>
    api.patch<LevelingFormResponse>(`/leveling/${id}/status`, data).then((r) => r.data),

  getLevels: () =>
    api.get<string[]>('/leveling/levels').then((r) => r.data),
}
