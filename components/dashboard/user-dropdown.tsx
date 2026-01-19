"use client"

import { useEffect, useRef, useState } from "react"
import { Crown, LayoutDashboard, Settings, CreditCard, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface UserDropdownProps {
  onLogout: () => void
  onNavigate?: (section: string) => void
}

export function UserDropdown({ onLogout, onNavigate }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()

  const getInitials = () => {
    if (user?.full_name) {
      const parts = user.full_name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return user.full_name.substring(0, 2).toUpperCase()
    }
    if (user?.email) {
      const namePart = user.email.split("@")[0]
      const parts = namePart.split(/[._-]/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return namePart.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  const getDisplayName = () => {
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    }
    if (user?.email) {
      const namePart = user.email.split("@")[0]
      return namePart
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    }
    return "User"
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [isOpen])

  const handleMenuClick = (section: string) => {
    setIsOpen(false)
    if (onNavigate) {
      onNavigate(section)
    }
  }

  const handleLogout = () => {
    setIsOpen(false)
    onLogout()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
        aria-label="Open user menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-white text-base font-bold">{getInitials()}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          {/* User Info Section - Use getDisplayName and actual email */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-base font-semibold text-gray-900">{getDisplayName()}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email || "user@example.com"}</p>
          </div>

          {/* Plan Badge Section */}
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Free Plan</span>
            </div>
          </div>

          {/* Menu Items - Added cursor-pointer to all buttons */}
          <div className="py-1">
            <button
              onClick={() => handleMenuClick("dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              role="menuitem"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleMenuClick("settings")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              role="menuitem"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => handleMenuClick("billing")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              role="menuitem"
            >
              <CreditCard className="w-5 h-5" />
              <span>Billing</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-medium hover:bg-red-50 transition-colors duration-200 cursor-pointer"
              role="menuitem"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
