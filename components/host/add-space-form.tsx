// components/host/add-space-form.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/contexts/firebase-context"
import { createParkingSpace } from "@/lib/firebase/host"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Upload, X, Calendar } from "lucide-react"

export function AddSpaceForm() {
  const [loading, setLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
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
    numberOfSpaces: "1",
  })

  const { user, userProfile } = useAuth()
  const { db } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: string[] = []
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === files.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!user || !userProfile || !db) {
      toast({
        title: "Error",
        description: "Please log in and wait for profile to load",
        variant: "destructive",
      })
      return
    }

    if (!formData.title || !formData.description || !formData.address || !formData.pricePerHour || 
        formData.vehicleTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please fill all required fields and select at least one vehicle type",
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

      // ✅ FIXED: Clean data - exclude undefined values
      const baseData = {
        hostId: user.uid,
        hostName: userProfile.displayName || user.email?.split('@')[0] || 'Host',
        title: formData.title,
        description: formData.description,
        address: formData.address,
        location: { lat: 40.7128, lng: -74.006 },
        pricePerHour: Number.parseFloat(formData.pricePerHour),
        availability: "available" as const,
        features: formData.features,
        images: imagePreviews,
        rating: 0,
        reviewCount: 0,
        spaceType: formData.spaceType,
        vehicleTypes: formData.vehicleTypes,
        numberOfSpaces: Number.parseInt(formData.numberOfSpaces) || 1,
      }

      // ✅ ONLY ADD OPTIONAL FIELDS IF THEY EXIST
      const optionalFields = {
        ...(userProfile.phoneNumber && { hostPhone: userProfile.phoneNumber }),
        ...(formData.pricePerDay && { pricePerDay: Number.parseFloat(formData.pricePerDay) }),
        ...(formData.pricePerMonth && { pricePerMonth: Number.parseFloat(formData.pricePerMonth) }),
        ...(availableDates.length > 0 && { availableDates }),
      }

      const spaceData = { ...baseData, ...optionalFields }
      
      console.log('[v0] Creating space with clean data:', {
        ...spaceData,
        hostPhone: spaceData.hostPhone ? 'present' : 'excluded',
      })
      
      const spaceId = await createParkingSpace(db, spaceData)
      
      console.log('[v0] Space created successfully with ID:', spaceId)
      
      toast({
        title: "🎉 Space added successfully!",
        description: `Your parking space "${formData.title}" is now live!`,
      })

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
        numberOfSpaces: "1",
      })
      setImagePreviews([])
      setAvailabilityRanges([{ startDate: "", endDate: "" }])
      
      router.push("/host/dashboard")
    } catch (error: any) {
      console.error('[v0] Error creating parking space:', error)
      toast({
        title: "Failed to add space",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Parking Space</CardTitle>
          <CardDescription>Fill in the details to list your parking space</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Space Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Downtown Garage - Covered Parking"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your parking space..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              placeholder="123 Main St, City, State ZIP"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Space Images</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="images" className="flex flex-col items-center justify-center cursor-pointer py-4">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload images</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfSpaces">Number of Parking Spaces *</Label>
            <Input
              id="numberOfSpaces"
              type="number"
              min="1"
              placeholder="1"
              value={formData.numberOfSpaces}
              onChange={(e) => setFormData({ ...formData, numberOfSpaces: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">How many vehicles can park at this location?</p>
          </div>

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

          <div className="space-y-2">
            <Label>Availability Dates</Label>
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

          <div className="space-y-2">
            <Label htmlFor="spaceType">Space Type *</Label>
            <Select
              value={formData.spaceType}
              onValueChange={(value) => setFormData({ ...formData, spaceType: value })}
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

          <div className="space-y-2">
            <Label>Features</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !user} className="flex-1">
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