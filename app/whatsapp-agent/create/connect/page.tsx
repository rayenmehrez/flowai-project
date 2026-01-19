"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { WhatsAppConnect } from "@/components/dashboard/whatsapp-connect"
import type { BusinessData } from "@/components/dashboard/business-details-form"
import { Loader2 } from "lucide-react"

export default function CreateAgentConnectPage() {
  return <CreateAgentConnectPageContent />
}

function CreateAgentConnectPageContent() {
  const router = useRouter()
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [qaCount, setQaCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedData = sessionStorage.getItem("business_data")
    const storedAgentId = sessionStorage.getItem("created_agent_id")
    const storedQa = sessionStorage.getItem("qa_items")

    if (!storedData) {
      router.push("/whatsapp-agent/create")
      return
    }

    setBusinessData(JSON.parse(storedData))
    setAgentId(storedAgentId)

    if (storedQa) {
      const qaItems = JSON.parse(storedQa)
      setQaCount(Array.isArray(qaItems) ? qaItems.length : 0)
    }

    setIsLoading(false)
  }, [router])

  const handleBack = () => {
    router.push("/whatsapp-agent/create/preview")
  }

  const handleComplete = () => {
    // Clear session storage
    sessionStorage.removeItem("selected_industry")
    sessionStorage.removeItem("business_data")
    sessionStorage.removeItem("created_agent_id")
    sessionStorage.removeItem("qa_items")

    router.push("/whatsapp-agent")
  }

  const handleSkip = () => {
    // Clear session storage
    sessionStorage.removeItem("selected_industry")
    sessionStorage.removeItem("business_data")
    sessionStorage.removeItem("created_agent_id")
    sessionStorage.removeItem("qa_items")

    router.push("/whatsapp-agent")
  }

  if (isLoading || !businessData || !agentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <WhatsAppConnect
      agentId={agentId}
      businessData={businessData}
      qaCount={qaCount}
      onBack={handleBack}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}
