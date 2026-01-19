"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AIPreview } from "@/components/dashboard/ai-preview"
import { useAuth } from "@/lib/auth-context"
import { createAgent } from "@/lib/api"
import type { BusinessData } from "@/components/dashboard/business-details-form"
import { Loader2 } from "lucide-react"

export default function CreateAgentPreviewPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [agentId, setAgentId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedData = sessionStorage.getItem("business_data")
    const storedAgentId = sessionStorage.getItem("created_agent_id")

    if (!storedData) {
      router.push("/whatsapp-agent/create")
      return
    }

    setBusinessData(JSON.parse(storedData))
    setAgentId(storedAgentId || undefined)
    setIsLoading(false)
  }, [router])

  const handleBack = () => {
    router.push("/whatsapp-agent/create/details")
  }

  const handleEditDetails = () => {
    router.push("/whatsapp-agent/create/details")
  }

  const handleContinue = async (items: unknown[]) => {
    if (!token || !businessData) return

    try {
      const industryId = sessionStorage.getItem("selected_industry")
      const description = JSON.stringify({
        industry: industryId,
        ...businessData,
        qaItems: items,
      })

      const agent = await createAgent(token, businessData.clinicName, description)

      sessionStorage.setItem("qa_items", JSON.stringify(items))
      sessionStorage.setItem("created_agent_id", agent.id)

      router.push("/whatsapp-agent/create/connect")
    } catch (error) {
      console.error("Error creating agent:", error)
      sessionStorage.setItem("qa_items", JSON.stringify(items))
      router.push("/whatsapp-agent/create/connect")
    }
  }

  if (isLoading || !businessData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <AIPreview
      businessData={businessData}
      agentId={agentId}
      onBack={handleBack}
      onContinue={handleContinue}
      onEditDetails={handleEditDetails}
    />
  )
}
