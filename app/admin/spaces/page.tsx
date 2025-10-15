"use client"

import { AdminNav } from "@/components/admin/admin-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, MapPin } from "lucide-react"

export default function AdminSpaces() {
  const spaces = [
    { id: "1", title: "Downtown Garage", host: "Sarah Johnson", price: 8.5, status: "available", bookings: 45 },
    { id: "2", title: "Midtown Driveway", host: "Mike Davis", price: 6.0, status: "available", bookings: 32 },
    { id: "3", title: "Financial District Lot", host: "Emily Wilson", price: 10.0, status: "occupied", bookings: 78 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />

      <div className="pt-16">
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 font-sans">Parking Spaces</h1>
            <p className="text-muted-foreground">Manage all listed parking spaces</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Spaces</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search spaces..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{space.title}</p>
                        <p className="text-sm text-muted-foreground">Host: {space.host}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">${space.price}/hr</p>
                        <p className="text-xs text-muted-foreground">{space.bookings} bookings</p>
                      </div>
                      <Badge className={space.status === "available" ? "bg-success" : "bg-accent"}>
                        {space.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
