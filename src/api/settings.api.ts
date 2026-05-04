import api from './axios'
import type { LandingPageData, SchoolSettings } from '@/types'

export const settingsApi = {
  getLanding: () =>
    api.get<LandingPageData>('/landing').then((r) => r.data),

  get: () =>
    api.get<SchoolSettings>('/settings').then((r) => r.data),

  update: (data: Partial<SchoolSettings>) =>
    api.patch<SchoolSettings>('/settings', data).then((r) => r.data),
}
