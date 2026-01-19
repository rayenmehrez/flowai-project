"use client"

import { useEffect, useState } from "react"
import { LayoutDashboard, MessageSquare, MessageCircle, Phone, Mail, LogOut, Zap, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { View } from "./sidebar"

interface MobileSidebarProps {
  isOpen: boolean
  currentView: View
  onViewChange: (view: View) => void
  onLogout: () => void
  onClose: () => void
}

export function MobileSidebar({ isOpen, currentView, onViewChange, onLogout, onClose }: MobileSidebarProps) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const isActive = (view: View) => {
    if (view === "dashboard") {
      return currentView === "dashboard"
    }
    if (view === "whatsapp-agent") {
      return currentView === "whatsapp-agent" || currentView === "create-agent"
    }
    return currentView === view
  }

  const handleItemClick = (view: View) => {
    setIsLoading(true)
    onViewChange(view)
    onClose()
    setTimeout(() => setIsLoading(false), 500)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300" onClick={onClose} />

      <aside className="fixed left-0 top-0 h-screen w-56 bg-white z-50 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out">
        {/* Header with logo and close button */}
        <div className="p-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleItemClick("dashboard")}>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">FlowAI</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard navigation */}
        <div className="p-3">
          <button
            onClick={() => handleItemClick("dashboard")}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]",
              isActive("dashboard")
                ? "bg-purple-50 text-purple-600 font-semibold border-l-[3px] border-purple-600 pl-[11px]"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* AI Agents section header */}
        <div className="px-3 pt-4 pb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI AGENTS</span>
        </div>

        <nav className="px-3 flex-1 space-y-1">
          {/* 1. WhatsApp Agent - ACTIVE (First) */}
          <button
            onClick={() => handleItemClick("whatsapp-agent")}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 min-h-[44px]",
              isActive("whatsapp-agent")
                ? "bg-purple-50 text-purple-600 font-semibold border-l-[3px] border-purple-600 pl-[11px] hover:bg-purple-100"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            <MessageSquare className="w-5 h-5" />
            <span>WhatsApp Agent</span>
          </button>

          {/* 2. Chat AI Agent - DISABLED (No badge) */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed min-h-[44px]">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Chat AI Agent</span>
          </div>

          {/* 3. Voice AI Agent - DISABLED (No badge) */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed min-h-[44px]">
            <Phone className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Voice AI Agent</span>
          </div>

          {/* 4. Email AI Agent - DISABLED (No badge) */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed min-h-[44px]">
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Email AI Agent</span>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="mt-auto p-3 border-t border-gray-200">
          {/* Credits CTA Card */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-3">
            <p className="text-sm font-semibold text-gray-900 mb-1">Need more credits?</p>
            <p className="text-xs text-gray-600 mb-3">Upgrade your plan for unlimited access</p>
            <Button className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 min-h-[44px]">
              Upgrade Now
            </Button>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 min-h-[44px]"
          >
            <LogOut className="w-5 h-5 text-gray-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
