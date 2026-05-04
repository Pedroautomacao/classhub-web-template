import api from './axios'

export const demoApi = {
  status: () =>
    api.get<{ demo_mode: boolean; reset_interval_hours: number; next_reset_at: string | null }>(
      '/demo/status'
    ),
  reset: () =>
    api.post<{ status: string; reset_at: string }>(
      '/demo/reset',
      {},
      { headers: { 'x-reset-token': import.meta.env.VITE_DEMO_RESET_TOKEN ?? '' } }
    ),
}
