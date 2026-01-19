"use client"

import type React from "react"
import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  Home,
  ShoppingBag,
  UtensilsCrossed,
  Dumbbell,
  Scissors,
  Car,
  Scale,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Industry {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const industries: Industry[] = [
  {
    id: "dental",
    name: "Dental Clinic",
    description: "Perfect for dentists and orthodontists",
    icon: <Stethoscope className="w-12 h-12 text-purple-600" />,
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Perfect for agents and brokers",
    icon: <Home className="w-12 h-12 text-purple-600" />,
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Perfect for online stores",
    icon: <ShoppingBag className="w-12 h-12 text-purple-600" />,
  },
  {
    id: "restaurant",
    name: "Restaurant & Cafe",
    description: "Perfect for restaurants and cafes",
    icon: <UtensilsCrossed className="w-12 h-12 text-purple-600" />,
  },
  {
    id: "fitness",
    name: "Fitness & Gym",
    description: "Perfect for gyms and studios",
    icon: <Dumbbell className="w-12 h-12 text-purple-600" />,
  },
  {
    id: "beauty",
    name: "Beauty Salon",
    description: "Perfect for salons and spas",
    icon: <Scissors className="w-12 h-12 text-purple-600" />,
  },
  {
    id: "car",
    name: "Car Dealership",
    description: "Perfect for dealers and showrooms",
    icon: <Car className="w-12 h-12 text-purple-600" />,
  },
  {
    id: "legal",
    name: "Legal Services",
    description: "Perfect for lawyers and consultants",
    icon: <Scale className="w-12 h-12 text-purple-600" />,
  },
  {
    id: "custom",
    name: "Custom Business",
    description: "Create from scratch with your own setup",
    icon: <Building2 className="w-12 h-12 text-purple-600" />,
  },
]

interface IndustrySelectionProps {
  onBack: () => void
  onContinue: (industryId: string) => void
}

export function IndustrySelection({ onBack, onContinue }: IndustrySelectionProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <span>WhatsApp Agent</span>
        <span className="mx-2">&gt;</span>
        <span>Create Agent</span>
        <span className="mx-2">&gt;</span>
        <span className="text-purple-600 font-medium">Select Industry</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">What type of business do you have?</h1>
        <p className="text-lg text-gray-600">Choose your industry to get a pre-configured AI agent</p>
      </div>

      {/* Industry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {industries.map((industry) => (
          <button
            key={industry.id}
            onClick={() => setSelectedIndustry(industry.id === selectedIndustry ? null : industry.id)}
            className={`
              flex flex-col items-center justify-center
              bg-white border-2 rounded-xl p-6 h-48
              cursor-pointer shadow-sm
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              ${
                selectedIndustry === industry.id
                  ? "border-purple-600 bg-purple-50 shadow-lg scale-[1.02]"
                  : "border-gray-200 hover:border-purple-500 hover:shadow-lg hover:scale-105"
              }
            `}
          >
            <div className="mb-4">{industry.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{industry.name}</h3>
            <p className="text-sm text-gray-600 text-center">{industry.description}</p>
          </button>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-between items-center mt-12">
        <Button variant="outline" onClick={onBack} className="h-11 px-6 bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={() => selectedIndustry && onContinue(selectedIndustry)}
          disabled={!selectedIndustry}
          className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
