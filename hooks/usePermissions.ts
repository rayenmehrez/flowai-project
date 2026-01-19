"use client"

import { useAuth } from "@/lib/auth-context"

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    // Add your permission logic here
    // This is a placeholder implementation
    const userPermissions = ["read", "write", "delete"]
    return userPermissions.includes(permission)
  }

  const isSuperAdmin = (): boolean => {
    return user?.user_metadata?.role === "super_admin"
  }

  const isAdmin = (): boolean => {
    return user?.user_metadata?.role === "admin"
  }

  return {
    hasPermission,
    isAdmin,
    isSuperAdmin,
    canRead: () => hasPermission("read"),
    canWrite: () => hasPermission("write"),
    canDelete: () => hasPermission("delete"),
  }
}
