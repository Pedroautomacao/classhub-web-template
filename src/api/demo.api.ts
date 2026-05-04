import api from './axios'

export const demoApi = {
  reset: () =>
    api.post<{ status: string; reset_at: string }>(
      '/demo/reset',
      {},
      { headers: { 'x-reset-token': import.meta.env.VITE_DEMO_RESET_TOKEN ?? '' } }
    ),
}
