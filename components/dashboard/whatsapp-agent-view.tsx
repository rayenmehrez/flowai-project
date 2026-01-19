"use client"
import { useEffect, useState } from "react"
import { Plus, Trash2, Loader2, Phone, X, QrCode, Smartphone, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { getAgents, deleteAgent, generateQRCode, generatePairingCode, type Agent } from "@/lib/api"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const creditUsageData = [
  { day: "Mon", credits: 45 },
  { day: "Tue", credits: 72 },
  { day: "Wed", credits: 38 },
  { day: "Thu", credits: 95 },
  { day: "Fri", credits: 62 },
  { day: "Sat", credits: 28 },
  { day: "Sun", credits: 51 },
]

interface WhatsAppAgentViewProps {
  onCreateProfile: () => void
}

export function WhatsAppAgentView({ onCreateProfile }: WhatsAppAgentViewProps) {
  const { token } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isGeneratingPairing, setIsGeneratingPairing] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [credits] = useState(390)
  const maxCredits = 1000
  const maxAssistants = 1
  const creditPercentage = Math.round((credits / maxCredits) * 100)

  const loadAgents = async () => {
    if (!token) return
    try {
      const response = await getAgents(token)
      setAgents(response.agents || [])
    } catch (error) {
      console.error("Error loading agents:", error)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [token])

  const handleDeleteProfile = async (agentId: string) => {
    if (!token) return
    setIsDeleting(agentId)
    try {
      await deleteAgent(token, agentId)
      await loadAgents()
    } catch (error) {
      console.error("Error deleting profile:", error)
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
    } catch (error) {
      console.error("Error generating QR code:", error)
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
    } catch (error) {
      console.error("Error generating pairing code:", error)
    } finally {
      setIsGeneratingPairing(false)
    }
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Info Banners */}
      <div className="space-y-3">
        {/* Credits Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800 flex-1">
            <span className="font-medium">Quick Info:</span> Each WhatsApp message processed costs{" "}
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 ml-1">
              2 credits
            </Badge>
          </p>
        </div>

        {/* Assistants Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-purple-800">
              <span className="font-medium">WhatsApp Assistants:</span>{" "}
              <span className="font-semibold">
                {agents.length}/{maxAssistants}
              </span>{" "}
              assistant used
            </p>
            <div className="w-full max-w-[200px] h-2 bg-purple-200 rounded-full mt-2">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${(agents.length / maxAssistants) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Profiles Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Profiles</h2>
          <p className="text-gray-600 mt-1">Connect WhatsApp numbers and configure AI assistants</p>
        </div>
        <Button
          onClick={onCreateProfile}
          disabled={agents.length >= maxAssistants}
          className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Profile
        </Button>
      </div>

      {/* Empty State or Profile Cards */}
      {agents.length === 0 ? (
        <Card className="max-w-2xl mx-auto border-2 border-dashed">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your First WhatsApp Profile</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Set up a WhatsApp profile, connect your number, and configure an AI assistant
            </p>
            <Button onClick={onCreateProfile} className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-6">
              Create WhatsApp Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{agent.name}</h3>
                  <button
                    onClick={() => handleDeleteProfile(agent.id)}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    disabled={isDeleting === agent.id}
                  >
                    {isDeleting === agent.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    )}
                  </button>
                </div>

                <Badge
                  variant="secondary"
                  className={agent.status === "connected" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                >
                  {agent.status === "connected" ? "Connected" : "Not Connected"}
                </Badge>

                {agent.status === "connected" && (
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Last active: Just now</p>
                    <p>Messages today: 0</p>
                  </div>
                )}

                {agent.status !== "connected" && (
                  <Button
                    onClick={() => handleConnectClick(agent)}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Connect WhatsApp Business Number
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Credits Usage Chart */}
        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Credits Usage Over Time</CardTitle>
            <CardDescription>Track your daily credit spending patterns</CardDescription>
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-3">
                Daily
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 px-3 bg-transparent">
                Weekly
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={creditUsageData}>
                  <defs>
                    <linearGradient id="creditGradientWA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} width={35} />
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
                    dataKey="credits"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fill="url(#creditGradientWA)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Credit Balance */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Credit Balance</CardTitle>
            <CardDescription>Your available credits</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-0">
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="#E5E7EB" strokeWidth="10%" fill="none" />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="#7C3AED"
                  strokeWidth="10%"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(creditPercentage / 100) * 283} 283`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{credits}</span>
                <span className="text-sm text-gray-500">credits</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">of {maxCredits.toLocaleString()} credits</p>
            <Badge className="mt-2 bg-purple-100 text-purple-700">{creditPercentage}% remaining</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Connect Modal */}
      {isConnectModalOpen && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Connect WhatsApp</CardTitle>
                <button onClick={() => setIsConnectModalOpen(false)} className="p-1.5 rounded-md hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription>Connect your WhatsApp Business number to {selectedAgent.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="qr">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="qr" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger value="pairing" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Pairing Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="qr" className="space-y-4">
                  {!qrCode ? (
                    <Button
                      onClick={handleGenerateQR}
                      disabled={isGeneratingQR}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                  ) : (
                    <div className="text-center">
                      <div className="bg-white p-4 rounded-lg border inline-block mb-4">
                        <img src={qrCode || "/placeholder.svg"} alt="WhatsApp QR Code" className="w-48 h-48" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Open WhatsApp on your phone, go to Settings &gt; Linked Devices &gt; Link a Device
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pairing" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Phone Number (with country code)
                    </label>
                    <Input
                      type="tel"
                      placeholder="+216 12345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  {!pairingCode ? (
                    <Button
                      onClick={handleGeneratePairingCode}
                      disabled={isGeneratingPairing || !phoneNumber.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                  ) : (
                    <div className="text-center">
                      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mb-4">
                        <p className="text-3xl font-mono font-bold text-purple-700 tracking-wider">{pairingCode}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Open WhatsApp on your phone, go to Settings &gt; Linked Devices &gt; Link with phone number
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
