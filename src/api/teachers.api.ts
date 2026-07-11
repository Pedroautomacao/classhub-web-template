import api from './axios'
import type { Teacher, AvailabilityDay, PaginatedResponse } from '@/types'

export interface TeacherPayload {
  name: string
  email: string
  phone?: string | null
  is_training?: boolean
  hourly_rate: number
  availability?: AvailabilityDay[] | null
}

export interface TeacherListParams {
  is_training?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export const teachersApi = {
  list: (params?: TeacherListParams) =>
    api.get<PaginatedResponse<Teacher>>('/teachers/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Teacher>(`/teachers/${id}`).then((r) => r.data),

  create: (data: TeacherPayload) =>
    api.post<Teacher>('/teachers/', data).then((r) => r.data),

  update: (id: string, data: Partial<TeacherPayload>) =>
    api.patch<Teacher>(`/teachers/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/teachers/${id}`),

  getMe: () =>
    api.get<Teacher>('/teachers/me').then((r) => r.data),

  updateMe: (data: { email?: string | null; phone?: string | null; availability?: AvailabilityDay[] | null }) =>
    api.patch<Teacher>('/teachers/me', data).then((r) => r.data),

  myClasses: () =>
    api.get<import('@/types').Class[]>('/teachers/me/classes').then((r) => r.data),

  availableUsers: () =>
    api.get<import('@/types').User[]>('/teachers/available-users').then((r) => r.data),

  allTeacherUsers: (includeEmail?: string) =>
    api.get<import('@/types').User[]>('/teachers/all-teacher-users', {
      params: includeEmail ? { include_email: includeEmail } : undefined,
    }).then((r) => r.data),
}
