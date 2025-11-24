import { doc, updateDoc, getDoc, type Firestore } from "firebase/firestore"
import type { ParkingSpot } from "@/lib/types/parking"

/**
 * Update spot availability when a booking is created
 */
export async function markSpotAsBooked(
  db: Firestore,
  spaceId: string,
  spotLabel: string,
  bookingId: string,
  bookedUntil: Date
): Promise<void> {
  try {
    const spaceRef = doc(db, "parkingSpaces", spaceId)
    const spaceDoc = await getDoc(spaceRef)
    
    if (!spaceDoc.exists()) {
      throw new Error("Parking space not found")
    }
    
    const spaceData = spaceDoc.data()
    const spots: ParkingSpot[] = spaceData.spots || []
    
    // Update the specific spot
    const updatedSpots = spots.map(spot => {
      if (spot.label === spotLabel) {
        return {
          ...spot,
          isAvailable: false,
          currentBookingId: bookingId,
          bookedUntil: bookedUntil
        }
      }
      return spot
    })
    
    // Check if all spots are now booked
    const allBooked = updatedSpots.every(spot => !spot.isAvailable)
    
    await updateDoc(spaceRef, {
      spots: updatedSpots,
      availability: allBooked ? "occupied" : "available"
    })
    
    console.log(`[SpotTracking] Marked spot ${spotLabel} as booked until ${bookedUntil}`)
  } catch (error) {
    console.error("[SpotTracking] Error marking spot as booked:", error)
    throw error
  }
}

/**
 * Free up a spot when booking is completed or cancelled
 */
export async function markSpotAsAvailable(
  db: Firestore,
  spaceId: string,
  spotLabel: string
): Promise<void> {
  try {
    const spaceRef = doc(db, "parkingSpaces", spaceId)
    const spaceDoc = await getDoc(spaceRef)
    
    if (!spaceDoc.exists()) {
      throw new Error("Parking space not found")
    }
    
    const spaceData = spaceDoc.data()
    const spots: ParkingSpot[] = spaceData.spots || []
    
    // Update the specific spot
    const updatedSpots = spots.map(spot => {
      if (spot.label === spotLabel) {
        return {
          ...spot,
          isAvailable: true,
          currentBookingId: undefined,
          bookedUntil: undefined
        }
      }
      return spot
    })
    
    // Update listing availability - at least one spot is available now
    await updateDoc(spaceRef, {
      spots: updatedSpots,
      availability: "available"
    })
    
    console.log(`[SpotTracking] Marked spot ${spotLabel} as available`)
  } catch (error) {
    console.error("[SpotTracking] Error marking spot as available:", error)
    throw error
  }
}

/**
 * Check and update expired bookings (spots that should be available again)
 */
export async function updateExpiredSpots(
  db: Firestore,
  spaceId: string
): Promise<void> {
  try {
    const spaceRef = doc(db, "parkingSpaces", spaceId)
    const spaceDoc = await getDoc(spaceRef)
    
    if (!spaceDoc.exists()) {
      return
    }
    
    const spaceData = spaceDoc.data()
    const spots: ParkingSpot[] = spaceData.spots || []
    const now = new Date()
    
    // Find spots with expired bookings
    const updatedSpots = spots.map(spot => {
      if (!spot.isAvailable && spot.bookedUntil) {
        const bookedUntil = new Date(spot.bookedUntil)
        if (bookedUntil < now) {
          // Booking expired, make spot available
          return {
            ...spot,
            isAvailable: true,
            currentBookingId: undefined,
            bookedUntil: undefined
          }
        }
      }
      return spot
    })
    
    // Check if any spots changed
    const hasChanges = spots.some((spot, index) => 
      spot.isAvailable !== updatedSpots[index].isAvailable
    )
    
    if (hasChanges) {
      await updateDoc(spaceRef, {
        spots: updatedSpots,
        availability: "available" // At least one spot became available
      })
      
      console.log(`[SpotTracking] Updated expired spots for space ${spaceId}`)
    }
  } catch (error) {
    console.error("[SpotTracking] Error updating expired spots:", error)
    throw error
  }
}

/**
 * Get available spots for a time range
 */
export async function getAvailableSpots(
  db: Firestore,
  spaceId: string,
  startTime: Date,
  endTime: Date
): Promise<ParkingSpot[]> {
  try {
    const spaceRef = doc(db, "parkingSpaces", spaceId)
    const spaceDoc = await getDoc(spaceRef)
    
    if (!spaceDoc.exists()) {
      return []
    }
    
    const spaceData = spaceDoc.data()
    const spots: ParkingSpot[] = spaceData.spots || []
    
    // Filter spots that are available or will be available before the requested start time
    return spots.filter(spot => {
      if (spot.isAvailable) {
        return true
      }
      
      if (spot.bookedUntil) {
        const bookedUntil = new Date(spot.bookedUntil)
        return bookedUntil <= startTime
      }
      
      return false
    })
  } catch (error) {
    console.error("[SpotTracking] Error getting available spots:", error)
    return []
  }
}



