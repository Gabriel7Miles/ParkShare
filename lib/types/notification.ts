export type NotificationType = 
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "payment_received"
  | "payment_failed"
  | "review_received"
  | "spot_reserved"
  | "spot_released"

export interface Notification {
  id: string
  userId: string // Driver or Host ID
  type: NotificationType
  title: string
  message: string
  relatedBookingId?: string
  relatedSpaceId?: string
  read: boolean
  createdAt: Date
}

