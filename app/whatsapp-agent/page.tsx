"use client"

import { WhatsAppAgentView } from "@/components/dashboard/whatsapp-agent-view"
import { useRouter } from "next/navigation"

export default function WhatsAppAgentPage() {
  const router = useRouter()

  const handleCreateProfile = () => {
    router.push("/whatsapp-agent/create")
  }

  return <WhatsAppAgentView onCreateProfile={handleCreateProfile} />
}
