"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { ParkingSpace, ParkingSpot } from "@/lib/types/parking"
import { Calendar, Clock, MapPin } from "lucide-react"
import { addToCart } from "@/lib/utils/cart"
import { reserveSpot } from "@/lib/firebase/spot-reservation"
import { useFirebase } from "@/contexts/firebase-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SpotSelectionModalProps {
  space: ParkingSpace | null
  open: boolean
  onClose: () => void
}

export function SpotSelectionModal({ space, open, onClose }: SpotSelectionModalProps) {
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [duration, setDuration] = useState("1")
  const [loading, setLoading] = useState(false)
  const { db } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Reset form when modal opens/closes
    if (!open) {
      setSelectedSpot(null)
      setStartDate("")
      setStartTime("")
      setDuration("1")
    }
  }, [open])

  if (!space) return null

  const getAvailableSpots = (): ParkingSpot[] => {
    if (!space.spots) return []
    
    const startDateTime = startDate && startTime ? new Date(`${startDate}T${startTime}`) : null
    
    return space.spots.filter(spot => {
      if (!spot.isAvailable) return false
      if (spot.bookedUntil && startDateTime && new Date(spot.bookedUntil) > startDateTime) {
        return false
      }
      return true
    })
  }

  const availableSpots = getAvailableSpots()
  const totalPrice = space.pricePerHour * (Number.parseFloat(duration) || 0)

  const handleAddToCart = async () => {
    if (!selectedSpot || !startDate || !startTime || !duration) {
      toast({
        title: "Missing information",
        description: "Please select a spot, date, time, and duration",
        variant: "destructive",
      })
      return
    }

    if (!db) {
      toast({
        title: "Error",
        description: "Database not initialized",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Reserve spot for 15 minutes (cart timeout)
      const reservedUntil = new Date(Date.now() + 15 * 60 * 1000)
      
      // Try to reserve the spot in Firestore (optional - won't fail if it doesn't work)
      // This allows unauthenticated users to add to cart
      try {
        if (db) {
          await reserveSpot(db, space.id, selectedSpot.label, reservedUntil)
        }
      } catch (reserveError) {
        // If reservation fails (e.g., user not authenticated), continue anyway
        // The spot will be reserved when they proceed to payment
        console.log("[Cart] Spot reservation skipped (will reserve at checkout):", reserveError)
      }

      // Add to cart (always works - uses localStorage)
      const cartItem = {
        spaceId: space.id,
        space,
        spotLabel: selectedSpot.label,
        spot: selectedSpot,
        startDate,
        startTime,
        duration,
        totalPrice,
        reservedUntil,
      }

      addToCart(cartItem)

      toast({
        title: "Added to cart",
        description: `Spot ${selectedSpot.label} has been added to your cart. Complete payment within 15 minutes.`,
      })

      // Redirect to cart page
      router.push("/cart")
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add spot to cart",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Parking Spot</DialogTitle>
          <DialogDescription>
            Choose your preferred spot and booking details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Space Info */}
          <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-lg">{space.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {space.address}
            </div>
            <div className="text-sm">
              <span className="font-medium">KES {space.pricePerHour}</span>
              <span className="text-muted-foreground">/hour</span>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Start Date *</Label>
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
              <Label htmlFor="time">Start Time *</Label>
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
            <Label htmlFor="duration">Duration (hours) *</Label>
            <Input
              id="duration"
              type="number"
              min="0.5"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Spot Selection */}
          <div className="space-y-2">
            <Label>Available Spots *</Label>
            {availableSpots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No spots available for the selected date/time</p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {availableSpots.map((spot) => (
                  <button
                    key={spot.label}
                    onClick={() => setSelectedSpot(spot)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedSpot?.label === spot.label
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold">Spot {spot.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Total Price */}
          {selectedSpot && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  KES {totalPrice.toFixed(0)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={!selectedSpot || !startDate || !startTime || loading}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

