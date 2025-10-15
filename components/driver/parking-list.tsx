"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ParkingSpace } from "@/lib/types/parking"
import { MapPin, Star, Car } from "lucide-react"
import Link from "next/link"

interface ParkingListProps {
  spaces: ParkingSpace[]
  onSpaceSelect: (space: ParkingSpace) => void
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
        <Link key={space.id} href={`/driver/space/${space.id}`}>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSpace?.id === space.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSpaceSelect(space)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{space.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm">
                    <MapPin className="w-3 h-3" />
                    {space.address}
                  </CardDescription>
                </div>
                <Badge variant={space.availability === "available" ? "default" : "secondary"} className="bg-success">
                  Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="text-sm font-medium">{space.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({space.reviewCount})</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {space.spaceType}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-primary font-bold">
                  <span>KES {space.pricePerHour}/hr</span>
                </div>
              </div>

              {space.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {space.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onBookNow(space)
                }}
              >
                Book Now
              </Button>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
