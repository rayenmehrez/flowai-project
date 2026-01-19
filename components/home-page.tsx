"use client"

import { Bot, Zap, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HomePageProps {
  onNavigate: (page: "login" | "register") => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center py-12 md:py-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance">FlowAI</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            SaaS platform to create AI-powered WhatsApp chatbots
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => onNavigate("register")} className="px-8">
              Sign Up
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNavigate("login")} className="px-8">
              Log In
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 md:mt-16">
          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Use Claude 3.5 Sonnet for intelligent and natural responses
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Easy Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Connect WhatsApp in seconds with a simple QR code scan
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Track your conversations and statistics in real-time
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
