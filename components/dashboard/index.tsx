"use client"

import { useState } from "react"
import { Navbar } from "./navbar"
import { Sidebar, type View } from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"
import { DashboardView } from "./dashboard-view"
import { WhatsAppAgentView } from "./whatsapp-agent-view"
import { IndustrySelection } from "./industry-selection"
import { BusinessDetailsForm, type BusinessData } from "./business-details-form"
import { AIPreview } from "./ai-preview"
import { WhatsAppConnect } from "./whatsapp-connect"
import { SettingsView } from "./settings-view"
import { useAuth } from "@/lib/auth-context"
import { createAgent } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface DashboardProps {
  onLogout: () => void
  navItems?: any[]
  user?: any
  profile?: any
  sidebarOpen?: boolean
  setSidebarOpen?: (open: boolean) => void
}

type CreateStep = "industry" | "details" | "preview" | "connect" | null

export function Dashboard({ onLogout, navItems: _, user: __, profile: ___, sidebarOpen: ____, setSidebarOpen: _____ }: DashboardProps) {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [createStep, setCreateStep] = useState<CreateStep>(null)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null)
  const [qaItems, setQaItems] = useState<unknown[]>([])

  const handleViewChange = (view: View) => {
    setCurrentView(view)
    setCreateStep(null)
    setSelectedIndustry(null)
    setBusinessData(null)
    setCreatedAgentId(null)
    setQaItems([])
    setIsMobileMenuOpen(false)
  }

  const handleDropdownNavigate = (section: string) => {
    if (section === "dashboard") {
      setCurrentView("dashboard")
    } else if (section === "settings") {
      setCurrentView("settings")
    } else if (section === "billing") {
      setCurrentView("settings")
    }
    setCreateStep(null)
  }

  const handleStartCreateAgent = () => {
    setCreateStep("industry")
  }

  const handleIndustryBack = () => {
    setCreateStep(null)
  }

  const handleIndustryContinue = (industryId: string) => {
    setSelectedIndustry(industryId)
    setCreateStep("details")
  }

  const handleDetailsBack = () => {
    setCreateStep("industry")
  }

  const handleDetailsContinue = async (data: BusinessData) => {
    if (!token) return

    setBusinessData(data)

    try {
      setIsLoading(true)
      const description = JSON.stringify({
        industry: selectedIndustry,
        ...data,
      })
      const agent = await createAgent(token, data.clinicName, description)
      setCreatedAgentId(agent.id)
      setCreateStep("preview")
    } catch (error) {
      console.error("Error creating agent:", error)
      // Still proceed to preview even if agent creation fails
      setCreateStep("preview")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewBack = () => {
    setCreateStep("details")
  }

  const handleEditDetails = () => {
    setCreateStep("details")
  }

  const handlePreviewContinue = async (items: unknown[]) => {
    if (!token || !businessData) return

    try {
      setIsLoading(true)
      const description = JSON.stringify({
        industry: selectedIndustry,
        ...businessData,
        qaItems: items,
      })
      const agent = await createAgent(token, businessData.clinicName, description)

      setQaItems(items)
      setCreatedAgentId(agent.id)
      setCreateStep("connect")
    } catch (error) {
      console.error("Error creating agent:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectBack = () => {
    setCreateStep("preview")
  }

  const handleConnectComplete = () => {
    setCreateStep(null)
    setSelectedIndustry(null)
    setBusinessData(null)
    setCreatedAgentId(null)
    setQaItems([])
    setCurrentView("whatsapp-agent")
  }

  const handleSkipConnection = () => {
    setCreateStep(null)
    setSelectedIndustry(null)
    setBusinessData(null)
    setCreatedAgentId(null)
    setQaItems([])
    setCurrentView("whatsapp-agent")
  }

  const renderView = () => {
    if (createStep === "industry") {
      return <IndustrySelection onBack={handleIndustryBack} onContinue={handleIndustryContinue} />
    }

    if (createStep === "details" && selectedIndustry) {
      return (
        <BusinessDetailsForm
          industryId={selectedIndustry}
          onBack={handleDetailsBack}
          onContinue={handleDetailsContinue}
        />
      )
    }

    if (createStep === "preview" && businessData) {
      return (
        <AIPreview
          businessData={businessData}
          agentId={createdAgentId || undefined}
          onBack={handlePreviewBack}
          onContinue={handlePreviewContinue}
          onEditDetails={handleEditDetails}
        />
      )
    }

    if (createStep === "connect" && businessData && createdAgentId) {
      return (
        <WhatsAppConnect
          agentId={createdAgentId}
          businessData={businessData}
          qaCount={qaItems.length}
          onBack={handleConnectBack}
          onComplete={handleConnectComplete}
          onSkip={handleSkipConnection}
        />
      )
    }

    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView
            onNavigate={(view) => {
              if (view === "whatsapp-agent") {
                setCurrentView("whatsapp-agent")
              }
            }}
          />
        )
      case "whatsapp-agent":
        return <WhatsAppAgentView onCreateProfile={handleStartCreateAgent} />
      case "settings":
        return <SettingsView />
      default:
        return (
          <DashboardView
            onNavigate={(view) => {
              if (view === "whatsapp-agent") {
                setCurrentView("whatsapp-agent")
              }
            }}
          />
        )
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {isLoading && <LoadingSpinner />}

      <Sidebar currentView={currentView} onViewChange={handleViewChange} onLogout={onLogout} />

      <MobileSidebar
        isOpen={isMobileMenuOpen}
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={onLogout}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col md:ml-56">
        <Navbar
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          onLogout={onLogout}
          onNavigate={handleDropdownNavigate}
        />

        <main className="flex-1 overflow-auto page-transition">{renderView()}</main>
      </div>
    </div>
  )
}
