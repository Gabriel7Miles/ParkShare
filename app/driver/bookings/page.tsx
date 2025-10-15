"use client"

import { useEffect, useState } from "react"
import { DriverDashboardNav } from "@/components/driver/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getUserBookings } from "@/lib/firebase/parking"
import type { Booking } from "@/lib/types/parking"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, Clock, DollarSign, Loader2, Star } from "lucide-react"
import { format } from "date-fns"
import { ReviewForm } from "@/components/reviews/review-form"

export default function DriverBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [user])

  const loadBookings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const userBookings = await getUserBookings(user.uid)
      setBookings(userBookings)
    } catch (error) {
      console.error("[v0] Error loading bookings:", error)
    } finally {
      setLoading(false)
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
      <DriverDashboardNav />

      <div className="pt-16">
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 font-sans">My Bookings</h1>
            <p className="text-muted-foreground">View and manage your parking reservations</p>
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
                <p className="text-sm text-muted-foreground mb-4">Start by finding a parking space</p>
                <Button onClick={() => (window.location.href = "/driver/dashboard")}>Find Parking</Button>
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

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold">KES {booking.totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={booking.paymentStatus === "paid" ? "default" : "secondary"}>
                          {booking.paymentStatus}
                        </Badge>
                        {booking.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() => setReviewBooking(booking)}
                          >
                            <Star className="w-4 h-4" />
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!reviewBooking} onOpenChange={() => setReviewBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          {reviewBooking && (
            <ReviewForm
              spaceId={reviewBooking.spaceId}
              bookingId={reviewBooking.id}
              hostId={reviewBooking.hostId}
              onSuccess={() => {
                setReviewBooking(null)
                loadBookings()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
