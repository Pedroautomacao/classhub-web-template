import api from './axios'
import type { LoginRequest, LoginResponse, User } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  getMe: () =>
    api.get<User>('/users/me').then((r) => r.data),
}
