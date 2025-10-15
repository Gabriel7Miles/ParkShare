"use client"

import { useEffect, useState } from "react"
import { HostDashboardNav } from "@/components/host/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getHostBookings } from "@/lib/firebase/host"
import type { Booking } from "@/lib/types/parking"
import { useAuth } from "@/contexts/auth-context"
import { DollarSign, TrendingUp, Calendar, Loader2 } from "lucide-react"

export default function HostEarnings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
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
      const hostBookings = await getHostBookings(user.uid)
      setBookings(hostBookings)
    } catch (error) {
      console.error("[v0] Error loading bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateEarnings = () => {
    const total = bookings.filter((b) => b.paymentStatus === "paid").reduce((sum, b) => sum + b.totalPrice, 0)

    const thisMonth = bookings
      .filter((b) => {
        const bookingDate = new Date(b.createdAt)
        const now = new Date()
        return (
          b.paymentStatus === "paid" &&
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        )
      })
      .reduce((sum, b) => sum + b.totalPrice, 0)

    const pending = bookings.filter((b) => b.paymentStatus === "pending").reduce((sum, b) => sum + b.totalPrice, 0)

    return { total, thisMonth, pending }
  }

  const earnings = calculateEarnings()

  return (
    <div className="min-h-screen bg-background">
      <HostDashboardNav />

      <div className="pt-16">
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 font-sans">Earnings</h1>
            <p className="text-muted-foreground">Track your income from parking spaces</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardDescription>Total Earnings</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-3xl">
                    <DollarSign className="w-8 h-8 text-success" />
                    <span>KES {earnings.total.toLocaleString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">All-time earnings from bookings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>This Month</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-3xl">
                    <Calendar className="w-8 h-8 text-primary" />
                    <span>KES {earnings.thisMonth.toLocaleString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Earnings in current month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-3xl">
                    <TrendingUp className="w-8 h-8 text-accent" />
                    <span>KES {earnings.pending.toLocaleString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Awaiting payment confirmation</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
