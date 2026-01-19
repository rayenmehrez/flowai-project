"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getAgents, type Agent } from "@/lib/api"
import { AgentCard } from "./agent-card"

interface AgentsViewProps {
  onCreateAgent: () => void
  onAgentClick: (agentId: string) => void
}

export function AgentsView({ onCreateAgent, onAgentClick }: AgentsViewProps) {
  const { token } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    if (token) {
      getAgents(token)
        .then((response) => setAgents(response.agents || []))
        .catch(console.error)
    }
  }, [token])

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">My Agents</h1>
        <Button onClick={onCreateAgent}>
          <Plus className="w-4 h-4 mr-2" />
          New Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No agents created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onClick={() => onAgentClick(agent.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
