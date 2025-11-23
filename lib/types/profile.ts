// lib/types/profile.ts
export type UserRole = "driver" | "host"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  roles: UserRole[] // Array to support multiple roles
  phoneNumber?: string
  bio?: string // User bio/about section
  profilePicture?: string // Profile picture URL
  createdAt: Date
  profileComplete: boolean
  updatedAt?: Date
  activeRole?: UserRole // Currently active role
  // Host-specific fields
  hostVerified?: boolean
  totalListings?: number
  totalEarnings?: number
  // Driver-specific fields
  totalBookings?: number
  memberSince?: string // Formatted date string for display
}