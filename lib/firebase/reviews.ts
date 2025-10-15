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
import type { Review, ReviewStats } from "@/lib/types/review"

export async function createReview(
  db: Firestore,
  reviewData: Omit<Review, "id" | "createdAt" | "helpful" | "reported">,
): Promise<string> {
  const reviewsRef = collection(db, "reviews")
  const docRef = await addDoc(reviewsRef, {
    ...reviewData,
    createdAt: new Date(),
    helpful: 0,
    reported: false,
  })

  // Update space rating
  await updateSpaceRating(db, reviewData.spaceId)

  return docRef.id
}

export async function getSpaceReviews(db: Firestore, spaceId: string): Promise<Review[]> {
  const reviewsRef = collection(db, "reviews")
  const q = query(reviewsRef, where("spaceId", "==", spaceId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[]
}

export async function getDriverReviews(db: Firestore, driverId: string): Promise<Review[]> {
  const reviewsRef = collection(db, "reviews")
  const q = query(reviewsRef, where("driverId", "==", driverId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[]
}

export async function markReviewHelpful(db: Firestore, reviewId: string): Promise<void> {
  const reviewRef = doc(db, "reviews", reviewId)
  await updateDoc(reviewRef, {
    helpful: increment(1),
  })
}

export async function reportReview(db: Firestore, reviewId: string): Promise<void> {
  const reviewRef = doc(db, "reviews", reviewId)
  await updateDoc(reviewRef, {
    reported: true,
  })
}

async function updateSpaceRating(db: Firestore, spaceId: string): Promise<void> {
  const reviews = await getSpaceReviews(db, spaceId)

  if (reviews.length === 0) return

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  const spaceRef = doc(db, "parkingSpaces", spaceId)
  await updateDoc(spaceRef, {
    rating: averageRating,
    reviewCount: reviews.length,
  })
}

export async function getReviewStats(db: Firestore, spaceId: string): Promise<ReviewStats> {
  const reviews = await getSpaceReviews(db, spaceId)

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  }

  reviews.forEach((review) => {
    distribution[review.rating as keyof typeof distribution]++
  })

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution: distribution,
  }
}
