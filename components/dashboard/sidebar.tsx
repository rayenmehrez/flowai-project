"use client"

import { LayoutDashboard, MessageSquare, MessageCircle, Phone, Mail, LogOut, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/usePermissions"

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const { isAdmin } = usePermissions()

  const navigate = (path: string) => {
    setIsLoading(true)
    router.push(path)
    setIsLoading(false)
  }

  const isActive = (path: string) => pathname === path

  return (
    <aside className="hidden md:flex w-56 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 flex-col z-30">
      {/* Logo */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">FlowAI</span>
        </div>
      </div>

      {/* Dashboard */}
      <div className="p-3">
        <button
          onClick={() => navigate("/dashboard")}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all",
            isActive("/dashboard")
              ? "bg-purple-50 text-purple-600 font-semibold border-l-[3px] border-purple-600 pl-[11px]"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Agents */}
      <div className="px-3 pt-4 pb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">AI AGENTS</span>
      </div>

      <nav className="px-3 flex-1 space-y-1">
        <button
          onClick={() => navigate("/whatsapp-agent")}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all",
            isActive("/whatsapp-agent")
              ? "bg-purple-50 text-purple-600 font-semibold border-l-[3px] border-purple-600 pl-[11px]"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <span>WhatsApp Agent</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2 opacity-50">
          <MessageCircle className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">Chat AI Agent</span>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 opacity-50">
          <Phone className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">Voice AI Agent</span>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 opacity-50">
          <Mail className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">Email AI Agent</span>
        </div>
      </nav>

      {/* Logout */}
      <div className="mt-auto p-3 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
