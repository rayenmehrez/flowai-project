import { useAuth } from "@/lib/auth-context"
import { ROLES } from "@/lib/permissions"

export function usePermissions() {
  const { user } = useAuth()

  const role = user?.role ?? ROLES.USER
  const permissions = user?.permissions ?? []

  return {
    role,
    permissions,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    isAdmin: role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
    hasPermission: (perm: string) => permissions.includes(perm),
  }
}
