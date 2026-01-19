"use client"

import { useState, useEffect } from "react"
import { X, QrCode, Loader2, CheckCircle, Clock, Settings, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateQRCode, generatePairingCode } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface WhatsAppConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (phoneNumber: string) => void
  agentId: string
}

type ModalState = "initial" | "generating" | "qr-displayed" | "pairing-displayed" | "success"
type ActiveTab = "qr" | "pairing"

export function WhatsAppConnectionModal({ isOpen, onClose, onSuccess, agentId }: WhatsAppConnectionModalProps) {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>("qr")
  const [state, setState] = useState<ModalState>("initial")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrExpiry, setQrExpiry] = useState(180)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingExpiry, setPairingExpiry] = useState(300)
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null)
  const [connectedAt, setConnectedAt] = useState<Date | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState("initial")
      setQrCode(null)
      setPairingCode(null)
      setQrExpiry(180)
      setPairingExpiry(300)
    }
  }, [isOpen])

  // QR code expiry timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (state === "qr-displayed" && qrExpiry > 0) {
      timer = setInterval(() => {
        setQrExpiry((prev) => {
          if (prev <= 1) {
            setState("initial")
            setQrCode(null)
            return 180
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [state, qrExpiry])

  // Pairing code expiry timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (state === "pairing-displayed" && pairingExpiry > 0) {
      timer = setInterval(() => {
        setPairingExpiry((prev) => {
          if (prev <= 1) {
            setState("initial")
            setPairingCode(null)
            return 300
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [state, pairingExpiry])

  // Polling for connection status (simulated)
  useEffect(() => {
    let pollTimer: NodeJS.Timeout
    if (state === "qr-displayed" || state === "pairing-displayed") {
      pollTimer = setInterval(() => {
        // In production, replace with actual API call to check connection status
        // For demo, we'll keep polling without auto-connecting
      }, 2000)
    }
    return () => clearInterval(pollTimer)
  }, [state])

  const handleGenerateQR = async () => {
    if (!token) return

    setState("generating")
    try {
      const response = await generateQRCode(token, agentId)
      setQrCode(response.qr_code)
      setQrExpiry(180)
      setState("qr-displayed")
    } catch (error) {
      console.error("Error generating QR code:", error)
      setState("initial")
    }
  }

  const handleGeneratePairingCode = async () => {
    if (!token || !phoneNumber.trim()) return

    setState("generating")
    try {
      const response = await generatePairingCode(token, agentId, phoneNumber)
      setPairingCode(response.pairing_code)
      setPairingExpiry(300)
      setState("pairing-displayed")
    } catch (error) {
      console.error("Error generating pairing code:", error)
      setState("initial")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Simulated success handler (for testing)
  const handleSimulateSuccess = () => {
    const number = phoneNumber || "+212 612 345 678"
    setConnectedNumber(number)
    setConnectedAt(new Date())
    setState("success")
  }

  const handleGoToDashboard = () => {
    if (connectedNumber) {
      onSuccess(connectedNumber)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Success State */}
        {state === "success" ? (
          <div className="p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Connected!</h2>
            <p className="text-gray-600 mb-2">Phone: {connectedNumber}</p>
            <p className="text-sm text-gray-500 mb-6">Connected at {connectedAt?.toLocaleTimeString()}</p>

            <Button onClick={handleGoToDashboard} className="bg-purple-600 hover:bg-purple-700 px-8 py-3">
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => {
                  setActiveTab("qr")
                  if (state !== "generating") setState("initial")
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "qr"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                QR Code
              </button>
              <button
                onClick={() => {
                  setActiveTab("pairing")
                  if (state !== "generating") setState("initial")
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "pairing"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Pairing Code
              </button>
            </div>

            <div className="p-6">
              {/* QR Code Tab */}
              {activeTab === "qr" && (
                <>
                  {state === "initial" && (
                    <div className="text-center py-8">
                      <h2 className="text-2xl font-bold mb-2">Connect WhatsApp Business Number</h2>
                      <p className="text-gray-600 mb-8">Click below to generate a QR code to connect your WhatsApp</p>

                      <Button
                        onClick={handleGenerateQR}
                        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700"
                      >
                        Generate QR Code
                      </Button>

                      <button onClick={onClose} className="mt-4 block w-full text-gray-600 hover:text-gray-900">
                        Close
                      </button>
                    </div>
                  )}

                  {state === "generating" && (
                    <div className="text-center py-12">
                      <Loader2 className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Generating...</h3>
                      <p className="text-gray-500">Please wait a moment</p>
                    </div>
                  )}

                  {state === "qr-displayed" && (
                    <div className="text-center">
                      <h2 className="text-xl font-bold mb-6">Connect WhatsApp Business Number</h2>

                      {/* QR Code */}
                      <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-6 inline-block">
                        {qrCode ? (
                          <img src={qrCode || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
                        ) : (
                          <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                            <QrCode className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Instructions */}
                      <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                        <ol className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="font-medium">1.</span>
                            <span>Open WhatsApp on your phone</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium">2.</span>
                            <span>
                              Tap <Settings className="w-4 h-4 inline" /> Settings → Linked Devices
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium">3.</span>
                            <span>
                              Tap <Link2 className="w-4 h-4 inline" /> Link a Device
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium">4.</span>
                            <span>Scan this QR code</span>
                          </li>
                        </ol>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-center gap-2 text-purple-600 mb-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Waiting for you to scan...</span>
                      </div>

                      {/* Timer */}
                      <div
                        className={`flex items-center justify-center gap-2 text-sm mb-4 ${qrExpiry < 30 ? "text-red-600" : "text-gray-500"}`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Expires in {formatTime(qrExpiry)}</span>
                      </div>

                      {/* Demo button - remove in production */}
                      <button
                        onClick={handleSimulateSuccess}
                        className="text-xs text-gray-400 hover:text-gray-600 mb-4"
                      >
                        [Demo: Simulate Success]
                      </button>

                      <button onClick={onClose} className="block w-full text-gray-600 hover:text-gray-900">
                        Close
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Pairing Code Tab */}
              {activeTab === "pairing" && (
                <>
                  {(state === "initial" || state === "pairing-displayed") && !pairingCode && (
                    <div className="py-8">
                      <h2 className="text-xl font-bold mb-4">WhatsApp Phone Number</h2>

                      <Input
                        type="tel"
                        placeholder="e.g., 212612345678 (country code + number, no spaces)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-2"
                      />

                      <p className="text-sm text-gray-600 mb-6">
                        Enter your full phone number with country code (e.g., 212612345678 for Morocco)
                      </p>

                      <Button
                        onClick={handleGeneratePairingCode}
                        disabled={phoneNumber.trim().length < 10}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        Generate Pairing Code
                      </Button>

                      <button onClick={onClose} className="mt-4 w-full text-gray-600 hover:text-gray-900">
                        Close
                      </button>
                    </div>
                  )}

                  {state === "generating" && (
                    <div className="text-center py-12">
                      <Loader2 className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Generating...</h3>
                      <p className="text-gray-500">Please wait a moment</p>
                    </div>
                  )}

                  {state === "pairing-displayed" && pairingCode && (
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold mb-4">Your Pairing Code</h2>

                      <div className="bg-gray-100 rounded-xl p-6 mb-4">
                        <p className="text-4xl font-mono font-bold text-purple-600 tracking-widest">{pairingCode}</p>
                      </div>

                      <div
                        className={`flex items-center justify-center gap-2 text-sm mb-4 ${pairingExpiry < 60 ? "text-red-600" : "text-gray-500"}`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Expires in {formatTime(pairingExpiry)}</span>
                      </div>

                      <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                        <ol className="space-y-2 text-sm text-gray-700">
                          <li>1. Open WhatsApp on your phone</li>
                          <li>2. Go to Settings → Linked Devices</li>
                          <li>3. Tap "Link with phone number"</li>
                          <li>4. Enter this code</li>
                        </ol>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-center gap-2 text-purple-600 mb-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Waiting for connection...</span>
                      </div>

                      {/* Demo button - remove in production */}
                      <button
                        onClick={handleSimulateSuccess}
                        className="text-xs text-gray-400 hover:text-gray-600 mb-4"
                      >
                        [Demo: Simulate Success]
                      </button>

                      <button onClick={onClose} className="block w-full text-gray-600 hover:text-gray-900">
                        Close
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
