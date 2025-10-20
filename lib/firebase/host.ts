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
  getDoc,
  type Firestore,
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  type FirebaseStorage 
} from "firebase/storage";
import { onSnapshot } from "firebase/firestore";
import type { ParkingSpace, Booking } from "@/lib/types/parking";

// ✅ UTILITY: Remove undefined/null values for Firestore
export function cleanFirestoreData<T extends Record<string, any>>(data: T): Partial<T> {
  const clean: any = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      clean[key] = value;
    }
  });
  return clean;
}

export async function getHostSpaces(db: Firestore, hostId: string, setSpaces: (spaces: ParkingSpace[]) => void): Promise<void> {
  try {
    console.log('[v0] Setting up real-time listener for host spaces:', hostId);
    const spacesRef = collection(db, "parkingSpaces");
    const q = query(spacesRef, where("hostId", "==", hostId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const spaces = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ParkingSpace[];
      console.log(`[v0] Real-time update: Found ${spaces.length} spaces for host ${hostId}`);
      setSpaces(spaces);
    }, (error) => {
      console.error('[v0] Error in real-time listener:', error);
      throw error;
    });

    // Return unsubscribe function to clean up
    return unsubscribe;
  } catch (error) {
    console.error('[v0] Error setting up host spaces listener:', error);
    throw error;
  }
}

// ✅ UPDATED: Create parking space with image uploads to Storage and enforced availability
export async function createParkingSpace(
  db: Firestore,
  storage: FirebaseStorage,
  spaceData: Omit<ParkingSpace, "id" | "createdAt"> & { images?: File[] }
): Promise<string> {
  try {
    console.log('[v0] Creating parking space for host:', spaceData.hostId);

    // Ensure availability is set (default to 'available') and validate
    const cleanData = cleanFirestoreData({
      ...spaceData,
      availability: spaceData.availability || 'available', // Default to 'available'
      images: []
    });
    if (!cleanData.availability || !['available', 'occupied'].includes(cleanData.availability)) {
      throw new Error('Availability must be "available" or "occupied"');
    }

    const spacesRef = collection(db, "parkingSpaces");
    const docRef = await addDoc(spacesRef, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    let imageUrls: string[] = [];
    if (spaceData.images && spaceData.images.length > 0) {
      console.log(`[v0] Uploading ${spaceData.images.length} images for space ${docRef.id}`);
      for (let i = 0; i < spaceData.images.length; i++) {
        const file = spaceData.images[i];
        const storageRef = ref(storage, `parkingSpaces/${docRef.id}/images/image_${i + 1}.${file.name.split('.').pop()}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
      await updateDoc(docRef, {
        images: imageUrls,
        updatedAt: serverTimestamp(),
      });
    }

    console.log('[v0] Parking space created with ID:', docRef.id);
    window.dispatchEvent(new CustomEvent('space:created', { detail: { spaceId: docRef.id } }));
    return docRef.id;
  } catch (error: any) {
    console.error('[v0] Error creating parking space:', error);
    throw new Error(`Failed to create parking space: ${error.message || error}`);
  }
}

export async function updateParkingSpace(
  db: Firestore,
  spaceId: string,
  updates: Partial<ParkingSpace>,
): Promise<void> {
  try {
    const cleanUpdates = cleanFirestoreData(updates);
    
    const spaceRef = doc(db, "parkingSpaces", spaceId);
    await updateDoc(spaceRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    });
    console.log('[v0] Parking space updated:', spaceId);
  } catch (error) {
    console.error('[v0] Error updating parking space:', error);
    throw error;
  }
}

// ✅ UPDATED: Delete parking space and its images
export async function deleteParkingSpace(
  db: Firestore,
  storage: FirebaseStorage,
  spaceId: string
): Promise<void> {
  try {
    const spaceRef = doc(db, "parkingSpaces", spaceId);
    const spaceSnap = await getDoc(spaceRef);
    
    if (spaceSnap.exists()) {
      const spaceData = spaceSnap.data() as ParkingSpace;
      const imageUrls = spaceData.images || [];
      
      // Delete images from storage
      for (const url of imageUrls) {
        try {
          const imageRef = ref(storage, url);
          await deleteObject(imageRef);
          console.log('[v0] Deleted image:', url);
        } catch (deleteError) {
          console.error('[v0] Failed to delete image:', deleteError);
        }
      }
      
      await deleteDoc(spaceRef);
      console.log('[v0] Parking space deleted:', spaceId);
    } else {
      console.log('[v0] Space not found for deletion:', spaceId);
    }
  } catch (error) {
    console.error('[v0] Error deleting parking space:', error);
    throw error;
  }
}

export async function getHostBookings(db: Firestore, hostId: string): Promise<Booking[]> {
  try {
    console.log('[v0] Fetching bookings for host:', hostId);
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("hostId", "==", hostId));
    const snapshot = await getDocs(q);

    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];

    console.log(`[v0] Found ${bookings.length} bookings for host ${hostId}`);
    return bookings;
  } catch (error) {
    console.error('[v0] Error fetching host bookings:', error);
    throw error;
  }
}

export async function updateBookingStatus(
  db: Firestore, 
  bookingId: string, 
  status: Booking["status"]
): Promise<void> {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { 
      status,
      updatedAt: serverTimestamp(),
    });
    console.log('[v0] Booking status updated:', bookingId, status);
  } catch (error) {
    console.error('[v0] Error updating booking status:', error);
    throw error;
  }
}