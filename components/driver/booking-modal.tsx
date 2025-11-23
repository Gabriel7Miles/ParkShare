"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { ParkingSpace } from "@/lib/types/parking"
import { Calendar, Clock, MapPin, Phone } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/contexts/firebase-context"
import { createBooking } from "@/lib/firebase/parking"
import { processPayment } from "@/lib/firebase/payment"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { PaymentForm } from "@/components/payment/payment-form"
import { PaymentSuccess } from "@/components/payment/payment-success"
import type { Booking } from "@/lib/types/parking"

interface BookingModalProps {
  space: ParkingSpace | null
  open: boolean
  onClose: () => void
}

export function BookingModal({ space, open, onClose }: BookingModalProps) {
  const [step, setStep] = useState<"details" | "payment" | "success">("details")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [duration, setDuration] = useState("1")
  const [selectedSpot, setSelectedSpot] = useState("")
  
  // Car details
  const [carColor, setCarColor] = useState("")
  const [numberPlate, setNumberPlate] = useState("")
  const [ownershipType, setOwnershipType] = useState<"personal" | "hired" | "borrowed" | "company" | "rental">("personal")
  const [carMake, setCarMake] = useState("")
  const [carModel, setCarModel] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  const { user, userProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { db } = useFirebase()

  if (!space) return null

  // Redirect to signup if user is not authenticated
  if (open && !user) {
    toast({
      title: "Sign in required",
      description: "Please sign in or create an account to book parking",
    })
    router.push(`/signup?redirect=/&bookSpace=${space.id}`)
    onClose()
    return null
  }

  const calculateTotal = () => {
    const hours = Number.parseFloat(duration) || 0
    return space.pricePerHour * hours
  }

  const handleContinueToPayment = () => {
    if (!startDate || !startTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all booking details",
        variant: "destructive",
      })
      return
    }
    
    if (!selectedSpot) {
      toast({
        title: "Select a parking spot",
        description: "Please choose which spot you want to book",
        variant: "destructive",
      })
      return
    }
    
    if (!carColor || !numberPlate) {
      toast({
        title: "Car details required",
        description: "Please provide your car color and number plate",
        variant: "destructive",
      })
      return
    }
    
    setStep("payment")
  }

  const getAvailableSpots = () => {
    if (!space.spots) return []
    
    const startDateTime = new Date(`${startDate}T${startTime}`)
    
    return space.spots.filter(spot => {
      if (!spot.isAvailable) return false
      if (spot.bookedUntil && new Date(spot.bookedUntil) > startDateTime) {
        return false
      }
      return true
    })
  }

  const handlePayment = async (phoneNumber: string) => {
    if (!user || !db) return

    setLoading(true)
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = new Date(startDateTime.getTime() + Number.parseFloat(duration) * 60 * 60 * 1000)

      const bookingId = await createBooking(
        db,
        {
          spaceId: space.id,
          spotLabel: selectedSpot,
          driverId: user.uid,
          driverName: userProfile?.displayName || user.email || "Unknown",
          hostId: space.hostId,
          startTime: startDateTime,
          endTime: endDateTime,
          totalPrice: calculateTotal(),
          status: "pending",
          paymentStatus: "pending",
          carDetails: {
            color: carColor,
            numberPlate: numberPlate.toUpperCase(),
            ownershipType,
            make: carMake || undefined,
            model: carModel || undefined,
          },
        },
        null
      )

      const { checkoutRequestId } = await processPayment(
        db,
        bookingId,
        calculateTotal(),
        phoneNumber,
        `BOOKING-${bookingId.substring(0, 8)}`,
      )

      toast({
        title: "Payment initiated",
        description: "Please check your phone and enter your M-Pesa PIN to complete the payment",
      })

      const booking: Booking = {
        id: bookingId,
        spaceId: space.id,
        driverId: user.uid,
        hostId: space.hostId,
        startTime: startDateTime,
        endTime: endDateTime,
        totalPrice: calculateTotal(),
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
      }

      setCurrentBooking(booking)
      setStep("success")
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("details")
    setStartDate("")
    setStartTime("")
    setDuration("1")
    setSelectedSpot("")
    setCarColor("")
    setNumberPlate("")
    setOwnershipType("personal")
    setCarMake("")
    setCarModel("")
    setCurrentBooking(null)
    onClose()
  }
  
  const availableSpots = getAvailableSpots()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0"
        // This ensures scrolling works perfectly on mobile & desktop
      >
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {step === "details" && "Book Parking Space"}
              {step === "payment" && "Complete Payment"}
              {step === "success" && "Booking Confirmed!"}
            </DialogTitle>
            <DialogDescription>
              {step === "details" && "Fill in your booking and vehicle details"}
              {step === "payment" && "Pay securely using M-Pesa"}
              {step === "success" && "Your parking spot is reserved"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-6">
          {step === "details" && (
            <>
              <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-lg">{space.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {space.address}
                </div>
                {space.hostPhone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {space.hostPhone}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spot">Select Parking Spot *</Label>
                <select
                  id="spot"
                  value={selectedSpot}
                  onChange={(e) => setSelectedSpot(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Choose a spot...</option>
                  {availableSpots.map((spot) => (
                    <option key={spot.label} value={spot.label}>
                      Spot {spot.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {availableSpots.length} spot(s) available
                </p>
              </div>

              <div className="border-t pt-6 space-y-6">
                <h3 className="font-semibold text-lg">Vehicle Details</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carColor">Car Color *</Label>
                    <Input
                      id="carColor"
                      placeholder="e.g., Blue, White"
                      value={carColor}
                      onChange={(e) => setCarColor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberPlate">Number Plate *</Label>
                    <Input
                      id="numberPlate"
                      placeholder="e.g., KCA 123X"
                      value={numberPlate}
                      onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ownership Type</Label>
                  <select
                    value={ownershipType}
                    onChange={(e) => setOwnershipType(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="personal">Personal Vehicle</option>
                    <option value="hired">Hired/Taxi</option>
                    <option value="borrowed">Borrowed</option>
                    <option value="company">Company Vehicle</option>
                    <option value="rental">Rental Car</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carMake">Make (Optional)</Label>
                    <Input id="carMake" placeholder="Toyota" value={carMake} onChange={(e) => setCarMake(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carModel">Model (Optional)</Label>
                    <Input id="carModel" placeholder="Corolla" value={carModel} onChange={(e) => setCarModel(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate per hour</span>
                  <span className="font-medium">KES {space.pricePerHour}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration} hours</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      KES {calculateTotal().toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleContinueToPayment} className="flex-1">
                  Continue to Payment
                </Button>
              </div>
            </>
          )}

          {step === "payment" && (
            <div className="space-y-6 py-4">
              <PaymentForm amount={calculateTotal()} onSubmit={handlePayment} loading={loading} />
              <Button variant="outline" onClick={() => setStep("details")} className="w-full">
                Back to Details
              </Button>
            </div>
          )}

          {step === "success" && currentBooking && (
            <div className="py-6">
              <PaymentSuccess
                booking={currentBooking}
                onViewBooking={() => {
                  handleClose()
                  router.push("/driver/bookings")
                }}
                onDownloadReceipt={() => {
                  toast({
                    title: "Receipt downloaded",
                    description: "Your receipt has been saved",
                  })
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}