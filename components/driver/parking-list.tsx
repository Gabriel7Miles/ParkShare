// components/driver/parking-list.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ParkingSpace } from "@/lib/types/parking"
import { MapPin, Star, Car, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ParkingListProps {
  spaces: ParkingSpace[]
  onSpaceSelect?: (space: ParkingSpace) => void // Made optional
  selectedSpace: ParkingSpace | null
  onBookNow: (space: ParkingSpace) => void
}

export function ParkingList({ spaces, onSpaceSelect, selectedSpace, onBookNow }: ParkingListProps) {
  if (spaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No parking spaces found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 overflow-y-auto h-full pr-2">
      {spaces.map((space) => (
        <Link
          key={space.id}
          href={`/driver/space/${space.id}`} // Ensure navigation to correct route
          onClick={(e) => {
            if (onSpaceSelect) {
              onSpaceSelect(space); // Call onSpaceSelect without preventing default
            }
          }}
          className="block" // Ensure the link is clickable
        >
          <Card
            className={`cursor-pointer transition-all hover:shadow-md border-2 ${
              selectedSpace?.id === space.id ? "ring-2 ring-primary border-primary" : "border-border"
            }`}
          >
            {/* ✅ IMAGE SECTION */}
            <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
              {space.images && space.images.length > 0 ? (
                <Image
                  src={space.images[0] || "/placeholder-parking.jpg"}
                  alt={space.title || "Parking space image"}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 300px"
                  onError={(e) => {
                    console.warn("[ParkingList] Image load error:", space.images[0]);
                    (e.target as HTMLImageElement).src = "/placeholder-parking.jpg";
                  }}
                  priority={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted-foreground/10">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground ml-2">No image</p>
                </div>
              )}
              <Badge
                className="absolute top-2 right-2 bg-success text-success-foreground border-success/50"
                variant="default"
              >
                Available
              </Badge>
              {space.images && space.images.length > 1 && (
                <Badge className="absolute top-2 left-2 bg-primary/80 text-primary-foreground text-xs">
                  +{space.images.length - 1} photos
                </Badge>
              )}
            </div>

            <CardHeader className="pb-3 pt-4">
              <div className="flex items-start justify-between gap-4">
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="text-sm font-medium">{space.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({space.reviewCount})</span>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {space.spaceType}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-primary font-bold text-lg">
                  <span>KES {space.pricePerHour || 0}</span>
                  <span className="text-sm font-normal text-muted-foreground">/hr</span>
                </div>
              </div>

              {space.features && space.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {space.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {space.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{space.features.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBookNow(space);
                }}
              >
                Book Now - KES {space.pricePerHour || 0}/hr
              </Button>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}