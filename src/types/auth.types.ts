export type UserRole = 'admin' | 'manager' | 'secretary' | 'teacher'

export interface User {
  id: string
  full_name: string
  username: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  permissions: string[]
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}
