import api from './axios'
import type { User, PaginatedResponse } from '@/types'

export interface UserCreatePayload {
  full_name: string
  username: string
  email: string
  phone?: string | null
  password: string
  role: string
  permissions: string[]
}

export interface UserUpdatePayload {
  full_name?: string
  email?: string
  phone?: string | null
  role?: string
  is_active?: boolean
  password?: string
}

export const usersApi = {
  list: (params?: { only_active?: boolean; page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<User>>('/users/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: UserCreatePayload) =>
    api.post<User>('/users/', data).then((r) => r.data),

  update: (id: string, data: UserUpdatePayload) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  updatePermissions: (id: string, permissions: string[]) =>
    api.put<User>(`/users/${id}/permissions`, { permissions }).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch<User>(`/users/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch<User>(`/users/${id}/reactivate`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),

  updateMe: (data: { email?: string | null; phone?: string | null }) =>
    api.patch<User>('/users/me', data).then((r) => r.data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/users/me/password', data),

  updateAvatar: (avatar_url: string) =>
    api.patch<User>('/users/me/avatar', { avatar_url }).then((r) => r.data),
}
