"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Zap,
  MessageSquare,
  Users,
  TrendingUp,
  Star,
  ChevronDown,
  MessageCircle,
  ZapIcon,
  Briefcase,
  ShoppingCart,
  BarChart3,
  Lock,
  Shield,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const [expandedFaq, setExpandedFaq] = useState(0)

  const faqs = [
    {
      question: "Do I need to know how to code?",
      answer:
        "No! FlowAI is built for non-technical users. You can set up AI agents using our visual interface without any coding knowledge.",
    },
    {
      question: "How do credits work?",
      answer:
        "Credits are consumed based on the number of messages processed and agent interactions. Each plan comes with a monthly credit allowance.",
    },
    {
      question: "Can I integrate FlowAI with my existing tools?",
      answer:
        "Yes! FlowAI integrates with popular tools like Zapier, Make, and major CRMs. We also support custom webhooks for advanced integrations.",
    },
    {
      question: "What happens if I run out of credits?",
      answer:
        "You can purchase additional credits anytime, or upgrade to a higher tier plan. We'll notify you before you run out.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. We use enterprise-grade encryption, SOC 2 compliance, and never share your data with third parties.",
    },
    {
      question: "Can I cancel my subscription?",
      answer:
        "Yes, you can cancel anytime with no penalties. We believe in making it easy for customers to manage their accounts.",
    },
    {
      question: "What kind of support do you offer?",
      answer:
        "We offer email support for all plans, chat support for Pro users, and dedicated support managers for Enterprise customers.",
    },
    {
      question: "How long does setup take?",
      answer:
        "Most users are up and running in 5 minutes! We have step-by-step guides and templates to speed up the process.",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "CEO, TechStart Inc",
      avatar: "SJ",
      rating: 5,
      text: "FlowAI reduced our support tickets by 75% while improving customer satisfaction. The setup was incredibly easy. Within 5 minutes, our AI agents were booking meetings and qualifying leads.",
    },
    {
      name: "Michael Chen",
      title: "Marketing Director, Digital Agency",
      avatar: "MC",
      rating: 5,
      text: "Our customer satisfaction scores went from 78% to 95% after implementing FlowAI. The 24/7 support coverage is a huge competitive advantage.",
    },
    {
      name: "Emma Rodriguez",
      title: "Operations Manager, Local Services",
      avatar: "ER",
      rating: 5,
      text: "The automation saved us countless hours. We can now focus on strategic work while AI handles the repetitive tasks perfectly.",
    },
    {
      name: "David Kim",
      title: "Founder, E-commerce Plus",
      avatar: "DK",
      rating: 5,
      text: "Setting up was incredibly easy. Within 5 minutes, our AI sales agent was booking meetings and qualifying leads. Game changer for our business.",
    },
    {
      name: "Lisa Anderson",
      title: "Customer Success Lead, Tech Company",
      avatar: "LA",
      rating: 5,
      text: "Our customer satisfaction scores went from 78% to 95% after implementing FlowAI. The 24/7 support coverage is a huge competitive advantage.",
    },
    {
      name: "James Wilson",
      title: "Small Business Owner, Local Services",
      avatar: "JW",
      rating: 5,
      text: "As a small business, I can't afford a full team. FlowAI gives me the capabilities of a 10 person team at a fraction of the cost. Absolutely worth it!",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 leading-[1.45rem]">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">FlowAI</span>
            </Link>

            {/* Center Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Testimonials
              </a>
              <a href="#faqs" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                FAQs
              </a>
            </div>

            {/* Right Side Auth */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/login")}
                className="text-gray-700 hover:text-gray-900 font-medium text-sm cursor-pointer"
              >
                Sign In
              </button>
              <Link
                href="/signup"
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-indigo-700 transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50/30 to-white overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full filter blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full filter blur-3xl -z-10"></div>

        <div className="max-w-6xl mx-auto relative">
          {/* Trust Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 px-4 py-2 rounded-full border border-purple-200">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">10.000 users are active   </span>
            </div>
          </div>

          {/* Decorative avatars positioned around */}
          
          
          
          

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center mb-6 leading-tight text-balance">
            {/* Updated heading with gradient text */}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Automate Everything
            </span>
            <br />
            <span className="text-gray-900">Without Code</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto text-pretty">
            Deploy AI agents for customer support, sales, and marketing. Automate 40+ hours of work per week, instantly.
          </p>

          {/* CTA Buttons */}
          {/* Updated buttons with smooth gradient styling */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="border-2 border-gray-300 text-gray-900 px-8 py-3.5 rounded-full font-semibold hover:border-purple-400 hover:text-purple-600 transition-all duration-300">
              Watch Demo
            </button>
          </div>

          {/* Sub-text with benefits */}
          <div className="text-center mb-16">
            <p className="text-sm text-gray-600">✓ 400 free credits / No credit card required / Setup in 5 minutes</p>
          </div>

          {/* Dashboard Preview (Placeholder) */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl aspect-video mb-8 border border-purple-200 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-500">Dashboard Preview</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "4.9/5", value: "2,500+ reviews" },
              { label: "10,000+", value: "Active users" },
              { label: "40+ hrs", value: "Saved/week" },
              { label: "99.9%", value: "Uptime SLA" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {stat.label}
                </div>
                <p className="text-sm text-gray-600">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for Every Business Need</h2>
            <p className="text-lg text-gray-600">See how FlowAI transforms different departments</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageCircle,
                title: "Customer Support Automation",
                desc: "Handle 1,000+ support tickets monthly with AI agents that understand context and provide instant, accurate responses 24/7.",
                benefits: ["70% support costs", "95% satisfaction", "24/7 coverage"],
              },
              {
                icon: TrendingUp,
                title: "Sales & Lead Generation",
                desc: "AI agents qualify leads, book meetings, and nurture prospects automatically through calls, emails, and chats.",
                benefits: ["200% qualified leads", "50% response time", "3x more meetings"],
              },
              {
                icon: Zap,
                title: "Marketing Automation",
                desc: "Auto-create and post social content, generate ads, manage campaigns, and optimize SEO across all channels.",
                benefits: ["80% time saved", "100% engagement", "10x more content"],
              },
              {
                icon: Briefcase,
                title: "HR & Recruiting",
                desc: "Screen candidates, schedule interviews, onboard employees, and manage HR tasks with intelligent automation.",
                benefits: ["80% screening time", "3x better hires", "60% faster onboarding"],
              },
              {
                icon: ShoppingCart,
                title: "E-commerce Operations",
                desc: "Automate order processing, inventory management, customer communications, and returns processing.",
                benefits: ["45% ops time", "60% cart abandonment", "24/7 shopping support"],
              },
              {
                icon: Lock,
                title: "Internal Operations",
                desc: "Streamline document processing, meeting summaries, expense tracking, invoicing, and internal workflows.",
                benefits: ["42 hours/week", "80% accuracy", "80% productivity"],
              },
            ].map((useCase, i) => {
              const Icon = useCase.icon
              return (
                <div
                  key={i}
                  className="bg-white p-8 rounded-xl border border-gray-200 hover:border-indigo-300 transition"
                >
                  <Icon className="w-8 h-8 text-indigo-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                  <p className="text-gray-600 mb-4">{useCase.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {useCase.benefits.map((benefit, j) => (
                      <span key={j} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Automate</h2>
            <p className="text-lg text-gray-600">Choose from 20+ AI agents and automation tools</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Users,
                title: "AI Agents",
                desc: "Deploy intelligent agents for sales, support, HR, and more. Connect to WhatsApp, Email, Voice, or internal systems.",
              },
              {
                icon: BarChart3,
                title: "Marketing Automation",
                desc: "Auto-post on social media, generate content, create video ads, and manage campaigns—all powered by AI.",
              },
              {
                icon: Briefcase,
                title: "Business Tools",
                desc: "Automate HR, invoicing, document processing, meeting summaries, and internal operations.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="text-center p-8 bg-gray-50 rounded-xl">
                  <Icon className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Core Features */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: Lock,
                label: "No Coding Required",
                desc: "Create powerful automations without technical knowledge",
              },
              { icon: ZapIcon, label: "AI-Powered", desc: "Advanced AI models handle complex tasks automatically" },
              { icon: Shield, label: "Enterprise Security", desc: "Bank-level security for your business data" },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="text-center">
                  <Icon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.label}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600">Join thousands of satisfied businesses</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-gray-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Started in 3 Simple Steps</h2>
            <p className="text-lg text-gray-600">From signup to automation in under 5 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                step: "1",
                title: "Sign Up in 30 Seconds",
                desc: "Create your free account and get 400 credits instantly. No credit card required.",
                time: "30 seconds",
              },
              {
                step: "2",
                title: "Choose Your AI Agents",
                desc: "Select from 20+ pre-built agents or customize them to match your business needs.",
                time: "2 minutes",
              },
              {
                step: "3",
                title: "Launch & Automate",
                desc: "Connect to WhatsApp, Email, Voice, or your systems. Your agents start working immediately.",
                time: "2 minutes",
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white px-3 py-1 rounded-full inline-block mb-4 font-bold text-sm">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.desc}</p>
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <Zap className="w-4 h-4" />
                  <span>{step.time}</span>
                </div>
                {i < 2 && <div className="hidden md:block absolute top-20 -right-4 text-gray-400">→</div>}
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/signup"
              className="bg-indigo-600 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-2"
            >
              Start Your Free Trial Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faqs" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know about FlowAI</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? -1 : i)}
                  className="w-full px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  {faq.question}
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition ${expandedFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedFaq === i && (
                  <div className="px-6 py-4 border-t border-gray-200 text-gray-600 bg-gray-50">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Automate Your Business?</h2>
          <p className="text-xl text-white/90 mb-8">Start with 400 free credits. No credit card required.</p>
          <Link
            href="/signup"
            className="inline-flex bg-white text-indigo-600 px-8 py-3.5 rounded-full font-semibold hover:bg-gray-100 transition items-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full"></div>
                <span className="font-bold text-white">FlowAI</span>
              </div>
              <p className="text-sm">Automate business processes with AI-powered agents. Deploy in 5 minutes.</p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    AI Agents
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 FlowAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
