import api from './axios'
import type { DashboardSummary } from '@/types'

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
}
