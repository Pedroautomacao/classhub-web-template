import api from './axios'
import type { Teacher, AvailabilityDay } from '@/types'

export interface TeacherPayload {
  name: string
  email: string
  phone?: string | null
  is_training?: boolean
  hourly_rate: number
  availability?: AvailabilityDay[] | null
}

export const teachersApi = {
  list: (only_training = false) =>
    api.get<Teacher[]>('/teachers/', { params: { only_training } }).then((r) => r.data),

  get: (id: string) =>
    api.get<Teacher>(`/teachers/${id}`).then((r) => r.data),

  create: (data: TeacherPayload) =>
    api.post<Teacher>('/teachers/', data).then((r) => r.data),

  update: (id: string, data: Partial<TeacherPayload>) =>
    api.patch<Teacher>(`/teachers/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/teachers/${id}`),

  myClasses: () =>
    api.get<import('@/types').Class[]>('/teachers/me/classes').then((r) => r.data),

  availableUsers: () =>
    api.get<import('@/types').User[]>('/teachers/available-users').then((r) => r.data),
}
