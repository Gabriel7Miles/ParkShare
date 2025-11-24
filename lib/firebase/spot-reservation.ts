import { doc, updateDoc, getDoc, serverTimestamp, deleteField, type Firestore } from "firebase/firestore";
import type { ParkingSpace, ParkingSpot } from "@/lib/types/parking";

/**
 * Reserve a parking spot temporarily (for cart items)
 * This marks the spot as unavailable until the reservation expires or is confirmed
 */
export async function reserveSpot(
  db: Firestore,
  spaceId: string,
  spotLabel: string,
  reservedUntil: Date
): Promise<void> {
  try {
    const spaceRef = doc(db, "parkingSpaces", spaceId);
    const spaceDoc = await getDoc(spaceRef);
    
    if (!spaceDoc.exists()) {
      throw new Error("Parking space not found");
    }

    const space = spaceDoc.data() as ParkingSpace;
    const spots = space.spots || [];
    const spotIndex = spots.findIndex((s) => s.label === spotLabel);

    if (spotIndex === -1) {
      throw new Error(`Spot ${spotLabel} not found`);
    }

    const updatedSpots = [...spots];
    updatedSpots[spotIndex] = {
      ...updatedSpots[spotIndex],
      isAvailable: false,
      bookedUntil: reservedUntil,
    };

    // Check if all spots are now unavailable
    const allUnavailable = updatedSpots.every((s) => !s.isAvailable);
    const availability = allUnavailable ? "occupied" : "available";

    await updateDoc(spaceRef, {
      spots: updatedSpots,
      availability,
      updatedAt: serverTimestamp(),
    });

    console.log(`[SpotReservation] Reserved spot ${spotLabel} in space ${spaceId} until ${reservedUntil}`);
  } catch (error) {
    console.error("[SpotReservation] Error reserving spot:", error);
    throw error;
  }
}

/**
 * Release a reserved spot (if payment fails or cart expires)
 */
export async function releaseSpot(
  db: Firestore,
  spaceId: string,
  spotLabel: string
): Promise<void> {
  try {
    const spaceRef = doc(db, "parkingSpaces", spaceId);
    const spaceDoc = await getDoc(spaceRef);
    
    if (!spaceDoc.exists()) {
      throw new Error("Parking space not found");
    }

    const space = spaceDoc.data() as ParkingSpace;
    const spots = space.spots || [];
    const spotIndex = spots.findIndex((s) => s.label === spotLabel);

    if (spotIndex === -1) {
      throw new Error(`Spot ${spotLabel} not found`);
    }

    const updatedSpots = [...spots];
    const originalSpot = updatedSpots[spotIndex];
    
    // Reconstruct spot object without optional fields that should be removed
    const spotToUpdate: ParkingSpot = {
      label: originalSpot.label,
      isAvailable: true,
    };
    
    // Only include optional fields if they exist and are relevant
    // Don't include bookedUntil or currentBookingId when releasing
    
    updatedSpots[spotIndex] = spotToUpdate;

    // Check if space should be available again
    const hasAvailableSpots = updatedSpots.some((s) => s.isAvailable);
    const availability = hasAvailableSpots ? "available" : "occupied";

    // Build update data - ensure we don't include undefined values
    const updateData: any = {
      spots: updatedSpots,
      availability,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(spaceRef, updateData);

    console.log(`[SpotReservation] Released spot ${spotLabel} in space ${spaceId}`);
  } catch (error) {
    console.error("[SpotReservation] Error releasing spot:", error);
    throw error;
  }
}

