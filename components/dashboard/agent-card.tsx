"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Agent } from "@/lib/api"
import { cn } from "@/lib/utils"

interface AgentCardProps {
  agent: Agent
  onClick: () => void
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" onClick={onClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{agent.name}</CardTitle>
        <CardDescription className="line-clamp-2">{agent.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
