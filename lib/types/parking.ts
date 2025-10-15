export interface ParkingSpace {
  id: string
  hostId: string
  hostName: string
  hostPhone?: string
  title: string
  description: string
  address: string
  location: {
    lat: number
    lng: number
  }
  pricePerHour: number
  pricePerDay?: number
  pricePerMonth?: number
  availability: "available" | "occupied" | "reserved"
  features: string[]
  images: string[]
  rating: number
  reviewCount: number
  spaceType: "driveway" | "garage" | "lot" | "street"
  vehicleTypes: string[]
  availableDates?: {
    startDate: Date
    endDate: Date
  }[]
  numberOfSpaces?: number
  createdAt: Date
}

export interface Booking {
  id: string
  spaceId: string
  driverId: string
  hostId: string
  startTime: Date
  endTime: Date
  totalPrice: number
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
  paymentStatus: "pending" | "paid" | "refunded"
  createdAt: Date
}
