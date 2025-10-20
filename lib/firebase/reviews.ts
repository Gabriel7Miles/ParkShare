import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  increment,
  type Firestore,
} from "firebase/firestore"
import { Timestamp } from "firebase/firestore"
import type { Review, ReviewStats } from "@/lib/types/review"

export async function createReview(
  db: Firestore,
  reviewData: Omit<Review, "id" | "createdAt" | "helpful" | "reported">
): Promise<string> {
  if (!db) {
    console.error("[Reviews] Firestore instance not available")
    throw new Error("Firestore not initialized")
  }

  try {
    const reviewsRef = collection(db, "reviews")
    console.log("[Reviews] Creating review for space:", reviewData.spaceId)
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      createdAt: new Date(),
      helpful: 0,
      reported: false,
    })

    await updateSpaceRating(db, reviewData.spaceId)
    console.log("[Reviews] Review created with ID:", docRef.id)

    return docRef.id
  } catch (error) {
    console.error("[Reviews] Error creating review:", error)
    throw error
  }
}

export async function getSpaceReviews(db: Firestore, spaceId: string): Promise<Review[]> {
  if (!db) {
    console.error("[Reviews] Firestore instance not available")
    throw new Error("Firestore not initialized")
  }

  try {
    console.log("[Reviews] Fetching reviews for space:", spaceId)
    const reviewsRef = collection(db, "reviews")
    const q = query(reviewsRef, where("spaceId", "==", spaceId))
    const snapshot = await getDocs(q)
    const reviews = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      } as Review
    })
    console.log("[Reviews] Found", reviews.length, "reviews for space:", spaceId)
    return reviews
  } catch (error) {
    console.error("[Reviews] Error fetching reviews:", error)
    throw error
  }
}

export async function getDriverReviews(db: Firestore, driverId: string): Promise<Review[]> {
  if (!db) {
    console.error("[Reviews] Firestore instance not available")
    throw new Error("Firestore not initialized")
  }

  try {
    console.log("[Reviews] Fetching reviews for driver:", driverId)
    const reviewsRef = collection(db, "reviews")
    const q = query(reviewsRef, where("driverId", "==", driverId))
    const snapshot = await getDocs(q)
    const reviews = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      } as Review
    })
    console.log("[Reviews] Found", reviews.length, "reviews for driver:", driverId)
    return reviews
  } catch (error) {
    console.error("[Reviews] Error fetching driver reviews:", error)
    throw error
  }
}

export async function markReviewHelpful(db: Firestore, reviewId: string): Promise<void> {
  if (!db) {
    console.error("[Reviews] Firestore instance not available")
    throw new Error("Firestore not initialized")
  }

  if (!reviewId) {
    console.error("[Reviews] Invalid reviewId: undefined")
    throw new Error("Invalid review ID")
  }

  try {
    console.log("[Reviews] Marking review helpful:", reviewId)
    const reviewRef = doc(db, "reviews", reviewId)
    await updateDoc(reviewRef, {
      helpful: increment(1),
    })
    console.log("[Reviews] Review marked helpful:", reviewId)
  } catch (error) {
    console.error("[Reviews] Error marking review helpful:", error)
    throw error
  }
}

export async function reportReview(db: Firestore, reviewId: string): Promise<void> {
  if (!db) {
    console.error("[Reviews] Firestore instance not available")
    throw new Error("Firestore not initialized")
  }

  if (!reviewId) {
    console.error("[Reviews] Invalid reviewId: undefined")
    throw new Error("Invalid review ID")
  }

  try {
    console.log("[Reviews] Reporting review:", reviewId)
    const reviewRef = doc(db, "reviews", reviewId)
    await updateDoc(reviewRef, {
      reported: true,
    })
    console.log("[Reviews] Review reported:", reviewId)
  } catch (error) {
    console.error("[Reviews] Error reporting review:", error)
    throw error
  }
}

async function updateSpaceRating(db: Firestore, spaceId: string): Promise<void> {
  if (!db) {
    console.error("[Reviews] Firestore instance not available")
    throw new Error("Firestore not initialized")
  }

  try {
    console.log("[Reviews] Updating rating for space:", spaceId)
    const reviews = await getSpaceReviews(db, spaceId)

    if (reviews.length === 0) {
      console.log("[Reviews] No reviews found for space:", spaceId)
      return
    }

    const averageRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
    const spaceRef = doc(db, "parkingSpaces", spaceId)
    await updateDoc(spaceRef, {
      rating: averageRating,
      reviewCount: reviews.length,
    })
    console.log("[Reviews] Updated space rating to", averageRating, "for space:", spaceId)
  } catch (error) {
    console.error("[Reviews] Error updating space rating:", error)
    throw error
  }
}

export async function getReviewStats(db: Firestore, spaceId: string): Promise<ReviewStats> {
  if (!db) {
    console.error("[Reviews] Firestore instance not available")
    throw new Error("Firestore not initialized")
  }

  try {
    console.log("[Reviews] Fetching review stats for space:", spaceId)
    const reviews = await getSpaceReviews(db, spaceId)

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    }

    reviews.forEach((review) => {
      const rating = Math.floor(review.rating) as keyof typeof distribution
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++
      }
    })

    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length : 0

    const stats: ReviewStats = {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      ratingDistribution: distribution,
    }
    console.log("[Reviews] Calculated stats:", stats)
    return stats
  } catch (error) {
    console.error("[Reviews] Error fetching review stats:", error)
    throw error
  }
}