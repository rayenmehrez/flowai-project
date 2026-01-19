"use client"

import { useRouter } from "next/navigation"
import { Zap, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

export function NavbarPublic() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setShowDropdown(false)
      router.replace("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const getUserInitials = () => {
    if (!user?.email) return ""
    return user.email.substring(0, 2).toUpperCase()
  }

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-white via-purple-50/50 to-transparent border-b border-purple-100/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">FlowAI</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {!loading && user ? (
              <>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-semibold"
                >
                  Dashboard
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  >
                    {getUserInitials()}
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-2">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user.email}</p>
                      </div>

                      <button
                        onClick={() => router.push("/profile")}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/login")} className="text-sm">
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold"
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
