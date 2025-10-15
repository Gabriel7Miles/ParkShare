export interface Review {
  id: string
  spaceId: string
  bookingId: string
  driverId: string
  driverName: string
  hostId: string
  rating: number
  comment: string
  createdAt: Date
  helpful: number
  reported: boolean
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}
