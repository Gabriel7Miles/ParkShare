import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { releaseSpot } from "./spot-reservation";
import type { Booking } from "@/lib/types/parking";

/**
 * Auto-release parking spots for expired bookings
 * This should be called periodically (e.g., every minute via a cron job or client-side interval)
 */
export async function autoReleaseExpiredBookings(db: Firestore): Promise<void> {
  try {
    const now = new Date();
    const bookingsRef = collection(db, "bookings");
    
    // Find all active bookings that have expired
    const q = query(
      bookingsRef,
      where("status", "in", ["confirmed", "active"]),
      where("endTime", "<=", now)
    );

    const snapshot = await getDocs(q);
    const expiredBookings: Booking[] = [];

    snapshot.forEach((doc) => {
      const booking = { id: doc.id, ...doc.data() } as Booking;
      const endTime = booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime);
      
      if (endTime <= now) {
        expiredBookings.push(booking);
      }
    });

    console.log(`[AutoRelease] Found ${expiredBookings.length} expired bookings`);

    // Release spots and update booking status
    for (const booking of expiredBookings) {
      try {
        // Release the spot
        await releaseSpot(db, booking.spaceId, booking.spotLabel);

        // Update booking status to completed
        const bookingRef = doc(db, "bookings", booking.id);
        await updateDoc(bookingRef, {
          status: "completed" as const,
          updatedAt: serverTimestamp(),
        });

        console.log(`[AutoRelease] Released spot ${booking.spotLabel} for booking ${booking.id}`);
      } catch (error) {
        console.error(`[AutoRelease] Error releasing booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[AutoRelease] Error in auto-release process:", error);
    throw error;
  }
}

/**
 * Set up auto-release interval (client-side)
 * Note: For production, this should be done server-side via a cron job or Cloud Functions
 */
export function setupAutoReleaseInterval(db: Firestore, intervalMs: number = 60000): () => void {
  console.log("[AutoRelease] Setting up auto-release interval (every", intervalMs / 1000, "seconds)");
  
  // Run immediately
  autoReleaseExpiredBookings(db).catch(console.error);

  // Then run at intervals
  const intervalId = setInterval(() => {
    autoReleaseExpiredBookings(db).catch(console.error);
  }, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log("[AutoRelease] Auto-release interval stopped");
  };
}

