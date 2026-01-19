"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import {
  Plus,
  Trash2,
  Loader2,
  MessageSquare,
  Users,
  Bot,
  Clock,
  TrendingUp,
  BookOpen,
  BarChart3,
  Settings,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { getAgents, createAgent, deleteAgent, generateQRCode, generatePairingCode, type Agent } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface WhatsAppViewProps {
  onAgentClick: (agentId: string) => void
}

// Stats card component
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
}

function StatsCard({ title, value, icon, iconBg }: StatsCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
        </div>
        <div className="flex items-center gap-1 mt-3">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span className="text-xs text-green-600 font-medium">Active</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick action card component
interface QuickActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  iconBg: string
  onClick?: () => void
}

function QuickActionCard({ title, description, icon, iconBg, onClick }: QuickActionCardProps) {
  return (
    <Card
      className="border shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>{icon}</div>
        <h3 className="font-semibold text-sm text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// Chart data for WhatsApp messages
const messageVolumeData = [
  { day: "Mon", messages: 120 },
  { day: "Tue", messages: 185 },
  { day: "Wed", messages: 95 },
  { day: "Thu", messages: 210 },
  { day: "Fri", messages: 165 },
  { day: "Sat", messages: 78 },
  { day: "Sun", messages: 134 },
]

export function WhatsAppView({ onAgentClick }: WhatsAppViewProps) {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [profileName, setProfileName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isGeneratingPairing, setIsGeneratingPairing] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const userName = user?.full_name || user?.email?.split("@")[0] || "User"
  const maxAssistants = 1

  // WhatsApp specific stats
  const whatsappStats = {
    totalMessages: 987,
    activeConversations: 24,
    aiResponsesToday: 156,
    avgResponseTime: "1.2s",
  }

  const loadAgents = useCallback(async () => {
    if (!token) return
    try {
      const response = await getAgents(token)
      setAgents(response.agents || [])
    } catch (error) {
      console.error("Error loading agents:", error)
    }
  }, [token])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const handleCreateProfile = async () => {
    if (!token || !profileName.trim()) return
    setIsCreating(true)
    try {
      await createAgent(token, profileName, "")
      await loadAgents()
      setIsCreateModalOpen(false)
      setProfileName("")
      toast({
        title: "Success",
        description: "WhatsApp profile created successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProfile = async (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) return
    setIsDeleting(agentId)
    try {
      await deleteAgent(token, agentId)
      await loadAgents()
      toast({
        title: "Deleted",
        description: "WhatsApp profile deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete profile",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleConnectClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setQrCode(null)
    setPairingCode(null)
    setPhoneNumber("")
    setIsConnectModalOpen(true)
  }

  const handleGenerateQR = async () => {
    if (!token || !selectedAgent) return
    setIsGeneratingQR(true)
    try {
      const response = await generateQRCode(token, selectedAgent.id)
      setQrCode(response.qr_code)
      toast({
        title: "Ready to Connect",
        description: "Scan this QR code with WhatsApp to connect your number",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate QR code",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleGeneratePairingCode = async () => {
    if (!token || !selectedAgent || !phoneNumber.trim()) return
    setIsGeneratingPairing(true)
    try {
      const response = await generatePairingCode(token, selectedAgent.id, phoneNumber)
      setPairingCode(response.pairing_code)
      toast({
        title: "Pairing Code Generated",
        description: "Enter this code in WhatsApp to connect",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate pairing code",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPairing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#DCF8C6] to-[#25D366]/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <MessageSquare className="w-8 h-8 text-[#25D366]" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#128C7E]">WhatsApp Agent</h1>
        </div>
        <p className="text-[#075E54]">Manage your WhatsApp AI assistants and conversations</p>
      </div>

      {/* WhatsApp Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Messages"
          value={whatsappStats.totalMessages}
          icon={<MessageSquare className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatsCard
          title="Active Conversations"
          value={whatsappStats.activeConversations}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatsCard
          title="AI Responses Today"
          value={whatsappStats.aiResponsesToday}
          icon={<Bot className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatsCard
          title="Avg Response Time"
          value={whatsappStats.avgResponseTime}
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
          <div className="h-1 w-16 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <QuickActionCard
            title="Create New Agent"
            description="Setup a new WhatsApp assistant"
            icon={<Plus className="w-5 h-5 text-green-600" />}
            iconBg="bg-green-100"
            onClick={() => setIsCreateModalOpen(true)}
          />
          <QuickActionCard
            title="View Conversations"
            description="See all chat histories"
            icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-100"
          />
          <QuickActionCard
            title="Knowledge Base"
            description="Manage AI training data"
            icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-100"
          />
          <QuickActionCard
            title="Analytics"
            description="View detailed reports"
            icon={<BarChart3 className="w-5 h-5 text-pink-600" />}
            iconBg="bg-pink-100"
          />
          <QuickActionCard
            title="Settings"
            description="Configure agent settings"
            icon={<Settings className="w-5 h-5 text-gray-600" />}
            iconBg="bg-gray-100"
          />
        </div>
      </div>

      {/* Message Volume Chart */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">WhatsApp Message Volume</CardTitle>
          <CardDescription>Daily incoming and outgoing messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messageVolumeData}>
                <defs>
                  <linearGradient id="whatsappGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="#25D366"
                  strokeWidth={2}
                  fill="url(#whatsappGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Agents Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">WhatsApp Agents</h2>
          <p className="text-sm text-muted-foreground">
            {agents.length}/{maxAssistants} agents configured
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#25D366] hover:bg-[#128C7E] text-white"
          disabled={agents.length >= maxAssistants}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Agent Cards */}
      {agents.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No WhatsApp agents created yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Click &quot;Create Agent&quot; to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
              onClick={() => onAgentClick(agent.id)}
            >
              <CardContent className="p-5">
                <button
                  onClick={(e) => handleDeleteProfile(agent.id, e)}
                  className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors"
                  disabled={isDeleting === agent.id}
                >
                  {isDeleting === agent.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  )}
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <h3 className="font-semibold text-lg pr-8">{agent.name}</h3>
                </div>

                <Badge
                  variant="secondary"
                  className={
                    agent.status === "connected"
                      ? "bg-green-100 text-green-800"
                      : agent.status === "connecting"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                  }
                >
                  {agent.status === "connected"
                    ? "Connected"
                    : agent.status === "connecting"
                      ? "Connecting..."
                      : "Not Connected"}
                </Badge>

                {agent.status !== "connected" && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleConnectClick(agent)
                    }}
                    className="w-full mt-4 bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    Connect WhatsApp
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Profile Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create WhatsApp Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="profileName" className="text-sm font-medium">
                Agent Name
              </label>
              <Input
                id="profileName"
                placeholder="e.g., Customer Support"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateProfile}
              disabled={isCreating || !profileName.trim()}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Agent"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connect WhatsApp Modal */}
      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect WhatsApp Business Number</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">QR Code</TabsTrigger>
              <TabsTrigger value="pairing">Pairing Code</TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4 pt-4">
              {!qrCode ? (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Click below to generate a QR code to connect your WhatsApp
                  </p>
                  <Button
                    onClick={handleGenerateQR}
                    disabled={isGeneratingQR}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    {isGeneratingQR ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate QR Code"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="p-4 bg-white border rounded-lg">
                      <img
                        src={qrCode || "/placeholder.svg"}
                        alt="WhatsApp QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open WhatsApp on your phone</li>
                      <li>Tap Settings then Linked Devices</li>
                      <li>Tap Link a Device</li>
                      <li>Scan this QR code</li>
                    </ol>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting for you to scan...
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="pairing" className="space-y-4 pt-4">
              {!pairingCode ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="text-sm font-medium">
                      WhatsApp Phone Number
                    </label>
                    <Input
                      id="phoneNumber"
                      placeholder="e.g., 212612345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Enter your full phone number with country code</p>
                  </div>
                  <Button
                    onClick={handleGeneratePairingCode}
                    disabled={isGeneratingPairing || !phoneNumber.trim()}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    {isGeneratingPairing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Pairing Code"
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">Enter this code in WhatsApp:</p>
                  <div className="text-3xl font-mono font-bold tracking-widest text-[#25D366]">{pairingCode}</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-left">
                      <li>Open WhatsApp on your phone</li>
                      <li>Tap Settings then Linked Devices</li>
                      <li>Tap Link a Device</li>
                      <li>Tap &quot;Link with phone number instead&quot;</li>
                      <li>Enter the pairing code above</li>
                    </ol>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button variant="outline" onClick={() => setIsConnectModalOpen(false)} className="w-full mt-2">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
