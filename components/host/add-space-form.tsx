// components/host/add-space-form.tsx
"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/contexts/firebase-context"
import { createParkingSpace } from "@/lib/firebase/host"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { ParkingSpace } from "@/lib/types/parking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Upload, X, Calendar, MapPin, AlertCircle } from "lucide-react"

export function AddSpaceForm() {
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]) // ✅ Store File[]
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: -1.286389, lng: 36.817223 })
  const [availabilityRanges, setAvailabilityRanges] = useState<{ startDate: string; endDate: string }[]>([
    { startDate: "", endDate: "" },
  ])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    pricePerHour: "",
    pricePerDay: "",
    pricePerMonth: "",
    spaceType: "driveway" as const,
    features: [] as string[],
    vehicleTypes: [] as string[],
    totalSpots: "1",
    mpesaPaymentMethod: "" as "" | "send_money" | "paybill" | "buy_goods" | "pochi_la_biashara",
    mpesaAccountDetails: "",
  })
  
  const [spotLabels, setSpotLabels] = useState<string[]>(["1"])

  const { user, userProfile } = useAuth()
  const { db, storage } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_IMAGES = 5
  const MIN_IMAGES = 1
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const availableFeatures = [
    "Covered",
    "24/7 Access",
    "Security Camera",
    "EV Charging",
    "Well-lit",
    "Close to Transit",
    "Valet Service",
  ]

  const vehicleTypeOptions = ["sedan", "suv", "truck", "motorcycle", "van"]

  // ✅ UPDATED: Handle image upload with limits and validation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (selectedFiles.length + files.length > MAX_IMAGES) {
      toast({
        title: "Image Limit Exceeded",
        description: `You can only upload up to ${MAX_IMAGES} images. Currently have ${selectedFiles.length}.`,
        variant: "destructive",
      })
      return
    }

    const validFiles: File[] = []
    const validPreviews: string[] = []

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        })
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        validPreviews.push(reader.result as string)
        validFiles.push(file)
        
        if (validFiles.length === files.length) {
          setSelectedFiles(prev => [...prev, ...validFiles])
          setImagePreviews(prev => [...prev, ...validPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const addAvailabilityRange = () => {
    setAvailabilityRanges([...availabilityRanges, { startDate: "", endDate: "" }])
  }

  const removeAvailabilityRange = (index: number) => {
    setAvailabilityRanges(availabilityRanges.filter((_, i) => i !== index))
  }

  const updateAvailabilityRange = (index: number, field: "startDate" | "endDate", value: string) => {
    const updated = [...availabilityRanges]
    updated[index][field] = value
    setAvailabilityRanges(updated)
  }

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const handleVehicleTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter((t) => t !== type)
        : [...prev.vehicleTypes, type],
    }))
  }
  
  // Handle total spots change
  const handleSpotsChange = (value: string) => {
    const numSpots = parseInt(value) || 1
    setFormData((prev) => ({ ...prev, totalSpots: value }))
    
    // Update spot labels array
    const currentLabels = [...spotLabels]
    if (numSpots > currentLabels.length) {
      // Add more spots
      for (let i = currentLabels.length; i < numSpots; i++) {
        currentLabels.push(`${i + 1}`)
      }
    } else if (numSpots < currentLabels.length) {
      // Remove excess spots
      currentLabels.splice(numSpots)
    }
    setSpotLabels(currentLabels)
  }
  
  // Update individual spot label
  const updateSpotLabel = (index: number, value: string) => {
    const updated = [...spotLabels]
    updated[index] = value.toUpperCase()
    setSpotLabels(updated)
  }

  // ✅ GEOLOCATION - Get user's location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Please enter address manually",
        variant: "destructive",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        toast({
          title: "Location detected",
          description: "Using your current location",
        })
      },
      (error) => {
        console.warn("Geolocation error:", error)
        toast({
          title: "Location access denied",
          description: "Please enter address manually",
        })
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!user || !userProfile || !db || !storage) {
      toast({
        title: "Error",
        description: "Please log in and wait for profile to load",
        variant: "destructive",
      })
      return
    }

    if (selectedFiles.length < MIN_IMAGES) {
      toast({
        title: "Images Required",
        description: "Please upload at least 1 image of your parking space",
        variant: "destructive",
      })
      return
    }

    if (!formData.title || !formData.description || !formData.address || !formData.pricePerHour || 
        formData.vehicleTypes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and select at least one vehicle type",
        variant: "destructive",
      })
      return
    }

    if (!formData.mpesaPaymentMethod || !formData.mpesaAccountDetails) {
      toast({
        title: "Payment Details Required",
        description: "Please configure your M-Pesa payment details",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log('[v0] Form validation passed, submitting...')
      
      const availableDates = availabilityRanges
        .filter((range) => range.startDate && range.endDate)
        .map((range) => ({
          startDate: new Date(range.startDate),
          endDate: new Date(range.endDate),
        }))

      // Create spots array with labels
      const spots = spotLabels.map(label => ({
        label: label,
        isAvailable: true,
        // Don't include undefined values - Firestore doesn't allow them
        // These fields will be added when a booking is made
      }))

      const baseData = {
        hostId: user.uid,
        hostName: userProfile.displayName || user.email?.split('@')[0] || 'Host',
        title: formData.title,
        description: formData.description,
        address: formData.address,
        location, // ✅ Use detected location
        pricePerHour: Number.parseFloat(formData.pricePerHour),
        availability: "available" as const,
        features: formData.features,
        images: selectedFiles, // ✅ Pass File[]
        rating: 0,
        reviewCount: 0,
        spaceType: formData.spaceType,
        vehicleTypes: formData.vehicleTypes,
        totalSpots: Number.parseInt(formData.totalSpots) || 1,
        spots: spots,
      }

      const optionalFields = {
        ...(userProfile.phoneNumber && { hostPhone: userProfile.phoneNumber }),
        ...(formData.pricePerDay && { pricePerDay: Number.parseFloat(formData.pricePerDay) }),
        ...(formData.pricePerMonth && { pricePerMonth: Number.parseFloat(formData.pricePerMonth) }),
        ...(availableDates.length > 0 && { availableDates }),
        ...(formData.mpesaPaymentMethod && { mpesaPaymentMethod: formData.mpesaPaymentMethod }),
        ...(formData.mpesaAccountDetails && { mpesaAccountDetails: formData.mpesaAccountDetails }),
      }

      const spaceData = { ...baseData, ...optionalFields } as Omit<ParkingSpace, "id" | "createdAt"> & { images: File[] }
      
      console.log('[v0] Creating space with data:', {
        ...spaceData,
        images: spaceData.images.length,
        location: `${spaceData.location.lat}, ${spaceData.location.lng}`,
        hostPhone: 'hostPhone' in spaceData ? 'present' : 'excluded',
      })
      
      const spaceId = await createParkingSpace(db, storage, spaceData)
      
      console.log('[v0] Space created successfully with ID:', spaceId)
      
      toast({
        title: "🎉 Space Added Successfully!",
        description: `Your parking space "${formData.title}" is now live and visible to drivers!`,
      })

      // ✅ CRITICAL: Trigger real-time refresh across all dashboards
      window.dispatchEvent(new CustomEvent('space:created', { 
        detail: { spaceId } 
      }))

      // Reset form
      setFormData({
        title: "",
        description: "",
        address: "",
        pricePerHour: "",
        pricePerDay: "",
        pricePerMonth: "",
        spaceType: "driveway",
        features: [],
        vehicleTypes: [],
        totalSpots: "1",
        mpesaPaymentMethod: "",
        mpesaAccountDetails: "",
      })
      setSpotLabels(["1"])
      setSelectedFiles([])
      setImagePreviews([])
      setAvailabilityRanges([{ startDate: "", endDate: "" }])
      
      // Navigate with Next.js revalidation
      router.push("/host/dashboard")
      router.refresh()
      
    } catch (error: any) {
      console.error('[v0] Error creating parking space:', error)
      toast({
        title: "Failed to Add Space",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Add New Parking Space
          </CardTitle>
          <CardDescription>List your space and start earning with drivers in your area</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Space Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Secure Downtown Garage - Covered Parking"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Space Type *</Label>
              <Select
                value={formData.spaceType}
                onValueChange={(value) => setFormData({ ...formData, spaceType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driveway">Driveway</SelectItem>
                  <SelectItem value="garage">Garage</SelectItem>
                  <SelectItem value="lot">Parking Lot</SelectItem>
                  <SelectItem value="street">Street Parking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your parking space, security features, access details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
              <Button type="button" variant="outline" onClick={getCurrentLocation}>
                📍 Use My Location
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Detected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerHour">Price per Hour (KES) *</Label>
              <Input
                id="pricePerHour"
                type="number"
                step="0.01"
                min="0"
                placeholder="850"
                value={formData.pricePerHour}
                onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerDay">Price per Day (KES)</Label>
              <Input
                id="pricePerDay"
                type="number"
                step="0.01"
                min="0"
                placeholder="4500"
                value={formData.pricePerDay}
                onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerMonth">Price per Month (KES)</Label>
              <Input
                id="pricePerMonth"
                type="number"
                step="0.01"
                min="0"
                placeholder="45000"
                value={formData.pricePerMonth}
                onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
              />
            </div>
          </div>

          {/* Parking Spots Configuration */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="totalSpots">Number of Parking Spots *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                How many individual parking spots are available at this location?
              </p>
              <Input
                id="totalSpots"
                type="number"
                min="1"
                max="50"
                value={formData.totalSpots}
                onChange={(e) => handleSpotsChange(e.target.value)}
                required
                className="max-w-xs"
              />
            </div>

            <div className="space-y-3">
              <Label>Spot Labels</Label>
              <p className="text-xs text-muted-foreground">
                Give each parking spot a unique label (e.g., 1A, 1B, Spot 1, etc.)
              </p>
              <div className="grid md:grid-cols-4 gap-3">
                {spotLabels.map((label, index) => (
                  <div key={index} className="space-y-1">
                    <Label htmlFor={`spot-${index}`} className="text-xs">
                      Spot {index + 1}
                    </Label>
                    <Input
                      id={`spot-${index}`}
                      type="text"
                      value={label}
                      onChange={(e) => updateSpotLabel(index, e.target.value)}
                      placeholder={`Spot ${index + 1}`}
                      maxLength={10}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Images - Now compulsory with limit */}
          <div className="space-y-2">
            <Label htmlFor="images">Space Images * (Required, max 5)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <Input
                ref={fileInputRef}
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={selectedFiles.length >= MAX_IMAGES}
              />
              <label htmlFor="images" className="flex flex-col items-center justify-center cursor-pointer py-4">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload images</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB each, max 5 images</p>
              </label>
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedFiles.length < MIN_IMAGES && (
              <p className="text-xs text-destructive mt-2">At least 1 image is required to list your space</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {selectedFiles.length}/{MAX_IMAGES} images uploaded
            </p>
          </div>

          {/* Features & Vehicle Types */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="grid grid-cols-2 gap-3">
                {availableFeatures.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={formData.features.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                    />
                    <label htmlFor={feature} className="text-sm cursor-pointer">
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Types Allowed *</Label>
              <div className="grid grid-cols-2 gap-3">
                {vehicleTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={formData.vehicleTypes.includes(type)}
                      onCheckedChange={() => handleVehicleTypeToggle(type)}
                    />
                    <label htmlFor={type} className="text-sm cursor-pointer capitalize">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Availability Dates */}
          <div className="space-y-2">
            <Label>Availability Dates (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Set when your parking space will be available for booking
            </p>
            {availabilityRanges.map((range, index) => (
              <div key={index} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <Label htmlFor={`startDate-${index}`} className="text-xs">
                    Start Date
                  </Label>
                  <Input
                    id={`startDate-${index}`}
                    type="date"
                    value={range.startDate}
                    onChange={(e) => updateAvailabilityRange(index, "startDate", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`endDate-${index}`} className="text-xs">
                    End Date
                  </Label>
                  <Input
                    id={`endDate-${index}`}
                    type="date"
                    value={range.endDate}
                    onChange={(e) => updateAvailabilityRange(index, "endDate", e.target.value)}
                  />
                </div>
                {availabilityRanges.length > 1 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeAvailabilityRange(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAvailabilityRange}
              className="mt-2"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Add Another Date Range
            </Button>
          </div>

          {/* M-Pesa Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>M-Pesa Payment Details</CardTitle>
              <CardDescription>
                Configure where payments from drivers will be sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mpesaPaymentMethod">Payment Method *</Label>
                <Select
                  value={formData.mpesaPaymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, mpesaPaymentMethod: value as any, mpesaAccountDetails: "" })}
                >
                  <SelectTrigger id="mpesaPaymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_money">Send Money (Phone Number)</SelectItem>
                    <SelectItem value="paybill">Paybill</SelectItem>
                    <SelectItem value="buy_goods">Buy Goods and Services</SelectItem>
                    <SelectItem value="pochi_la_biashara">Pochi La Biashara</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.mpesaPaymentMethod && (
                <div className="space-y-2">
                  <Label htmlFor="mpesaAccountDetails">
                    {formData.mpesaPaymentMethod === "send_money" && "Phone Number *"}
                    {formData.mpesaPaymentMethod === "paybill" && "Paybill Number *"}
                    {formData.mpesaPaymentMethod === "buy_goods" && "Till Number *"}
                    {formData.mpesaPaymentMethod === "pochi_la_biashara" && "Business Number *"}
                  </Label>
                  <Input
                    id="mpesaAccountDetails"
                    type="text"
                    placeholder={
                      formData.mpesaPaymentMethod === "send_money" ? "e.g., 254712345678"
                      : formData.mpesaPaymentMethod === "paybill" ? "e.g., 123456"
                      : formData.mpesaPaymentMethod === "buy_goods" ? "e.g., 123456"
                      : "e.g., 123456"
                    }
                    value={formData.mpesaAccountDetails}
                    onChange={(e) => setFormData({ ...formData, mpesaAccountDetails: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.mpesaPaymentMethod === "send_money" && "Enter your M-Pesa registered phone number"}
                    {formData.mpesaPaymentMethod === "paybill" && "Enter your Paybill account number"}
                    {formData.mpesaPaymentMethod === "buy_goods" && "Enter your Buy Goods and Services till number"}
                    {formData.mpesaPaymentMethod === "pochi_la_biashara" && "Enter your Pochi La Biashara business number"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-success hover:bg-success/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Space"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}