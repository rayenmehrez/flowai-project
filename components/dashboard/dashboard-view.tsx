"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  Mail,
  Video,
  Share2,
  ImageIcon,
  Phone,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAgents, type Agent } from "@/lib/api"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

const creditUsageData = [
  { day: "Mon", credits: 45 },
  { day: "Tue", credits: 72 },
  { day: "Wed", credits: 38 },
  { day: "Thu", credits: 95 },
  { day: "Fri", credits: 62 },
  { day: "Sat", credits: 28 },
  { day: "Sun", credits: 51 },
]

const quickActions = [
  {
    id: "whatsapp-agent",
    icon: MessageSquare,
    iconBg: "bg-purple-600",
    iconColor: "text-white",
    title: "WhatsApp Agent",
    description: "Connect WhatsApp numbers",
    disabled: false,
  },
  {
    id: "image-generator",
    icon: ImageIcon,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "AI Image Generator",
    description: "Create & edit images with AI",
    disabled: true,
  },
  {
    id: "video-generator",
    icon: Video,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    title: "Video Ad Generator",
    description: "Create AI-powered video ads",
    disabled: true,
  },
  {
    id: "social-media",
    icon: Share2,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Social Media",
    description: "Manage your social posts",
    disabled: true,
  },
  {
    id: "voice-agent",
    icon: Phone,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    title: "Voice Agent",
    description: "Configure voice calls",
    disabled: true,
  },
]

export function DashboardView() {
  const { user } = useAuth()
  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [agents, setAgents] = useState<Agent[]>([])

  const [stats, setStats] = useState({
    totalMessages: 0,
    emailsProcessed: 0,
    videosGenerated: 0,
    postsPublished: 0,
  })

  const credits = 390
  const maxCredits = 1000
  const creditPercentage = Math.round((credits / maxCredits) * 100)

  const fullName = user?.full_name || user?.email?.split("@")[0] || "User"
  const userName = fullName.charAt(0).toUpperCase() + fullName.slice(1)

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const agentsData = await getAgents()
      setAgents(agentsData || [])

      setStats({
        totalMessages: agentsData?.length || 0,
        emailsProcessed: 0,
        videosGenerated: 0,
        postsPublished: 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    loadDashboardData()

    const timeout = setTimeout(() => {
      setLoadingTimeout(true)
      setIsLoading(false)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [user])

  const handleRetry = () => {
    const next = retryCount + 1
    setRetryCount(next)

    if (next <= 3) {
      setTimeout(loadDashboardData, Math.pow(2, next - 1) * 1000)
    } else {
      setError("Max retry attempts reached.")
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <AlertCircle className="w-5 h-5 text-red-600 mb-2" />
          <p className="text-red-700 text-sm">{error}</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.replace("/login")
    return null
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Welcome */}
      <div className="px-8 py-6">
        <div className="bg-purple-50 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-purple-900">
            Welcome back, {userName}!
          </h1>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 py-6">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon

            if (action.disabled) {
              return (
                <div
                  key={action.id}
                  className="bg-white border rounded-xl p-6 opacity-60 cursor-not-allowed"
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600">{action.title}</p>
                </div>
              )
            }

            return (
              <div
                key={action.id}
                className="bg-white border rounded-xl p-6 text-center hover:shadow-md cursor-pointer"
                onClick={() => router.push("/whatsapp-agent")}
              >
                <div
                  className={`w-14 h-14 ${action.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className={`w-8 h-8 ${action.iconColor}`} />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push("/whatsapp-agent")
                  }}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm"
                >
                  Setup
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={creditUsageData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="credits"
                stroke="#7C3AED"
                fill="#DDD6FE"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border text-center">
          <p className="text-gray-600 mb-2">Credits</p>
          <p className="text-5xl font-bold">{credits}</p>
          <p className="text-sm text-gray-500 mt-2">
            {creditPercentage}% remaining
          </p>
        </div>
      </div>
    </div>
  )
}
