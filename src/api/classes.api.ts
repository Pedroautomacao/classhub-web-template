import api from './axios'
import type { Class } from '@/types'

export interface ClassSchedulePayload {
  day: string
  start_time: string
  end_time: string
}

export interface ClassPayload {
  name: string
  teacher_id?: string | null
  schedule: ClassSchedulePayload[]
  class_type: string
  frequency: string
  student_ids?: string[]
  meeting_link?: string | null
  levels?: string[] | null
  biweekly_start_date?: string | null
}

export interface ClassListParams {
  teacher_id?: string
  name?: string
  day_of_week?: string
  start_time?: string
  class_type?: string
}

export const classesApi = {
  list: (params?: ClassListParams) =>
    api.get<Class[]>('/classes/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Class>(`/classes/${id}`).then((r) => r.data),

  create: (data: ClassPayload) =>
    api.post<Class>('/classes/', data).then((r) => r.data),

  update: (id: string, data: Partial<ClassPayload>) =>
    api.patch<Class>(`/classes/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/classes/${id}`),

  addStudent: (classId: string, studentId: string) =>
    api.post<Class>(`/classes/${classId}/students/${studentId}`).then((r) => r.data),

  removeStudent: (classId: string, studentId: string) =>
    api.delete<Class>(`/classes/${classId}/students/${studentId}`).then((r) => r.data),

  updateMeetingLink: (id: string, meeting_link: string | null) =>
    api.patch<Class>(`/classes/${id}/meeting-link`, { meeting_link }).then((r) => r.data),
}
