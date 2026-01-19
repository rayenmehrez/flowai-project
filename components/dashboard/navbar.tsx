"use client"

import { Menu, X, Zap, Bell, Shield, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/hooks/usePermissions"
import { UserDropdown } from "./user-dropdown"

interface NavbarProps {
  credits?: number
  onMobileMenuToggle?: () => void
  isMobileMenuOpen?: boolean
  onLogout: () => void
  onNavigate?: (section: string) => void
}

export function Navbar({
  credits = 0,
  onMobileMenuToggle,
  isMobileMenuOpen,
  onLogout,
}: NavbarProps) {
  const { user, loading } = useAuth()
  const { isSuperAdmin, isAdmin } = usePermissions()

  if (loading) return null

  const displayCredits = user?.credits ?? credits

  const fullName = user?.full_name || user?.email?.split("@")[0] || "User"
  const displayName = fullName
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")

  const RoleBadge = () => {
    if (isSuperAdmin()) {
      return (
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full">
          <Crown className="w-3.5 h-3.5" />
          <span className="text-xs font-bold uppercase hidden sm:inline">Super Admin</span>
        </div>
      )
    }

    if (isAdmin()) {
      return (
        <div className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1 rounded-full">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs font-bold uppercase hidden sm:inline">Admin</span>
        </div>
      )
    }

    return null
  }

  return (
    <nav className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={onMobileMenuToggle}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          <h2 className="hidden md:block text-gray-700">
            Welcome back, <span className="font-bold text-gray-900">{displayName}</span>
          </h2>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          <RoleBadge />

          <div className="hidden sm:flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">{displayCredits} credits</span>
          </div>

          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5 text-gray-600" />
          </Button>

          <UserDropdown onLogout={onLogout} />
        </div>
      </div>
    </nav>
  )
}
