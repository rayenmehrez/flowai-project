"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BusinessDetailsForm, type BusinessData } from "@/components/dashboard/business-details-form"
import { useAuth } from "@/lib/auth-context"
import { createAgent } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function CreateAgentDetailsPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [industryId, setIndustryId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem("selected_industry")
    if (!stored) {
      router.push("/whatsapp-agent/create")
      return
    }
    setIndustryId(stored)
    setIsLoading(false)
  }, [router])

  const handleBack = () => {
    router.push("/whatsapp-agent/create")
  }

  const handleContinue = async (data: BusinessData) => {
    if (!token || !industryId) return

    try {
      const description = JSON.stringify({
        industry: industryId,
        ...data,
      })
      const agent = await createAgent(token, data.clinicName, description)

      // Store business data and agent ID for preview
      sessionStorage.setItem("business_data", JSON.stringify(data))
      sessionStorage.setItem("created_agent_id", agent.id)

      router.push("/whatsapp-agent/create/preview")
    } catch (error) {
      console.error("Error creating agent:", error)
      // Still proceed to preview
      sessionStorage.setItem("business_data", JSON.stringify(data))
      router.push("/whatsapp-agent/create/preview")
    }
  }

  if (isLoading || !industryId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return <BusinessDetailsForm industryId={industryId} onBack={handleBack} onContinue={handleContinue} />
}
