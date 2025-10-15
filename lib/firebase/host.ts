// lib/firebase/host.ts
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore"
import type { ParkingSpace, Booking } from "@/lib/types/parking"

// ✅ UTILITY: Remove undefined/null values for Firestore
export function cleanFirestoreData<T extends Record<string, any>>(data: T): Partial<T> {
  const clean: any = {}
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      clean[key] = value
    }
  })
  return clean
}

export async function getHostSpaces(db: Firestore, hostId: string): Promise<ParkingSpace[]> {
  try {
    console.log('[v0] Fetching spaces for host:', hostId)
    const spacesRef = collection(db, "parkingSpaces")
    const q = query(spacesRef, where("hostId", "==", hostId))
    const snapshot = await getDocs(q)

    const spaces = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ParkingSpace[]

    console.log(`[v0] Found ${spaces.length} spaces for host ${hostId}`)
    return spaces
  } catch (error) {
    console.error('[v0] Error fetching host spaces:', error)
    throw error
  }
}

export async function createParkingSpace(
  db: Firestore,
  spaceData: Omit<ParkingSpace, "id" | "createdAt">,
): Promise<string> {
  try {
    console.log('[v0] Creating parking space for host:', spaceData.hostId)
    
    // ✅ CLEAN DATA: Remove undefined values
    const cleanData = cleanFirestoreData(spaceData)
    
    const spacesRef = collection(db, "parkingSpaces")
    const docRef = await addDoc(spacesRef, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    console.log('[v0] Parking space created with ID:', docRef.id)
    return docRef.id
  } catch (error: any) {
    console.error('[v0] Error creating parking space:', error)
    throw new Error(`Failed to create parking space: ${error.message || error}`)
  }
}

export async function updateParkingSpace(
  db: Firestore,
  spaceId: string,
  updates: Partial<ParkingSpace>,
): Promise<void> {
  try {
    // ✅ CLEAN UPDATES
    const cleanUpdates = cleanFirestoreData(updates)
    
    const spaceRef = doc(db, "parkingSpaces", spaceId)
    await updateDoc(spaceRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    })
    console.log('[v0] Parking space updated:', spaceId)
  } catch (error) {
    console.error('[v0] Error updating parking space:', error)
    throw error
  }
}

export async function deleteParkingSpace(db: Firestore, spaceId: string): Promise<void> {
  try {
    const spaceRef = doc(db, "parkingSpaces", spaceId)
    await deleteDoc(spaceRef)
    console.log('[v0] Parking space deleted:', spaceId)
  } catch (error) {
    console.error('[v0] Error deleting parking space:', error)
    throw error
  }
}

export async function getHostBookings(db: Firestore, hostId: string): Promise<Booking[]> {
  try {
    console.log('[v0] Fetching bookings for host:', hostId)
    const bookingsRef = collection(db, "bookings")
    const q = query(bookingsRef, where("hostId", "==", hostId))
    const snapshot = await getDocs(q)

    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[]

    console.log(`[v0] Found ${bookings.length} bookings for host ${hostId}`)
    return bookings
  } catch (error) {
    console.error('[v0] Error fetching host bookings:', error)
    throw error
  }
}

export async function updateBookingStatus(
  db: Firestore, 
  bookingId: string, 
  status: Booking["status"]
): Promise<void> {
  try {
    const bookingRef = doc(db, "bookings", bookingId)
    await updateDoc(bookingRef, { 
      status,
      updatedAt: serverTimestamp(),
    })
    console.log('[v0] Booking status updated:', bookingId, status)
  } catch (error) {
    console.error('[v0] Error updating booking status:', error)
    throw error
  }
}