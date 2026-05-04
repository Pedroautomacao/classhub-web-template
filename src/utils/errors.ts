import axios from 'axios'

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((e: { msg?: string }) => e.msg ?? '').join(', ')
    }
  }
  return fallback
}
