"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ParkingSpace } from "@/lib/types/parking"
import { MapPin, DollarSign, Edit, Trash2, Eye } from "lucide-react"

interface SpaceCardProps {
  space: ParkingSpace
  onEdit: (space: ParkingSpace) => void
  onDelete: (spaceId: string) => void
  onView: (space: ParkingSpace) => void
}

export function SpaceCard({ space, onEdit, onDelete, onView }: SpaceCardProps) {
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "bg-success"
      case "occupied":
        return "bg-destructive"
      case "reserved":
        return "bg-accent"
      default:
        return "bg-muted"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{space.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-sm">
              <MapPin className="w-3 h-3" />
              {space.address}
            </CardDescription>
          </div>
          <Badge className={getAvailabilityColor(space.availability)}>{space.availability}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-primary font-bold">
            <DollarSign className="w-4 h-4" />
            <span>KES {space.pricePerHour}/hr</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {space.spaceType}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onView(space)}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onEdit(space)}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent text-destructive hover:text-destructive"
            onClick={() => onDelete(space.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
