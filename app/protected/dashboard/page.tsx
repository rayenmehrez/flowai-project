"use client"
import {
  MessageCircle,
  Zap,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Lightbulb,
  Phone,
  Archive,
  LogOut,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      const { error } = await supabase.auth.signOut()

      if (error) throw error

      toast.success("Logged out successfully")

      router.replace("/login")
    } catch (err: any) {
      console.error("[Dashboard] Logout error:", err)
      toast.error("Failed to logout")
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to FlowAI!</h1>
          <p className="text-gray-600">Get started by creating your first WhatsApp AI agent</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sign out of your account"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <MessageCircle className="w-8 h-8 mb-3 text-blue-600" />
          <p className="text-sm text-gray-600 mb-1">Total Messages</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Zap className="w-8 h-8 mb-3 text-yellow-600" />
          <p className="text-sm text-gray-600 mb-1">Active Agents</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <TrendingUp className="w-8 h-8 mb-3 text-green-600" />
          <p className="text-sm text-gray-600 mb-1">Response Rate</p>
          <p className="text-3xl font-bold text-gray-900">0%</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <CreditCard className="w-8 h-8 mb-3 text-purple-600" />
          <p className="text-sm text-gray-600 mb-1">Credits Left</p>
          <p className="text-3xl font-bold text-gray-900">400</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/whatsapp-agent"
            className="block bg-white rounded-xl border-2 border-purple-200 p-6 hover:border-purple-400 hover:shadow-lg transition"
          >
            <MessageSquare className="w-10 h-10 mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Agent</h3>
            <p className="text-sm text-gray-600 mb-4">Automate WhatsApp conversations with AI</p>
            <div className="flex items-center justify-between">
              <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold">
                Active
              </span>
              <span className="text-purple-600 font-medium text-sm">Setup</span>
            </div>
          </a>

          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 opacity-50">
            <Lightbulb className="w-10 h-10 mb-4 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Agent</h3>
            <p className="text-sm text-gray-600 mb-4">Website live chat automation</p>
            <span className="inline-block bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-bold">
              Coming Soon
            </span>
          </div>

          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 opacity-50">
            <Phone className="w-10 h-10 mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice Agent</h3>
            <p className="text-sm text-gray-600 mb-4">Phone call automation</p>
            <span className="inline-block bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-bold">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Archive className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No activity yet. Create your first agent to get started!</p>
        </div>
      </div>
    </div>
  )
}
