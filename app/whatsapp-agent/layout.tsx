"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Navbar } from "@/components/dashboard/navbar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { Loader2 } from "lucide-react"

function WhatsAppLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading: isLoading, signOut: logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  const handleViewChange = (view: string) => {
    if (view === "dashboard") {
      router.push("/dashboard")
    } else if (view === "whatsapp-agent") {
      router.push("/whatsapp-agent")
    } else if (view === "settings") {
      router.push("/profile")
    }
    setIsMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleNavigate = (section: string) => {
    if (section === "dashboard") {
      router.push("/dashboard")
    } else if (section === "settings") {
      router.push("/profile")
    } else if (section === "billing") {
      router.push("/billing")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView="whatsapp-agent" onViewChange={handleViewChange} onLogout={handleLogout} />

      <MobileSidebar
        isOpen={isMobileMenuOpen}
        currentView="whatsapp-agent"
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col md:ml-56">
        <Navbar
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-auto page-transition">{children}</main>
      </div>
    </div>
  )
}

export default function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <WhatsAppLayoutContent>{children}</WhatsAppLayoutContent>
    </AuthProvider>
  )
}
