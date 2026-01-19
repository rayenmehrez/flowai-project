"use client"

import { useState, useEffect } from "react"
import {
  QrCode,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Smartphone,
  Settings,
  Link2,
  Building2,
  MapPin,
  Sparkles,
  Globe,
  HelpCircle,
  MessageCircle,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { generateQRCode, generatePairingCode } from "@/lib/api"
import type { BusinessData } from "./business-details-form"

interface WhatsAppConnectProps {
  agentId: string
  businessData: BusinessData
  qaCount: number
  onBack: () => void
  onComplete: () => void
  onSkip: () => void
}

type ConnectionStatus = "idle" | "generating" | "waiting" | "connecting" | "connected" | "error" | "expired"
type ActiveTab = "qr" | "pairing"

export function WhatsAppConnect({ agentId, businessData, qaCount, onBack, onComplete, onSkip }: WhatsAppConnectProps) {
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("qr")
  const [status, setStatus] = useState<ConnectionStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // QR Code state
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrExpiry, setQrExpiry] = useState(180) // 3 minutes in seconds
  const [qrChecklist, setQrChecklist] = useState({
    appInstalled: false,
    hasInternet: false,
    hasAccess: false,
  })

  // Pairing Code state
  const [phoneNumber, setPhoneNumber] = useState("")
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingExpiry, setPairingExpiry] = useState(300) // 5 minutes
  const [copied, setCopied] = useState(false)

  // Connection result
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null)
  const [connectedAt, setConnectedAt] = useState<Date | null>(null)

  // Troubleshooting
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  // Timer for QR code expiry
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (status === "waiting" && qrExpiry > 0) {
      timer = setInterval(() => {
        setQrExpiry((prev) => {
          if (prev <= 1) {
            setStatus("expired")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [status, qrExpiry])

  // Timer for pairing code expiry
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (pairingCode && pairingExpiry > 0) {
      timer = setInterval(() => {
        setPairingExpiry((prev) => {
          if (prev <= 1) {
            setPairingCode(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [pairingCode, pairingExpiry])

  // Polling for connection status
  useEffect(() => {
    let pollTimer: NodeJS.Timeout
    if (status === "waiting" || status === "connecting") {
      pollTimer = setInterval(async () => {
        // Simulated polling - replace with actual API call
        // const response = await checkConnectionStatus(token, agentId)
        // if (response.connected) { ... }
        // For demo purposes, auto-connect after 10 seconds
        // Remove this in production
      }, 2000)
    }
    return () => clearInterval(pollTimer)
  }, [status, token, agentId])

  useEffect(() => {
    // Get token from sessionStorage (stored during login)
    const storedToken = sessionStorage.getItem("sb-auth-token")
    setToken(storedToken)
  }, [])

  const handleGenerateQR = async () => {
    if (!token) return

    setStatus("generating")
    setErrorMessage("")

    try {
      const response = await generateQRCode(token, agentId)
      setQrCode(response.qr_code)
      setQrExpiry(180)
      setStatus("waiting")
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate QR code")
    }
  }

  const handleGeneratePairingCode = async () => {
    if (!token || !phoneNumber.trim()) return

    setStatus("generating")
    setErrorMessage("")

    try {
      const response = await generatePairingCode(token, agentId, phoneNumber)
      setPairingCode(response.pairing_code)
      setPairingExpiry(300)
      setStatus("waiting")
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate pairing code")
    }
  }

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode.replace("-", ""))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegenerate = () => {
    if (activeTab === "qr") {
      handleGenerateQR()
    } else {
      handleGeneratePairingCode()
    }
  }

  // Simulated success for demo
  const simulateSuccess = () => {
    setStatus("connected")
    setConnectedNumber(phoneNumber || "+1 (555) 123-4567")
    setConnectedAt(new Date())
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isPhoneValid = phoneNumber.trim().length >= 10

  const allChecklistComplete = qrChecklist.appInstalled && qrChecklist.hasInternet && qrChecklist.hasAccess

  // Success State
  if (status === "connected") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          {/* Success Animation */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Connected Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Your AI agent is now live and ready to respond to customer messages automatically.
          </p>

          {/* Connection Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Smartphone className="w-4 h-4" />
              <span>Connected Number:</span>
              <span className="font-medium text-gray-900">{connectedNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Connected At:</span>
              <span className="font-medium text-gray-900">{connectedAt?.toLocaleString()}</span>
            </div>
          </div>

          {/* What's Next */}
          <div className="border-t pt-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">What happens next?</h3>
            <div className="text-left space-y-3">
              {[
                "Your AI will respond to WhatsApp messages",
                "Conversations are saved in your dashboard",
                "You can view all chats and analytics",
                "Edit AI responses anytime",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={onComplete} className="flex-1 bg-purple-600 hover:bg-purple-700">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              <MessageCircle className="w-4 h-4 mr-2" />
              Test AI Agent
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <span>WhatsApp Agent</span>
        <span className="mx-2">&gt;</span>
        <span>Create Agent</span>
        <span className="mx-2">&gt;</span>
        <span className="text-purple-600 font-medium">Connect WhatsApp</span>
      </nav>

      {/* Agent Info Card */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-purple-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-purple-900">{businessData.clinicName}</h3>
            <div className="flex items-center gap-2 text-sm text-purple-700 mt-1">
              <MapPin className="w-3 h-3" />
              <span>
                {businessData.city}, {businessData.country}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700 mt-1">
              <Sparkles className="w-3 h-3" />
              <span>{qaCount} AI responses ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-lg p-4 mb-6 border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Final Step: Connect Your WhatsApp</span>
          <span className="text-sm text-gray-500">100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }} />
        </div>
        <div className="space-y-2">
          {[
            { label: "Business details", done: true },
            { label: "AI responses configured", done: true },
            { label: "WhatsApp connection", done: false, current: true },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : step.current ? (
                <Clock className="w-4 h-4 text-purple-500 animate-pulse" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span
                className={step.done ? "text-gray-600" : step.current ? "text-purple-600 font-medium" : "text-gray-400"}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "qr"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <QrCode className="w-4 h-4 inline mr-2" />
            QR Code
          </button>
          <button
            onClick={() => setActiveTab("pairing")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "pairing"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Pairing Code
          </button>
        </div>

        <div className="p-6">
          {/* QR Code Tab */}
          {activeTab === "qr" && (
            <div>
              {status === "idle" || status === "error" || status === "expired" ? (
                <>
                  {/* Initial State */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your WhatsApp Business Number</h2>
                    <p className="text-gray-600">
                      Scan a QR code to link your WhatsApp Business account to this AI agent.
                    </p>
                  </div>

                  {/* Error Message */}
                  {(status === "error" || status === "expired") && (
                    <div
                      className={`rounded-lg p-4 mb-6 ${status === "expired" ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className={`w-5 h-5 mt-0.5 ${status === "expired" ? "text-yellow-600" : "text-red-600"}`}
                        />
                        <div>
                          <h4 className={`font-medium ${status === "expired" ? "text-yellow-800" : "text-red-800"}`}>
                            {status === "expired" ? "QR Code Expired" : "Failed to Generate QR Code"}
                          </h4>
                          <p className={`text-sm mt-1 ${status === "expired" ? "text-yellow-700" : "text-red-700"}`}>
                            {status === "expired"
                              ? "The QR code has expired. Please generate a new one."
                              : errorMessage || "We couldn't generate your QR code. Please try again."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-700">
                        Make sure you&apos;re using a WhatsApp Business account, not personal WhatsApp. Your phone must
                        have internet access during setup.
                      </p>
                    </div>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Requirements:</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={qrChecklist.appInstalled}
                          onCheckedChange={(checked) =>
                            setQrChecklist({ ...qrChecklist, appInstalled: checked as boolean })
                          }
                        />
                        <span className="text-sm text-gray-600">WhatsApp Business app installed on your phone</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={qrChecklist.hasInternet}
                          onCheckedChange={(checked) =>
                            setQrChecklist({ ...qrChecklist, hasInternet: checked as boolean })
                          }
                        />
                        <span className="text-sm text-gray-600">Phone has active internet connection</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={qrChecklist.hasAccess}
                          onCheckedChange={(checked) =>
                            setQrChecklist({ ...qrChecklist, hasAccess: checked as boolean })
                          }
                        />
                        <span className="text-sm text-gray-600">You have access to the phone right now</span>
                      </label>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerateQR}
                    disabled={!allChecklistComplete || status === "generating"}
                    className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {status === "generating" ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5 mr-2" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </>
              ) : status === "generating" ? (
                /* Loading State */
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Generating your QR code...</h3>
                  <p className="text-gray-500">This may take 10-20 seconds</p>
                </div>
              ) : (
                /* QR Code Display */
                <div className="text-center">
                  {/* Status */}
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
                      status === "connecting" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        status === "connecting" ? "bg-green-500" : "bg-purple-500"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {status === "connecting" ? "Connecting..." : "Waiting for scan"}
                    </span>
                  </div>

                  {/* QR Code */}
                  <div className="inline-block p-4 bg-white border-3 border-purple-600 rounded-xl shadow-lg mb-4">
                    {qrCode ? (
                      <img
                        src={qrCode || "/placeholder.svg"}
                        alt="WhatsApp QR Code"
                        className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px]"
                      />
                    ) : (
                      <div className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] bg-gray-100 flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Timer */}
                  <div
                    className={`flex items-center justify-center gap-2 mb-6 ${
                      qrExpiry < 30 ? "text-red-600" : qrExpiry < 60 ? "text-yellow-600" : "text-gray-600"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Expires in: {formatTime(qrExpiry)}</span>
                  </div>

                  {/* Instructions */}
                  <div className="border-t pt-6 mb-6">
                    <h3 className="font-medium text-gray-900 mb-4">How to Scan:</h3>
                    <div className="text-left space-y-3 max-w-sm mx-auto">
                      {[
                        { icon: Smartphone, text: "Open WhatsApp on your phone" },
                        { icon: Settings, text: "Tap Settings (or Menu ...)" },
                        { icon: Link2, text: 'Tap "Linked Devices"' },
                        { icon: QrCode, text: 'Tap "Link a Device"' },
                        { icon: CheckCircle, text: "Point your camera at this QR code" },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-purple-600">{i + 1}</span>
                          </div>
                          <span className="text-sm text-gray-600">{step.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleRegenerate} className="flex-1 bg-transparent">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button variant="outline" onClick={onBack} className="flex-1 bg-transparent">
                      Cancel
                    </Button>
                  </div>

                  {/* Demo button - remove in production */}
                  <Button variant="ghost" onClick={simulateSuccess} className="mt-4 text-xs text-gray-400">
                    (Demo: Simulate Success)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Pairing Code Tab */}
          {activeTab === "pairing" && (
            <div>
              {!pairingCode ? (
                <>
                  {/* Initial State */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                      <Key className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect with Pairing Code</h2>
                    <p className="text-gray-600">
                      Enter your WhatsApp Business number to receive an 8-digit pairing code.
                    </p>
                  </div>

                  {/* Error Message */}
                  {status === "error" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800">Failed to Generate Pairing Code</h4>
                          <p className="text-sm text-red-700 mt-1">
                            {errorMessage || "Please check the phone number and try again."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phone Number Input */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">WhatsApp Business Number</Label>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="h-12 text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Enter your WhatsApp Business phone number with country code
                    </p>
                  </div>

                  {/* Examples */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-500 mb-2">Examples:</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>+1 555 123 4567 (USA)</p>
                      <p>+44 20 1234 5678 (UK)</p>
                      <p>+971 50 123 4567 (UAE)</p>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGeneratePairingCode}
                    disabled={!isPhoneValid || status === "generating"}
                    className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {status === "generating" ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5 mr-2" />
                        Generate Pairing Code
                      </>
                    )}
                  </Button>
                </>
              ) : (
                /* Pairing Code Display */
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Pairing Code:</h3>

                  {/* Code Display */}
                  <div className="inline-block bg-purple-50 border-2 border-purple-200 rounded-xl p-8 mb-4">
                    <div className="text-5xl font-mono font-bold text-purple-600 tracking-wider">{pairingCode}</div>
                  </div>

                  {/* Copy Button */}
                  <Button variant="outline" onClick={handleCopyCode} className="mb-4 bg-transparent">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>

                  {/* Timer */}
                  <div
                    className={`flex items-center justify-center gap-2 mb-6 ${
                      pairingExpiry < 60 ? "text-red-600" : pairingExpiry < 120 ? "text-yellow-600" : "text-gray-600"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Expires in: {formatTime(pairingExpiry)}</span>
                  </div>

                  {/* Instructions */}
                  <div className="border-t pt-6 mb-6">
                    <h3 className="font-medium text-gray-900 mb-4">How to Use This Code:</h3>
                    <div className="text-left space-y-3 max-w-sm mx-auto">
                      {[
                        "Open WhatsApp Business on your phone",
                        "Tap Settings",
                        'Tap "Linked Devices"',
                        'Tap "Link with Phone Number"',
                        `Enter this code: ${pairingCode}`,
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-purple-600">{i + 1}</span>
                          </div>
                          <span className="text-sm text-gray-600">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-purple-50 rounded-lg p-3 mb-6">
                    <div className="flex items-center justify-center gap-2 text-purple-700">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">Waiting for you to enter code...</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleRegenerate} className="flex-1 bg-transparent">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button variant="outline" onClick={() => setPairingCode(null)} className="flex-1">
                      Cancel
                    </Button>
                  </div>

                  {/* Demo button - remove in production */}
                  <Button variant="ghost" onClick={simulateSuccess} className="mt-4 text-xs text-gray-400">
                    (Demo: Simulate Success)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="mt-6">
        <button
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-gray-600">
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">Having trouble connecting?</span>
          </div>
          {showTroubleshooting ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showTroubleshooting && (
          <div className="mt-2 bg-white rounded-lg border p-6">
            <div className="space-y-6">
              {[
                {
                  title: "QR code won't scan",
                  tips: [
                    "Make sure camera has permission",
                    "Try regenerating the QR code",
                    "Ensure good lighting",
                    "Clean your phone camera lens",
                  ],
                },
                {
                  title: "Pairing code not working",
                  tips: [
                    "Double-check you entered it correctly",
                    "Make sure WhatsApp Business is updated",
                    "Try QR code method instead",
                  ],
                },
                {
                  title: "Connection keeps failing",
                  tips: [
                    "Check your phone's internet connection",
                    "Restart WhatsApp Business app",
                    "Clear WhatsApp cache (Settings > Storage)",
                    "Try again in a few minutes",
                  ],
                },
              ].map((section, i) => (
                <div key={i}>
                  <h4 className="font-medium text-gray-900 mb-2">{section.title}</h4>
                  <ul className="space-y-1">
                    {section.tips.map((tip, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-400">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3">Still not working?</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Live Chat
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skip Option */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowSkipConfirm(true)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          I'll connect WhatsApp later
        </button>
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skip WhatsApp Connection?</h3>
            <p className="text-gray-600 text-sm mb-6">
              Your agent will be created but won't respond to messages until you connect WhatsApp. You can connect later
              from the dashboard.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowSkipConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={onSkip} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Skip for Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
