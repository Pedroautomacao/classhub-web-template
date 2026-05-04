import api from './axios'
import type { LevelingTemplate, TemplateQuestion } from '@/types'

export interface LevelingTemplateCreate {
  name: string
  questions: TemplateQuestion[]
}

export interface LevelingTemplateUpdate {
  name?: string
  questions?: TemplateQuestion[]
}

export const levelingTemplatesApi = {
  getActive: () =>
    api.get<LevelingTemplate>('/leveling-templates/active').then((r) => r.data),

  list: () =>
    api.get<LevelingTemplate[]>('/leveling-templates/').then((r) => r.data),

  get: (id: string) =>
    api.get<LevelingTemplate>(`/leveling-templates/${id}`).then((r) => r.data),

  create: (data: LevelingTemplateCreate) =>
    api.post<LevelingTemplate>('/leveling-templates/', data).then((r) => r.data),

  update: (id: string, data: LevelingTemplateUpdate) =>
    api.patch<LevelingTemplate>(`/leveling-templates/${id}`, data).then((r) => r.data),

  activate: (id: string) =>
    api.post<LevelingTemplate>(`/leveling-templates/${id}/activate`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/leveling-templates/${id}`),
}
