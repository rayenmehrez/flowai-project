"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Dashboard } from "@/components/dashboard"
import { toast } from "sonner"
import { LayoutDashboard, MessageSquare, Settings, User, Shield } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          // Use user metadata instead of querying user_profiles
          setProfile({
            id: session.user.id,
            role: session.user.user_metadata?.role,
            full_name: session.user.user_metadata?.full_name,
            company: session.user.user_metadata?.company,
          })
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      // Call logout API route
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      toast.success("Logged out successfully")
      router.replace("/login")
    } catch (error) {
      console.error("[Dashboard] Logout error:", error)
      toast.error("Failed to logout")
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const isSuperAdmin = profile?.role === "super_admin"
  const isAdmin = profile?.role === "admin" || isSuperAdmin

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      show: true,
    },
    {
      name: "WhatsApp Agent",
      icon: MessageSquare,
      href: "/whatsapp-agent",
      show: true,
    },
    {
      name: "Profile",
      icon: User,
      href: "/profile",
      show: true,
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/settings",
      show: isAdmin,
    },
    {
      name: "Admin Panel",
      icon: Shield,
      href: "/admin",
      show: isSuperAdmin,
    },
  ].filter((item) => item.show)

  return (
    <Dashboard
      onLogout={handleLogout}
      navItems={navItems}
      user={user}
      profile={profile}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />
  )
}
