import api from './axios'
import type { NpsQuestion, NpsResponse, NpsResponseCreate, NpsTemplate, PaginatedResponse } from '@/types'

export interface NpsTemplateCreate {
  name: string
  questions: NpsQuestion[]
}

export interface NpsTemplateUpdate {
  name?: string
  questions?: NpsQuestion[]
}

interface NpsResponseListParams {
  template_id?: string
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export const npsTemplatesApi = {
  getActive: () =>
    api.get<NpsTemplate>('/nps-templates/active').then((r) => r.data),

  list: () =>
    api.get<NpsTemplate[]>('/nps-templates/').then((r) => r.data),

  get: (id: string) =>
    api.get<NpsTemplate>(`/nps-templates/${id}`).then((r) => r.data),

  create: (data: NpsTemplateCreate) =>
    api.post<NpsTemplate>('/nps-templates/', data).then((r) => r.data),

  update: (id: string, data: NpsTemplateUpdate) =>
    api.patch<NpsTemplate>(`/nps-templates/${id}`, data).then((r) => r.data),

  activate: (id: string) =>
    api.post<NpsTemplate>(`/nps-templates/${id}/activate`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/nps-templates/${id}`),
}

export const npsApi = {
  submit: (data: NpsResponseCreate) =>
    api.post<NpsResponse>('/nps/', data).then((r) => r.data),

  list: (params?: NpsResponseListParams) =>
    api.get<PaginatedResponse<NpsResponse>>('/nps/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<NpsResponse>(`/nps/${id}`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/nps/${id}`),
}
