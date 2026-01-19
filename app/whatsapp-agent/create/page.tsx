"use client"

import { IndustrySelection } from "@/components/dashboard/industry-selection"
import { useRouter } from "next/navigation"

export default function CreateAgentPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push("/whatsapp-agent")
  }

  const handleContinue = (industryId: string) => {
    // Store industry in sessionStorage for the next step
    sessionStorage.setItem("selected_industry", industryId)
    router.push("/whatsapp-agent/create/details")
  }

  return <IndustrySelection onBack={handleBack} onContinue={handleContinue} />
}
