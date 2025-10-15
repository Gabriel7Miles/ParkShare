"use client"

import { AdminNav } from "@/components/admin/admin-nav"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MapPin, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react"

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "2,543",
      icon: Users,
      description: "Active users",
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Parking Spaces",
      value: "487",
      icon: MapPin,
      description: "Listed spaces",
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Total Bookings",
      value: "1,829",
      icon: Calendar,
      description: "All time",
      trend: { value: 23, isPositive: true },
    },
    {
      title: "Revenue",
      value: "$45,231",
      icon: DollarSign,
      description: "This month",
      trend: { value: 15, isPositive: true },
    },
  ]

  const recentActivity = [
    { type: "booking", message: "New booking created by John Doe", time: "2 minutes ago" },
    { type: "space", message: "New parking space listed by Sarah Johnson", time: "15 minutes ago" },
    { type: "user", message: "New user registered: Mike Davis", time: "1 hour ago" },
    { type: "review", message: "New review posted for Downtown Garage", time: "2 hours ago" },
    { type: "payment", message: "Payment received: $25.50", time: "3 hours ago" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />

      <div className="pt-16">
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 font-sans">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of your ParkShare platform</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Important notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-accent/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">3 reported reviews pending</p>
                      <p className="text-xs text-muted-foreground mt-1">Requires moderation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Revenue up 15% this month</p>
                      <p className="text-xs text-muted-foreground mt-1">Great performance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-success/10 rounded-lg">
                    <Users className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">45 new users this week</p>
                      <p className="text-xs text-muted-foreground mt-1">User growth trending up</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
