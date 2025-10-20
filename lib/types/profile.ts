// lib/types/profile.ts
export type UserRole = "driver" | "host"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  roles: UserRole[] // Array to support multiple roles
  phoneNumber?: string
  createdAt: Date
  profileComplete: boolean
  updatedAt?: Date // Add for tracking updates
}