// components/host/space-card.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ParkingSpace } from "@/lib/types/parking"
import { MapPin, DollarSign, Edit, Trash2, Eye, Image as ImageIcon, Clock, Star, ParkingSquare } from "lucide-react"
import Image from "next/image"

interface SpaceCardProps {
  space: ParkingSpace
  onEdit: (space: ParkingSpace) => void
  onDelete: (space: ParkingSpace) => void
  onView: (space: ParkingSpace) => void
}

export function SpaceCard({ space, onEdit, onDelete, onView }: SpaceCardProps) {
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "bg-green-500 text-white border-green-400"
      case "occupied":
        return "bg-red-500 text-white border-red-400"
      case "reserved":
        return "bg-orange-500 text-white border-orange-400"
      default:
        return "bg-gray-500 text-white border-gray-400"
    }
  }
  
  // Calculate available spots
  const availableSpots = space.spots?.filter(spot => spot.isAvailable).length || 0
  const totalSpots = space.totalSpots || space.spots?.length || 1
  const allBooked = availableSpots === 0

  return (
    <Card className="hover:shadow-md transition-all overflow-hidden group">
      {/* ✅ IMAGE SECTION */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/5">
        {space.images && space.images.length > 0 ? (
          <Image
            src={space.images[0]}
            alt={space.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 300px"
            onError={(e) => {
              console.warn('[SpaceCard] Image load error:', space.images[0])
              ;(e.target as HTMLImageElement).src = "/placeholder-parking.jpg"
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground ml-2">No image</p>
          </div>
        )}
        
        {/* Availability Badge */}
        <Badge className={`absolute top-3 right-3 ${getAvailabilityColor(space.availability)}`}>
          {space.availability}
        </Badge>
        
        {/* Image count badge */}
        {space.images && space.images.length > 1 && (
          <Badge className="absolute top-3 left-3 bg-primary/80 text-primary-foreground text-xs">
            {space.images.length} photos
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1 line-clamp-1">{space.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-sm">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{space.address}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <DollarSign className="w-4 h-4" />
            <span>KES {space.pricePerHour}</span>
            <span className="text-sm font-normal text-muted-foreground">/hr</span>
          </div>
          <Badge variant="outline" className="text-xs capitalize">
            {space.spaceType}
          </Badge>
        </div>

        {/* Features preview */}
        {space.features && space.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {space.features.slice(0, 2).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {space.features.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{space.features.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1" 
            onClick={(e) => {
              e.stopPropagation()
              onView(space)
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1" 
            onClick={(e) => {
              e.stopPropagation()
              onEdit(space)
            }}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(space)
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ParkingSquare className="w-3 h-3" />
              <span>
                <span className={`font-semibold ${allBooked ? 'text-destructive' : 'text-success'}`}>
                  {availableSpots}
                </span> / {totalSpots} spots available
              </span>
            </div>
            {space.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{space.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({space.reviewCount})</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Listed {space.createdAt ? new Date(space.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
            </span>
            {allBooked && (
              <Badge variant="destructive" className="text-xs">
                Fully Booked
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}