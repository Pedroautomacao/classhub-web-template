import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/api/auth.api'
import type { LoginRequest } from '@/types'

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  const login = async (data: LoginRequest) => {
    const { access_token } = await authApi.login(data)
    // Seta o token no store antes de chamar getMe (o interceptor do Axios usa o store)
    useAuthStore.setState({ token: access_token })
    const userMe = await authApi.getMe()
    setAuth(userMe, access_token)
    return userMe
  }

  const logout = () => {
    clearAuth()
  }

  return { user, token, isAuthenticated, login, logout }
}
