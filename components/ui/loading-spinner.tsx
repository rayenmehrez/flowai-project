"use client"

import { Loader2 } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
        <p className="text-sm font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  )
}

export function LoadingSpinnerSmall() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
    </div>
  )
}
