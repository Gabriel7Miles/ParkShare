import { collection, query, where, getDocs, addDoc, doc, getDoc, type Firestore } from "firebase/firestore"
import type { ParkingSpace, Booking } from "@/lib/types/parking"

export async function getParkingSpaces(db: Firestore): Promise<ParkingSpace[]> {
  const spacesRef = collection(db, "parkingSpaces")
  const q = query(spacesRef, where("availability", "==", "available"))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ParkingSpace[]
}

export async function searchParkingSpaces(db: Firestore, searchQuery: string): Promise<ParkingSpace[]> {
  const spacesRef = collection(db, "parkingSpaces")
  const snapshot = await getDocs(spacesRef)

  const spaces = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ParkingSpace[]

  if (!searchQuery) return spaces.filter((s) => s.availability === "available")

  const query = searchQuery.toLowerCase()
  return spaces.filter(
    (space) =>
      space.availability === "available" &&
      (space.address.toLowerCase().includes(query) ||
        space.title.toLowerCase().includes(query) ||
        space.description.toLowerCase().includes(query)),
  )
}

export async function getParkingSpaceById(db: Firestore, id: string): Promise<ParkingSpace | null> {
  const spaceDoc = await getDoc(doc(db, "parkingSpaces", id))
  if (spaceDoc.exists()) {
    return { id: spaceDoc.id, ...spaceDoc.data() } as ParkingSpace
  }
  return null
}

export async function createBooking(db: Firestore, bookingData: Omit<Booking, "id" | "createdAt">): Promise<string> {
  const bookingsRef = collection(db, "bookings")
  const docRef = await addDoc(bookingsRef, {
    ...bookingData,
    createdAt: new Date(),
  })
  return docRef.id
}

export async function getUserBookings(db: Firestore, userId: string): Promise<Booking[]> {
  const bookingsRef = collection(db, "bookings")
  const q = query(bookingsRef, where("driverId", "==", userId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[]
}
