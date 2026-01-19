"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Loader2,
  GripVertical,
  MapPin,
  Building2,
  Clock,
  Phone,
  DollarSign,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Download,
  FlaskConical,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

// Types
interface Service {
  id: string
  name: string
  pricing: {
    type: "fixed" | "range" | "starting_from" | "on_request"
    value?: number
    min?: number
    max?: number
  }
  description?: string
  duration?: string
  enabled: boolean
  order: number
}

interface WorkingHours {
  [day: string]: {
    isOpen: boolean
    shifts: Array<{ from: string; to: string }>
  }
}

export interface BusinessData {
  clinicName: string
  doctorNames: string[]
  address: string
  city: string
  country: string
  googleMapsLink?: string
  workingHours: WorkingHours
  phoneNumber: string
  whatsappNumber?: string
  email?: string
  website?: string
  currency: { code: string; symbol: string }
  services: Service[]
  features: {
    patientCare?: string[]
    technology?: string[]
    specializations?: string[]
    languages?: string[]
  }
  aboutClinic?: string
  yearsOfExperience?: number
  certifications?: string[]
  bookingPolicy?: string
  industryType: string
}

interface BusinessDetailsFormProps {
  industryId: string
  onBack: () => void
  onContinue: (data: BusinessData) => void
}

// Constants
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "TND", symbol: "DT", name: "Tunisian Dinar" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
]

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Bahrain",
  "Bangladesh",
  "Belgium",
  "Brazil",
  "Canada",
  "China",
  "Colombia",
  "Denmark",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kenya",
  "Kuwait",
  "Lebanon",
  "Libya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Syria",
  "Thailand",
  "Tunisia",
  "Turkey",
  "UAE",
  "United Kingdom",
  "United States",
  "Vietnam",
  "Yemen",
]

const DEFAULT_DENTAL_SERVICES: Service[] = [
  {
    id: "1",
    name: "Dental Consultation",
    pricing: { type: "fixed", value: 100 },
    description: "Complete oral examination and treatment planning",
    duration: "30 minutes",
    enabled: true,
    order: 1,
  },
  {
    id: "2",
    name: "Teeth Cleaning & Scaling",
    pricing: { type: "fixed", value: 150 },
    description: "Professional cleaning, scaling, and polishing",
    duration: "45 minutes",
    enabled: true,
    order: 2,
  },
  {
    id: "3",
    name: "Teeth Whitening",
    pricing: { type: "fixed", value: 400 },
    description: "Professional laser teeth whitening treatment",
    duration: "1 hour",
    enabled: true,
    order: 3,
  },
  {
    id: "4",
    name: "Dental Filling",
    pricing: { type: "range", min: 120, max: 250 },
    description: "Composite or amalgam fillings for cavities",
    duration: "30-60 minutes",
    enabled: true,
    order: 4,
  },
  {
    id: "5",
    name: "Root Canal Treatment",
    pricing: { type: "range", min: 500, max: 800 },
    description: "Endodontic treatment to save infected tooth",
    duration: "60-90 minutes",
    enabled: true,
    order: 5,
  },
  {
    id: "6",
    name: "Tooth Extraction",
    pricing: { type: "range", min: 150, max: 300 },
    description: "Simple or surgical tooth extraction",
    duration: "20-45 minutes",
    enabled: true,
    order: 6,
  },
  {
    id: "7",
    name: "Dental Crown",
    pricing: { type: "range", min: 900, max: 1500 },
    description: "Porcelain or ceramic crown restoration",
    duration: "2-3 visits",
    enabled: true,
    order: 7,
  },
  {
    id: "8",
    name: "Dental Bridge",
    pricing: { type: "starting_from", value: 2000 },
    description: "Fixed bridge to replace missing teeth",
    duration: "Multiple visits",
    enabled: true,
    order: 8,
  },
  {
    id: "9",
    name: "Dental Implant",
    pricing: { type: "range", min: 2500, max: 4000 },
    description: "Complete dental implant with crown",
    duration: "3-6 months process",
    enabled: true,
    order: 9,
  },
  {
    id: "10",
    name: "Braces/Orthodontics",
    pricing: { type: "range", min: 3500, max: 6000 },
    description: "Complete orthodontic treatment with braces",
    duration: "18-24 months",
    enabled: true,
    order: 10,
  },
  {
    id: "11",
    name: "Dental Veneers",
    pricing: { type: "fixed", value: 1200 },
    description: "Porcelain veneers for cosmetic enhancement (per tooth)",
    duration: "2-3 visits",
    enabled: true,
    order: 11,
  },
  {
    id: "12",
    name: "Emergency Dental Treatment",
    pricing: { type: "starting_from", value: 200 },
    description: "Urgent care for dental emergencies",
    duration: "Varies",
    enabled: true,
    order: 12,
  },
]

const DEFAULT_WORKING_HOURS: WorkingHours = {
  Monday: { isOpen: true, shifts: [{ from: "09:00", to: "18:00" }] },
  Tuesday: { isOpen: true, shifts: [{ from: "09:00", to: "18:00" }] },
  Wednesday: { isOpen: true, shifts: [{ from: "09:00", to: "18:00" }] },
  Thursday: { isOpen: true, shifts: [{ from: "09:00", to: "18:00" }] },
  Friday: { isOpen: true, shifts: [{ from: "09:00", to: "18:00" }] },
  Saturday: { isOpen: true, shifts: [{ from: "09:00", to: "14:00" }] },
  Sunday: { isOpen: false, shifts: [{ from: "09:00", to: "18:00" }] },
}

const PATIENT_CARE_OPTIONS = [
  "Emergency appointments available",
  "Children's dentistry (ages 5+)",
  "Senior care",
  "Sedation dentistry",
  "Same-day appointments",
]

const TECHNOLOGY_OPTIONS = [
  "Digital X-rays",
  "3D imaging",
  "Laser dentistry",
  "Same-day crowns",
  "Latest dental technology",
]

const SPECIALIZATION_OPTIONS = [
  "Cosmetic dentistry",
  "Orthodontics",
  "Periodontics",
  "Endodontics",
  "Oral surgery",
  "Implantology",
]

const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Arabic", "Chinese", "German", "Portuguese", "Hindi"]

const industryNames: Record<string, string> = {
  dental_clinic: "Dental Clinic",
  dental: "Dental Clinic",
  "real-estate": "Real Estate",
  ecommerce: "E-commerce",
  restaurant: "Restaurant & Cafe",
  fitness: "Fitness & Gym",
  beauty: "Beauty Salon",
  car: "Car Dealership",
  legal: "Legal Services",
  custom: "Custom Business",
}

const MOCK_DATA = {
  clinicName: "Bright Smile Dental Clinic",
  doctorNames: ["Dr. Sarah Johnson", "Dr. Michael Chen"],
  address: "245 Medical Plaza, Suite 320\nNorth Tower, Healthcare District",
  city: "New York",
  country: "United States",
  googleMapsLink: "https://maps.google.com/?q=40.7580,-73.9855",
  phoneNumber: "+1 (555) 123-4567",
  email: "contact@brightsmiledental.com",
  website: "https://www.brightsmiledental.com",
  aboutClinic:
    "Bright Smile Dental Clinic has been serving the New York community for over 15 years. Our team of experienced dentists is committed to providing exceptional dental care in a comfortable, state-of-the-art facility. We pride ourselves on using the latest technology and techniques to ensure the best outcomes for our patients.",
  yearsOfExperience: "15",
  certifications: [
    "American Board of Cosmetic Dentistry Certification",
    "Advanced Implantology Certificate - NYU College of Dentistry",
    "Invisalign Certified Provider",
  ],
  bookingPolicy:
    "Please arrive 10 minutes before your appointment. Cancellations must be made at least 24 hours in advance. Late arrivals may need to be rescheduled.",
  patientCare: [
    "Emergency appointments available",
    "Children's dentistry (ages 5+)",
    "Sedation dentistry",
    "Same-day appointments",
  ],
  technology: ["Digital X-rays", "3D imaging", "Same-day crowns", "Latest dental technology"],
  specializations: ["Cosmetic dentistry", "Orthodontics", "Periodontics", "Oral surgery", "Implantology"],
  languages: ["English", "Spanish"],
}

export function BusinessDetailsForm({ industryId, onBack, onContinue }: BusinessDetailsFormProps) {
  const [clinicName, setClinicName] = useState(MOCK_DATA.clinicName)
  const [doctorNames, setDoctorNames] = useState<string[]>(MOCK_DATA.doctorNames)
  const [address, setAddress] = useState(MOCK_DATA.address)
  const [city, setCity] = useState(MOCK_DATA.city)
  const [country, setCountry] = useState(MOCK_DATA.country)
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [googleMapsLink, setGoogleMapsLink] = useState(MOCK_DATA.googleMapsLink)

  // Working Hours
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS)

  const [phoneNumber, setPhoneNumber] = useState(MOCK_DATA.phoneNumber)
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [email, setEmail] = useState(MOCK_DATA.email)
  const [website, setWebsite] = useState(MOCK_DATA.website)

  // Services & Pricing
  const [currency, setCurrency] = useState(CURRENCIES[0])
  const [currencySearch, setCurrencySearch] = useState("")
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
  const [services, setServices] = useState<Service[]>(DEFAULT_DENTAL_SERVICES)
  const [showServicesTemplate, setShowServicesTemplate] = useState(false) // False since we have mock data

  const [featuresExpanded, setFeaturesExpanded] = useState(false)
  const [patientCare, setPatientCare] = useState<string[]>(MOCK_DATA.patientCare)
  const [technology, setTechnology] = useState<string[]>(MOCK_DATA.technology)
  const [specializations, setSpecializations] = useState<string[]>(MOCK_DATA.specializations)
  const [languages, setLanguages] = useState<string[]>(MOCK_DATA.languages)
  const [otherLanguage, setOtherLanguage] = useState("")

  const [additionalExpanded, setAdditionalExpanded] = useState(false)
  const [aboutClinic, setAboutClinic] = useState(MOCK_DATA.aboutClinic)
  const [yearsOfExperience, setYearsOfExperience] = useState(MOCK_DATA.yearsOfExperience)
  const [certifications, setCertifications] = useState<string[]>(MOCK_DATA.certifications)
  const [bookingPolicy, setBookingPolicy] = useState(MOCK_DATA.bookingPolicy)

  // Form state
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [showMockDataBanner, setShowMockDataBanner] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showLoadServicesConfirm, setShowLoadServicesConfirm] = useState(false)

  // Add Service Modal
  const [showAddServiceModal, setShowAddServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [newServiceName, setNewServiceName] = useState("")
  const [newServicePricingType, setNewServicePricingType] = useState<Service["pricing"]["type"]>("fixed")
  const [newServicePrice, setNewServicePrice] = useState("")
  const [newServiceMin, setNewServiceMin] = useState("")
  const [newServiceMax, setNewServiceMax] = useState("")
  const [newServiceDescription, setNewServiceDescription] = useState("")
  const [newServiceDuration, setNewServiceDuration] = useState("")

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [clinicName, address, doctorNames, city, country, services, phoneNumber, email])

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clinicName || address) {
        handleAutoSave()
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [clinicName, address, doctorNames, city, country, services])

  const handleAutoSave = useCallback(() => {
    const data = {
      clinicName,
      doctorNames,
      address,
      city,
      country,
      googleMapsLink,
      workingHours,
      phoneNumber,
      whatsappNumber: whatsappSameAsPhone ? phoneNumber : whatsappNumber,
      email,
      website,
      currency,
      services,
      features: { patientCare, technology, specializations, languages },
      aboutClinic,
      yearsOfExperience: yearsOfExperience ? Number.parseInt(yearsOfExperience) : undefined,
      certifications,
      bookingPolicy,
    }
    localStorage.setItem("dental_clinic_draft", JSON.stringify(data))
    setLastSaved(new Date())
    setHasChanges(false)
  }, [
    clinicName,
    doctorNames,
    address,
    city,
    country,
    googleMapsLink,
    workingHours,
    phoneNumber,
    whatsappSameAsPhone,
    whatsappNumber,
    email,
    website,
    currency,
    services,
    patientCare,
    technology,
    specializations,
    languages,
    aboutClinic,
    yearsOfExperience,
    certifications,
    bookingPolicy,
  ])

  const handleClearAllData = () => {
    setClinicName("")
    setDoctorNames([""])
    setAddress("")
    setCity("")
    setCountry("")
    setGoogleMapsLink("")
    setWorkingHours(DEFAULT_WORKING_HOURS)
    setPhoneNumber("")
    setWhatsappSameAsPhone(true)
    setWhatsappNumber("")
    setEmail("")
    setWebsite("")
    setCurrency(CURRENCIES[0])
    setServices([])
    setPatientCare([])
    setTechnology([])
    setSpecializations([])
    setLanguages(["English"])
    setAboutClinic("")
    setYearsOfExperience("")
    setCertifications([])
    setBookingPolicy("")
    setShowClearConfirm(false)
    setShowMockDataBanner(false)
  }

  const handleLoadSampleServices = () => {
    if (services.length > 0) {
      setShowLoadServicesConfirm(true)
    } else {
      setServices(DEFAULT_DENTAL_SERVICES)
    }
  }

  const confirmLoadServices = () => {
    setServices(DEFAULT_DENTAL_SERVICES)
    setShowLoadServicesConfirm(false)
  }

  // Doctor names handlers
  const handleAddDoctor = () => setDoctorNames([...doctorNames, ""])
  const handleRemoveDoctor = (index: number) => {
    if (doctorNames.length > 1) {
      setDoctorNames(doctorNames.filter((_, i) => i !== index))
    }
  }
  const handleDoctorChange = (index: number, value: string) => {
    const newNames = [...doctorNames]
    newNames[index] = value
    setDoctorNames(newNames)
  }

  // Working hours handlers
  const handleDayToggle = (day: string) => {
    setWorkingHours({
      ...workingHours,
      [day]: { ...workingHours[day], isOpen: !workingHours[day].isOpen },
    })
  }

  const handleTimeChange = (day: string, shiftIndex: number, field: "from" | "to", value: string) => {
    const newHours = { ...workingHours }
    newHours[day].shifts[shiftIndex][field] = value
    setWorkingHours(newHours)
  }

  const handleCopyToWeekdays = () => {
    const mondayShifts = workingHours.Monday.shifts
    const newHours = { ...workingHours }
    ;["Tuesday", "Wednesday", "Thursday", "Friday"].forEach((day) => {
      newHours[day] = { isOpen: true, shifts: [...mondayShifts] }
    })
    setWorkingHours(newHours)
  }

  const handleResetHours = () => setWorkingHours(DEFAULT_WORKING_HOURS)

  // Service handlers
  const handleServiceToggle = (serviceId: string) => {
    setServices(services.map((s) => (s.id === serviceId ? { ...s, enabled: !s.enabled } : s)))
  }

  const handleDeleteService = (serviceId: string) => {
    setServices(services.filter((s) => s.id !== serviceId))
  }

  const handleOpenAddService = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setNewServiceName(service.name)
      setNewServicePricingType(service.pricing.type)
      setNewServicePrice(service.pricing.value?.toString() || "")
      setNewServiceMin(service.pricing.min?.toString() || "")
      setNewServiceMax(service.pricing.max?.toString() || "")
      setNewServiceDescription(service.description || "")
      setNewServiceDuration(service.duration || "")
    } else {
      setEditingService(null)
      setNewServiceName("")
      setNewServicePricingType("fixed")
      setNewServicePrice("")
      setNewServiceMin("")
      setNewServiceMax("")
      setNewServiceDescription("")
      setNewServiceDuration("")
    }
    setShowAddServiceModal(true)
  }

  const handleSaveService = () => {
    if (!newServiceName.trim()) return

    const pricing: Service["pricing"] = { type: newServicePricingType }
    if (newServicePricingType === "fixed" || newServicePricingType === "starting_from") {
      pricing.value = Number.parseFloat(newServicePrice) || 0
    } else if (newServicePricingType === "range") {
      pricing.min = Number.parseFloat(newServiceMin) || 0
      pricing.max = Number.parseFloat(newServiceMax) || 0
    }

    if (editingService) {
      setServices(
        services.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                name: newServiceName,
                pricing,
                description: newServiceDescription,
                duration: newServiceDuration,
              }
            : s,
        ),
      )
    } else {
      const newService: Service = {
        id: Date.now().toString(),
        name: newServiceName,
        pricing,
        description: newServiceDescription,
        duration: newServiceDuration,
        enabled: true,
        order: services.length + 1,
      }
      setServices([...services, newService])
    }
    setShowAddServiceModal(false)
  }

  const handleLoadTemplate = () => {
    setServices(DEFAULT_DENTAL_SERVICES)
    setShowServicesTemplate(false)
  }

  const handleStartFromScratch = () => {
    setServices([])
    setShowServicesTemplate(false)
  }

  // Feature handlers
  const toggleFeature = (feature: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(feature)) {
      setList(list.filter((f) => f !== feature))
    } else {
      setList([...list, feature])
    }
  }

  // Certification handlers
  const handleAddCertification = () => setCertifications([...certifications, ""])
  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }
  const handleCertificationChange = (index: number, value: string) => {
    const newCerts = [...certifications]
    newCerts[index] = value
    setCertifications(newCerts)
  }

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!clinicName.trim()) newErrors.clinicName = "Clinic name is required"
    if (!doctorNames.some((n) => n.trim())) newErrors.doctorNames = "At least one doctor name is required"
    if (!address.trim()) newErrors.address = "Address is required"
    if (!city.trim()) newErrors.city = "City is required"
    if (!country.trim()) newErrors.country = "Country is required"
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const handleSaveDraft = async () => {
    setIsSaving(true)
    handleAutoSave()
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSaving(false)
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const data: BusinessData = {
      clinicName,
      doctorNames: doctorNames.filter((n) => n.trim()),
      address,
      city,
      country,
      googleMapsLink: googleMapsLink || undefined,
      workingHours,
      phoneNumber,
      whatsappNumber: whatsappSameAsPhone ? phoneNumber : whatsappNumber,
      email: email || undefined,
      website: website || undefined,
      currency,
      services: services.filter((s) => s.enabled),
      features: {
        patientCare: patientCare.length > 0 ? patientCare : undefined,
        technology: technology.length > 0 ? technology : undefined,
        specializations: specializations.length > 0 ? specializations : undefined,
        languages: languages.length > 0 ? languages : undefined,
      },
      aboutClinic: aboutClinic || undefined,
      yearsOfExperience: yearsOfExperience ? Number.parseInt(yearsOfExperience) : undefined,
      certifications:
        certifications.filter((c) => c.trim()).length > 0 ? certifications.filter((c) => c.trim()) : undefined,
      bookingPolicy: bookingPolicy || undefined,
      industryType: industryId,
    }
    onContinue(data)
  }

  const formatPrice = (pricing: Service["pricing"]) => {
    const sym = currency.symbol
    switch (pricing.type) {
      case "fixed":
        return `${sym}${pricing.value}`
      case "range":
        return `${sym}${pricing.min} - ${sym}${pricing.max}`
      case "starting_from":
        return `${sym}${pricing.value}+`
      case "on_request":
        return "Contact for pricing"
      default:
        return ""
    }
  }

  const filteredCountries = COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(currencySearch.toLowerCase()),
  )

  const isFormValid =
    clinicName.trim() &&
    doctorNames.some((n) => n.trim()) &&
    address.trim() &&
    city.trim() &&
    country.trim() &&
    phoneNumber.trim()

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <span>WhatsApp Agent</span>
        <span className="mx-2">&gt;</span>
        <span>Create Agent</span>
        <span className="mx-2">&gt;</span>
        <span className="text-purple-600 font-medium">Business Details</span>
      </nav>

      {/* Header with Clear Button */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Set up your {industryNames[industryId] || "Dental Clinic"} AI Agent
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mt-2">
              Configure your clinic details and services. You can customize everything.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
          onClick={() => setShowClearConfirm(true)}
        >
          <X className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {showMockDataBanner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700 text-sm font-medium">Using sample data for testing - edit as needed</span>
          </div>
          <button onClick={() => setShowMockDataBanner(false)} className="text-blue-600 hover:text-blue-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700 text-sm">You have unsaved changes</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Step 2 of 4</span>
          <span className="text-sm text-gray-500">50% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full" style={{ width: "50%" }} />
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 space-y-12">
        {/* SECTION 1: Basic Information */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clinic Name */}
            <div className="md:col-span-2">
              <Label htmlFor="clinicName" className="text-sm font-medium text-gray-700 mb-2 block">
                Clinic Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Enter clinic name"
                className={errors.clinicName ? "border-red-500" : ""}
              />
              {errors.clinicName && <p className="text-red-500 text-xs mt-1">{errors.clinicName}</p>}
            </div>

            {/* Doctor Names */}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Doctor Name(s) <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {doctorNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => handleDoctorChange(index, e.target.value)}
                      placeholder={`Doctor ${index + 1}`}
                    />
                    {doctorNames.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveDoctor(index)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddDoctor} className="mt-2 bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Doctor
                </Button>
              </div>
              {errors.doctorNames && <p className="text-red-500 text-xs mt-1">{errors.doctorNames}</p>}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-2 block">
                Location / Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter full address"
                rows={3}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* City */}
            <div>
              <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
                City / Region <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
                className={errors.city ? "border-red-500" : ""}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Country */}
            <div className="relative">
              <Label htmlFor="country" className="text-sm font-medium text-gray-700 mb-2 block">
                Country <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value)
                    setCountrySearch(e.target.value)
                    setShowCountryDropdown(true)
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  placeholder="Search country..."
                  className={errors.country ? "border-red-500" : ""}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {showCountryDropdown && filteredCountries.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredCountries.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      onClick={() => {
                        setCountry(c)
                        setCountrySearch("")
                        setShowCountryDropdown(false)
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>

            {/* Google Maps Link */}
            <div className="md:col-span-2">
              <Label htmlFor="googleMaps" className="text-sm font-medium text-gray-700 mb-2 block">
                Google Maps Link <span className="text-gray-400">(Optional)</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="googleMaps"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Working Hours */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Working Hours</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyToWeekdays}>
                Copy to Weekdays
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetHours}>
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {DAYS.map((day) => (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 min-w-[140px]">
                  <Switch checked={workingHours[day].isOpen} onCheckedChange={() => handleDayToggle(day)} />
                  <span className="font-medium text-gray-700">{day}</span>
                </div>
                {workingHours[day].isOpen ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      type="time"
                      value={workingHours[day].shifts[0]?.from || "09:00"}
                      onChange={(e) => handleTimeChange(day, 0, "from", e.target.value)}
                      className="w-[120px]"
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                      type="time"
                      value={workingHours[day].shifts[0]?.to || "18:00"}
                      onChange={(e) => handleTimeChange(day, 0, "to", e.target.value)}
                      className="w-[120px]"
                    />
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">Closed</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: Contact Information */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Phone className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Number */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={errors.phoneNumber ? "border-red-500" : ""}
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* WhatsApp Number */}
            <div>
              <Label htmlFor="whatsapp" className="text-sm font-medium text-gray-700 mb-2 block">
                WhatsApp Number
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sameAsPhone"
                    checked={whatsappSameAsPhone}
                    onCheckedChange={(checked) => setWhatsappSameAsPhone(checked as boolean)}
                  />
                  <label htmlFor="sameAsPhone" className="text-sm text-gray-600">
                    Same as phone number
                  </label>
                </div>
                {!whatsappSameAsPhone && (
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                )}
                {whatsappSameAsPhone && <Input value={phoneNumber} disabled className="bg-gray-100" />}
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website" className="text-sm font-medium text-gray-700 mb-2 block">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: Services & Pricing */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Services & Pricing</h2>
            </div>
            <Button variant="outline" size="sm" onClick={handleLoadSampleServices}>
              <Download className="w-4 h-4 mr-2" />
              Load Sample Services
            </Button>
          </div>

          {/* Currency Selector */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Currency</Label>
            <div className="relative w-full max-w-xs">
              <button
                type="button"
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="w-full px-4 py-2 border rounded-lg text-left flex items-center justify-between bg-white"
              >
                <span>
                  {currency.code} - {currency.name} ({currency.symbol})
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showCurrencyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  <div className="p-2 sticky top-0 bg-white border-b">
                    <Input
                      placeholder="Search currency..."
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  {filteredCurrencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      onClick={() => {
                        setCurrency(c)
                        setCurrencySearch("")
                        setShowCurrencyDropdown(false)
                      }}
                    >
                      {c.code} - {c.name} ({c.symbol})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Services List */}
          {showServicesTemplate ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h3 className="font-medium text-gray-900 mb-2">Start with a template or from scratch?</h3>
              <p className="text-gray-600 text-sm mb-4">
                We have pre-configured services for dental clinics that you can customize.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleLoadTemplate}>Use Dental Template</Button>
                <Button variant="outline" onClick={handleStartFromScratch}>
                  Start from Scratch
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">No services added yet</p>
                  <Button variant="outline" onClick={() => handleOpenAddService()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Service
                  </Button>
                </div>
              ) : (
                <>
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                        service.enabled ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 cursor-move flex-shrink-0" />
                      <Checkbox checked={service.enabled} onCheckedChange={() => handleServiceToggle(service.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{service.name}</span>
                        </div>
                        {service.description && <p className="text-xs text-gray-500 truncate">{service.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-purple-600">{formatPrice(service.pricing)}</span>
                        {service.duration && <p className="text-xs text-gray-400">{service.duration}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenAddService(service)}>
                          <Info className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => handleOpenAddService()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </>
              )}
            </div>
          )}
        </section>

        {/* SECTION 5: Special Features */}
        <section>
          <button
            type="button"
            onClick={() => setFeaturesExpanded(!featuresExpanded)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Special Features</h2>
              <span className="text-sm text-gray-500">(Optional)</span>
            </div>
            {featuresExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {featuresExpanded && (
            <div className="mt-6 space-y-8">
              {/* Patient Care */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Patient Care</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PATIENT_CARE_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={patientCare.includes(option)}
                        onCheckedChange={() => toggleFeature(option, patientCare, setPatientCare)}
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Technology */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Technology & Equipment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TECHNOLOGY_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={technology.includes(option)}
                        onCheckedChange={() => toggleFeature(option, technology, setTechnology)}
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specializations */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Specializations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SPECIALIZATION_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={specializations.includes(option)}
                        onCheckedChange={() => toggleFeature(option, specializations, setSpecializations)}
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Languages Spoken</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={languages.includes(option)}
                        onCheckedChange={() => toggleFeature(option, languages, setLanguages)}
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 6: Additional Information */}
        <section>
          <button
            type="button"
            onClick={() => setAdditionalExpanded(!additionalExpanded)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
              <span className="text-sm text-gray-500">(Optional)</span>
            </div>
            {additionalExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {additionalExpanded && (
            <div className="mt-6 space-y-6">
              {/* About Clinic */}
              <div>
                <Label htmlFor="about" className="text-sm font-medium text-gray-700 mb-2 block">
                  About Your Clinic
                </Label>
                <Textarea
                  id="about"
                  value={aboutClinic}
                  onChange={(e) => setAboutClinic(e.target.value)}
                  placeholder="Tell us about your clinic..."
                  rows={4}
                />
              </div>

              {/* Years of Experience */}
              <div className="max-w-xs">
                <Label htmlFor="experience" className="text-sm font-medium text-gray-700 mb-2 block">
                  Years of Experience
                </Label>
                <Input
                  id="experience"
                  type="number"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  placeholder="15"
                  min="0"
                />
              </div>

              {/* Certifications */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Certifications</Label>
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={cert}
                        onChange={(e) => handleCertificationChange(index, e.target.value)}
                        placeholder="Certification name"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveCertification(index)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddCertification}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
              </div>

              {/* Booking Policy */}
              <div>
                <Label htmlFor="policy" className="text-sm font-medium text-gray-700 mb-2 block">
                  Booking Policy
                </Label>
                <Textarea
                  id="policy"
                  value={bookingPolicy}
                  onChange={(e) => setBookingPolicy(e.target.value)}
                  placeholder="Enter your booking policy..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t mt-8 p-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {lastSaved && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Draft saved {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onBack} className="flex-1 sm:flex-none bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex-1 sm:flex-none bg-transparent"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700"
            >
              Preview AI
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingService ? "Edit Service" : "Add Service"}
                </h3>
                <button onClick={() => setShowAddServiceModal(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Service Name</Label>
                  <Input
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g., Dental Cleaning"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Pricing Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "fixed", label: "Fixed Price" },
                      { value: "range", label: "Price Range" },
                      { value: "starting_from", label: "Starting From" },
                      { value: "on_request", label: "On Request" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewServicePricingType(type.value as Service["pricing"]["type"])}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          newServicePricingType === type.value
                            ? "border-purple-600 bg-purple-50 text-purple-600"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(newServicePricingType === "fixed" || newServicePricingType === "starting_from") && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Price ({currency.symbol})</Label>
                    <Input
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                )}

                {newServicePricingType === "range" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Min ({currency.symbol})</Label>
                      <Input
                        type="number"
                        value={newServiceMin}
                        onChange={(e) => setNewServiceMin(e.target.value)}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Max ({currency.symbol})</Label>
                      <Input
                        type="number"
                        value={newServiceMax}
                        onChange={(e) => setNewServiceMax(e.target.value)}
                        placeholder="200"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Description</Label>
                  <Textarea
                    value={newServiceDescription}
                    onChange={(e) => setNewServiceDescription(e.target.value)}
                    placeholder="Brief description of the service..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Duration</Label>
                  <Input
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    placeholder="e.g., 30 minutes"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddServiceModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveService}
                  disabled={!newServiceName.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {editingService ? "Save Changes" : "Add Service"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Clear All Data?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">This will clear all form data. This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleClearAllData} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLoadServicesConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Replace Services?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              This will replace existing services with sample dental services. Continue?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowLoadServicesConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmLoadServices} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Replace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
