import type { ParkingSpace, ParkingSpot, CarDetails } from "./parking";

export interface CartItem {
  spaceId: string
  space: ParkingSpace
  spotLabel: string
  spot: ParkingSpot
  startDate: string
  startTime: string
  duration: string
  totalPrice: number
  reservedUntil: Date // When the reservation expires if not paid
}

export interface Cart {
  items: CartItem[]
  createdAt: Date
}

