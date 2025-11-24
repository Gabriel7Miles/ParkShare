"use client"

import { useEffect, useState } from "react"
import { HostDashboardNav } from "@/components/host/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getHostBookings, updateBookingStatus } from "@/lib/firebase/host"
import type { Booking } from "@/lib/types/parking"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, Clock, DollarSign, Loader2, Check, X } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function HostBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [user])

  const loadBookings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const hostBookings = await getHostBookings(user.uid)
      setBookings(hostBookings)
    } catch (error) {
      console.error("[v0] Error loading bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (bookingId: string, status: Booking["status"]) => {
    try {
      await updateBookingStatus(bookingId, status)
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)))
      toast({
        title: "Booking updated",
        description: `Booking ${status}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success"
      case "active":
        return "bg-primary"
      case "completed":
        return "bg-muted"
      case "cancelled":
        return "bg-destructive"
      default:
        return "bg-accent"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <HostDashboardNav />

      <div className="pt-16">
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 font-sans">Bookings</h1>
            <p className="text-muted-foreground">Manage your parking space reservations</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No bookings yet</p>
                <p className="text-sm text-muted-foreground">
                  Bookings will appear here once drivers reserve your spaces
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Booking #{booking.id.slice(0, 8)}</CardTitle>
                        <CardDescription>Space ID: {booking.spaceId}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(booking.startTime), "MMM dd, yyyy")} -{" "}
                          {format(new Date(booking.endTime), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(booking.startTime), "h:mm a")} -{" "}
                          {format(new Date(booking.endTime), "h:mm a")}
                        </span>
                      </div>
                    </div>

                    {/* Car Details */}
                    {booking.carDetails && (
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <h4 className="font-semibold text-sm">Vehicle Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Color: </span>
                            <span className="font-medium">{booking.carDetails.color}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Plate: </span>
                            <span className="font-medium">{booking.carDetails.numberPlate}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ownership: </span>
                            <span className="font-medium capitalize">{booking.carDetails.ownershipType}</span>
                          </div>
                          {booking.carDetails.make && (
                            <div>
                              <span className="text-muted-foreground">Make/Model: </span>
                              <span className="font-medium">
                                {booking.carDetails.make}
                                {booking.carDetails.model && ` ${booking.carDetails.model}`}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2">
                          <Badge variant="outline">Spot {booking.spotLabel}</Badge>
                        </div>
                        <div className="pt-2 text-sm">
                          <span className="text-muted-foreground">Driver: </span>
                          <span className="font-medium">{booking.driverName || "Unknown"}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-success" />
                        <span className="text-2xl font-bold text-success">KES {booking.totalPrice.toFixed(2)}</span>
                      </div>
                      {booking.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent text-destructive hover:text-destructive"
                            onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
