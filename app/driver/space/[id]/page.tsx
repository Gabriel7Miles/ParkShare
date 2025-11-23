"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { DriverDashboardNav } from "@/components/driver/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getParkingSpaceById } from "@/lib/firebase/parking"
import { getSpaceReviews, getReviewStats, createReview } from "@/lib/firebase/reviews"
import type { ParkingSpace } from "@/lib/types/parking"
import type { Review, ReviewStats } from "@/lib/types/review"
import { MapPin, DollarSign, Star, Loader2, ArrowLeft, Send, Navigation } from "lucide-react"
import { ReviewList } from "@/components/reviews/review-list"
import { ReviewStatsCard } from "@/components/reviews/review-stats"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useFirebase } from "@/contexts/firebase-context"

export default function SpaceDetailsPage() {
  const params = useParams()
  const { db } = useFirebase()
  const [space, setSpace] = useState<ParkingSpace | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { user, userProfile } = useAuth()
  const { toast } = useToast()

  const loadSpaceDetails = useCallback(async () => {
    if (!db) {
      console.error("[Space Details] Firestore not initialized")
      setLoading(false)
      toast({
        title: "Error",
        description: "Firestore not initialized. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    const id = params.id as string | undefined
    if (!id) {
      console.error("[Space Details] Invalid or undefined space ID:", params.id)
      setLoading(false)
      toast({
        title: "Error",
        description: "Invalid space ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const spaceData = await getParkingSpaceById(db, id)
      if (!spaceData) {
        console.warn("[Space Details] Space not found for ID:", id)
        setLoading(false)
        return
      }
      setSpace(spaceData)

      try {
        const reviewsData = await getSpaceReviews(db, id)
        const statsData = await getReviewStats(db, id)
        setReviews(reviewsData)
        setStats(statsData)
      } catch (reviewError) {
        console.warn("[Space Details] Unable to load reviews or stats:", reviewError)
      }
    } catch (error) {
      console.error("[Space Details] Error loading space details:", error)
      toast({
        title: "Error",
        description: "Failed to load space details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [db, params.id, toast])

  useEffect(() => {
    loadSpaceDetails()
  }, [loadSpaceDetails])

  const handleSubmitReview = async () => {
    if (!user || !userProfile || rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      })
      return
    }

    if (!db || !params.id) {
      toast({
        title: "Error",
        description: "Firestore or space ID not available",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      await createReview(db, {
        spaceId: params.id as string,
        driverId: user.uid,
        driverName: userProfile.displayName || "Anonymous",
        hostId: space?.hostId || "",
        bookingId: "",
        rating,
        comment,
      })

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback",
      })

      setRating(0)
      setComment("")
      await loadSpaceDetails()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DriverDashboardNav />
        <div className="pt-16 flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-background">
        <DriverDashboardNav />
        <div className="pt-16 container mx-auto p-4">
          <p>Space not found</p>
          <Link href="/driver/dashboard">
            <Button variant="ghost" className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <DriverDashboardNav />

      <div className="pt-16">
        <div className="container mx-auto p-4 max-w-4xl">
          <Link href="/driver/dashboard">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>
          </Link>

          <div className="space-y-6">
            {/* Space Images */}
            {space.images && space.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {space.images.map((image, index) => (
                  <img
                    key={index}
                    src={image || "/placeholder.svg?height=300&width=400"}
                    alt={`${space.title} - Image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Space Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2 font-sans">{space.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      {space.address}
                    </div>
                    {space.hostId && (
                      <Link href={`/host/profile/${space.hostId}`}>
                        <Button variant="link" className="px-0 h-auto text-sm text-primary hover:underline">
                          View host profile →
                        </Button>
                      </Link>
                    )}
                  </div>
                  <Badge className="bg-success">Available</Badge>
                </div>

                <div className="flex items-center gap-4 mb-6 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <span className="font-semibold">{space.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({space.reviewCount || 0} reviews)</span>
                  </div>
                  <Badge variant="outline">{space.spaceType}</Badge>
                  {space.totalSpots && <Badge variant="secondary">{space.totalSpots} spaces available</Badge>}
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">{space.description}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {space.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-6 h-6 text-primary" />
                      <span className="text-3xl font-bold text-primary">KES {space.pricePerHour}/hr</span>
                    </div>
                    {space.pricePerDay && <p className="text-sm text-muted-foreground">KES {space.pricePerDay}/day</p>}
                    {space.pricePerMonth && (
                      <p className="text-sm text-muted-foreground">KES {space.pricePerMonth}/month</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${space.location.lat},${space.location.lng}`
                        window.open(url, "_blank")
                      }}
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </Button>
                    <Button size="lg" className="bg-success hover:bg-success/90">
                      Book Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Stats */}
            {stats && <ReviewStatsCard stats={stats} />}

            {/* Add Review */}
            {user && userProfile?.roles?.includes("driver") && (
              <Card>
                <CardHeader>
                  <CardTitle>Leave a Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Rating</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Comment</p>
                    <Textarea
                      placeholder="Share your experience with this parking space..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitting || rating === 0}
                    className="w-full bg-success hover:bg-success/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <div>
              <h2 className="text-2xl font-bold mb-4 font-sans">Reviews ({reviews.length})</h2>
              <ReviewList reviews={reviews} onReviewUpdate={loadSpaceDetails} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}