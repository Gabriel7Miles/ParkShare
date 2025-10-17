// lib/firebase/parking.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  orderBy,
  limit,
  type Firestore 
} from "firebase/firestore"
import type { ParkingSpace, Booking } from "@/lib/types/parking"

export async function getParkingSpaces(db: Firestore): Promise<ParkingSpace[]> {
  try {
    console.log('[Parking] Fetching available spaces...')
    const spacesRef = collection(db, "parkingSpaces")
    const q = query(
      spacesRef, 
      where("availability", "==", "available"),
      orderBy("createdAt", "desc"),
      limit(100)
    )
    const snapshot = await getDocs(q)

    const spaces = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ParkingSpace[]

    console.log(`[Parking] Found ${spaces.length} available spaces`)
    return spaces
  } catch (error) {
    console.error('[Parking] Error fetching spaces:', error)
    throw error
  }
}

export async function searchParkingSpaces(db: Firestore, searchQuery: string): Promise<ParkingSpace[]> {
  try {
    console.log('[Parking] Searching spaces:', searchQuery)
    const spacesRef = collection(db, "parkingSpaces")
    
    // First get all available spaces
    const q = query(
      spacesRef, 
      where("availability", "==", "available")
    )
    const snapshot = await getDocs(q)

    let spaces = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ParkingSpace[]

    // Client-side search filtering
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase()
      spaces = spaces.filter((space) =>
        (space.title?.toLowerCase().includes(queryLower) ||
         space.address?.toLowerCase().includes(queryLower) ||
         space.description?.toLowerCase().includes(queryLower))
      )
    }

    console.log(`[Parking] Search returned ${spaces.length} spaces`)
    return spaces
  } catch (error) {
    console.error('[Parking] Search error:', error)
    throw error
  }
}

export async function getParkingSpaceById(db: Firestore, id: string): Promise<ParkingSpace | null> {
  try {
    console.log('[Parking] Fetching space by ID:', id)
    const spaceDoc = await getDoc(doc(db, "parkingSpaces", id))
    if (spaceDoc.exists()) {
      const space = { id: spaceDoc.id, ...spaceDoc.data() } as ParkingSpace
      console.log('[Parking] Found space:', space.title)
      return space
    }
    console.log('[Parking] Space not found:', id)
    return null
  } catch (error) {
    console.error('[Parking] Error fetching space:', error)
    throw error
  }
}

export async function createBooking(
  db: Firestore, 
  bookingData: Omit<Booking, "id" | "createdAt">,
  serverTimestamp: any // Import from host.ts if needed
): Promise<string> {
  try {
    console.log('[Parking] Creating booking for space:', bookingData.spaceId)
    const bookingsRef = collection(db, "bookings")
    const docRef = await addDoc(bookingsRef, {
      ...bookingData,
      createdAt: serverTimestamp ? serverTimestamp() : new Date(),
      status: "pending" as const,
    })
    console.log('[Parking] Booking created:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('[Parking] Error creating booking:', error)
    throw error
  }
}

export async function getUserBookings(db: Firestore, userId: string): Promise<Booking[]> {
  try {
    console.log('[Parking] Fetching bookings for user:', userId)
    const bookingsRef = collection(db, "bookings")
    const q = query(bookingsRef, where("driverId", "==", userId))
    const snapshot = await getDocs(q)

    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[]

    console.log(`[Parking] Found ${bookings.length} bookings for user ${userId}`)
    return bookings
  } catch (error) {
    console.error('[Parking] Error fetching user bookings:', error)
    throw error
  }
}

// ✅ NEW: Get spaces by location proximity (for map filtering)
export async function getSpacesNearLocation(
  db: Firestore, 
  lat: number, 
  lng: number, 
  radius: number = 10 // km
): Promise<ParkingSpace[]> {
  try {
    // Note: Firestore GeoQueries require GeoFirestore or client-side filtering
    // For now, get all available and filter client-side
    const spaces = await getParkingSpaces(db)
    
    // Simple distance filter (Haversine formula approximation)
    const spacesInRadius = spaces.filter(space => {
      if (!space.location?.lat || !space.location?.lng) return false
      
      const distance = getDistance(
        { lat, lng },
        { lat: space.location.lat, lng: space.location.lng }
      )
      
      return distance <= radius
    })
    
    console.log(`[Parking] Found ${spacesInRadius.length} spaces within ${radius}km`)
    return spacesInRadius
  } catch (error) {
    console.error('[Parking] Error fetching nearby spaces:', error)
    throw error
  }
}

// ✅ HELPER: Haversine distance calculation
function getDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371 // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}