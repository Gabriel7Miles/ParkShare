export interface ParkingSpot {
  label: string // e.g., "1A", "1B", "Spot 1"
  isAvailable: boolean
  currentBookingId?: string // Only present when spot is booked
  bookedUntil?: Date // Only present when spot is booked
}

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
  totalSpots: number // Total number of parking spots in this listing
  spots: ParkingSpot[] // Individual spot details with labels
  createdAt: Date
}

export interface CarDetails {
  color: string
  numberPlate: string
  ownershipType: "personal" | "hired" | "borrowed" | "company" | "rental"
  make?: string
  model?: string
}

export interface Booking {
  id: string
  spaceId: string
  spotLabel: string // Which specific spot was booked (e.g., "1A", "1B")
  driverId: string
  driverName?: string
  hostId: string
  startTime: Date
  endTime: Date
  totalPrice: number
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
  paymentStatus: "pending" | "paid" | "refunded"
  carDetails: CarDetails
  createdAt: Date
}
