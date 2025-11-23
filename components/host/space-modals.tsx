"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ParkingSpace } from "@/lib/types/parking"
import {
  MapPin,
  DollarSign,
  Clock,
  Star,
  ParkingSquare,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Calendar,
  Trash2,
} from "lucide-react"
import Image from "next/image"

interface ViewSpaceModalProps {
  space: ParkingSpace | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewSpaceModal({ space, open, onOpenChange }: ViewSpaceModalProps) {
  if (!space) return null

  const availableSpots = space.spots?.filter((spot) => spot.isAvailable).length || 0
  const totalSpots = space.totalSpots || space.spots?.length || 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{space.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4" />
            {space.address}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Images Gallery */}
          {space.images && space.images.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Images ({space.images.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {space.images.map((image, index) => (
                  <div key={index} className="relative h-40 rounded-lg overflow-hidden border">
                    <Image
                      src={image}
                      alt={`${space.title} - ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{space.description}</p>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Hourly Rate</p>
                <p className="text-2xl font-bold text-primary">KES {space.pricePerHour}</p>
              </div>
              {space.pricePerDay && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Daily Rate</p>
                  <p className="text-2xl font-bold text-primary">KES {space.pricePerDay}</p>
                </div>
              )}
              {space.pricePerMonth && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Rate</p>
                  <p className="text-2xl font-bold text-primary">KES {space.pricePerMonth}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Parking Spots */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <ParkingSquare className="w-4 h-4" />
              Parking Spots ({availableSpots}/{totalSpots} available)
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {space.spots?.map((spot, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 text-center ${
                    spot.isAvailable
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : "border-red-500 bg-red-50 dark:bg-red-950"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {spot.isAvailable ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-600" />
                    )}
                  </div>
                  <p className="font-mono font-semibold text-sm">{spot.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {spot.isAvailable ? "Available" : "Booked"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Features */}
          {space.features && space.features.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Features & Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {space.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Additional Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {space.spaceType}
              </Badge>
              <span className="text-muted-foreground">Type</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  space.availability === "available"
                    ? "bg-green-500"
                    : space.availability === "occupied"
                    ? "bg-red-500"
                    : "bg-orange-500"
                }
              >
                {space.availability}
              </Badge>
              <span className="text-muted-foreground">Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">
                {space.rating?.toFixed(1) || "0.0"} ({space.reviewCount || 0})
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {space.createdAt
                  ? new Date(space.createdAt).toLocaleDateString("en-KE", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteConfirmationDialogProps {
  space: ParkingSpace | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteConfirmationDialog({
  space,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  if (!space) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete Parking Space?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete this parking space?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="font-semibold text-foreground">{space.title}</div>
            <div className="text-sm flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              {space.address}
            </div>
            {space.images && space.images.length > 0 && (
              <div className="text-sm flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                {space.images.length} image{space.images.length > 1 ? "s" : ""} will be deleted
              </div>
            )}
          </div>
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <div className="text-sm text-destructive font-medium">⚠️ This action cannot be undone</div>
            <ul className="text-sm text-destructive/80 mt-2 space-y-1 ml-4 list-disc">
              <li>All parking space data will be permanently deleted</li>
              <li>All associated images will be removed from storage</li>
              <li>Active bookings may be affected</li>
            </ul>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

