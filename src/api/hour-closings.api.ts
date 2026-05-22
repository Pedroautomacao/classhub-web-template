import api from './axios'
import type {
  AvailableClassForClosing,
  HourClosing,
  HourClosingCreatePayload,
  HourClosingUpdatePayload,
  HourClosingApprovalPayload,
  HourClosingStatus,
} from '@/types'

export const hourClosingsApi = {
  getAvailableClasses: (date: string) =>
    api.get<AvailableClassForClosing[]>('/hour-closings/available-classes', { params: { date } }).then((r) => r.data),

  create: (data: HourClosingCreatePayload) =>
    api.post<HourClosing>('/hour-closings/', data).then((r) => r.data),

  listMy: (params?: {
    date_from?: string
    date_to?: string
    status_filter?: HourClosingStatus
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) =>
    api.get<HourClosing[]>('/hour-closings/', { params }).then((r) => r.data),

  listAdmin: (params?: {
    teacher_id?: string
    date_from?: string
    date_to?: string
    status_filter?: HourClosingStatus
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => api.get<HourClosing[]>('/hour-closings/admin', { params }).then((r) => r.data),

  update: (id: string, data: HourClosingUpdatePayload) =>
    api.patch<HourClosing>(`/hour-closings/${id}`, data).then((r) => r.data),

  cancel: (id: string) =>
    api.delete(`/hour-closings/${id}`),

  review: (id: string, data: HourClosingApprovalPayload) =>
    api.patch<HourClosing>(`/hour-closings/${id}/review`, data).then((r) => r.data),
}
