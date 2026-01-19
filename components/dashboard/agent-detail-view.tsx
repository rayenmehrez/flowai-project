"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Eye, MessageCircle, BookOpen, MessagesSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { getAgent, connectWhatsApp, disconnectWhatsApp, type Agent } from "@/lib/api"
import { cn } from "@/lib/utils"

interface AgentDetailViewProps {
  agentId: string
  onBack: () => void
}

export function AgentDetailView({ agentId, onBack }: AgentDetailViewProps) {
  const { token } = useAuth()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadAgent = async () => {
    if (!token) return
    try {
      const data = await getAgent(token, agentId)
      setAgent(data)
    } catch (error) {
      console.error("Error loading agent:", error)
    }
  }

  useEffect(() => {
    loadAgent()
  }, [token, agentId])

  const handleConnect = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      await connectWhatsApp(token, agentId)
      await loadAgent()
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!token || !confirm("Are you sure you want to disconnect WhatsApp?")) return
    setIsLoading(true)
    try {
      await disconnectWhatsApp(token, agentId)
      await loadAgent()
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!agent) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <h1 className="text-2xl md:text-3xl font-bold mb-6">{agent.name}</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Knowledge</span>
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{agent.description || "No description provided"}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Connection</CardTitle>
              <CardDescription>Manage your WhatsApp integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    agent.status === "connected" && "bg-green-100 text-green-800",
                    agent.status === "connecting" && "bg-yellow-100 text-yellow-800",
                    agent.status === "disconnected" && "bg-muted text-muted-foreground",
                  )}
                >
                  {agent.status}
                </Badge>
              </div>

              {agent.status === "disconnected" && (
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Connect WhatsApp"}
                </Button>
              )}

              {agent.status === "connecting" && agent.qr_code && (
                <div className="text-center p-6 bg-muted rounded-lg">
                  <p className="mb-4 text-muted-foreground">Scan the QR code with WhatsApp</p>
                  <img
                    src={agent.qr_code || "/placeholder.svg"}
                    alt="WhatsApp QR Code"
                    className="max-w-xs mx-auto rounded"
                  />
                </div>
              )}

              {agent.status === "connected" && (
                <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
                  {isLoading ? "Disconnecting..." : "Disconnect"}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Train your agent with custom knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Knowledge base feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>View chat history with your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Conversations feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
