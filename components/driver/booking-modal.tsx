"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { ParkingSpace } from "@/lib/types/parking"
import { Calendar, Clock, MapPin, Phone } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
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
  const [loading, setLoading] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  if (!space) return null

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
    setStep("payment")
  }

  const handlePayment = async (phoneNumber: string) => {
    if (!user) return

    setLoading(true)
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = new Date(startDateTime.getTime() + Number.parseFloat(duration) * 60 * 60 * 1000)

      const bookingId = await createBooking({
        spaceId: space.id,
        driverId: user.uid,
        hostId: space.hostId,
        startTime: startDateTime,
        endTime: endDateTime,
        totalPrice: calculateTotal(),
        status: "pending",
        paymentStatus: "pending",
      })

      // Initiate M-Pesa payment
      const { checkoutRequestId } = await processPayment(
        bookingId,
        calculateTotal(),
        phoneNumber,
        `BOOKING-${bookingId.substring(0, 8)}`,
      )

      toast({
        title: "Payment initiated",
        description: "Please check your phone and enter your M-Pesa PIN to complete the payment",
      })

      // Create booking object for success screen
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
    setCurrentBooking(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Book Parking Space</DialogTitle>
              <DialogDescription>Complete your booking details</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
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

              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Rate per hour</span>
                  <span className="font-medium">KES {space.pricePerHour}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration} hours</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                      <span>KES {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleContinueToPayment} className="flex-1">
                  Continue to Payment
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Payment</DialogTitle>
              <DialogDescription>Complete your payment to confirm the booking</DialogDescription>
            </DialogHeader>

            <PaymentForm amount={calculateTotal()} onSubmit={handlePayment} loading={loading} />

            <Button variant="outline" onClick={() => setStep("details")} className="w-full bg-transparent">
              Back to Booking Details
            </Button>
          </>
        )}

        {step === "success" && currentBooking && (
          <PaymentSuccess
            booking={currentBooking}
            onViewBooking={() => {
              handleClose()
              router.push("/driver/bookings")
            }}
            onDownloadReceipt={() => {
              toast({
                title: "Receipt downloaded",
                description: "Your receipt has been downloaded",
              })
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
