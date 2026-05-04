import { useAuthStore } from '@/store/auth.store'
import type { PermissionKey } from '@/utils/permissions'

export function usePermission() {
  const user = useAuthStore((s) => s.user)

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: PermissionKey[]): boolean =>
    permissions.some(hasPermission)

  return { hasPermission, hasAnyPermission }
}
