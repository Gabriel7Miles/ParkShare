"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { DriverDashboardNav } from "@/components/driver/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, DollarSign, Star, Loader2, ArrowLeft, Send, Navigation } from "lucide-react";
import Link from "next/link";

import { getParkingSpaceById } from "@/lib/firebase/parking";
import { getSpaceReviews, getReviewStats, createReview } from "@/lib/firebase/reviews";
import type { ParkingSpace } from "@/lib/types/parking";
import type { Review, ReviewStats } from "@/lib/types/review";

import { ReviewList } from "@/components/reviews/review-list";
import { ReviewStatsCard } from "@/components/reviews/review-stats";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/contexts/firebase-context";

function SpaceDetailsPage() {
  const params = useParams();
  const { db } = useFirebase();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [space, setSpace] = useState<ParkingSpace | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const spaceId = params.id as string;

  const loadSpaceDetails = useCallback(async () => {
    if (!db || !spaceId) {
      toast({
        title: "Error",
        description: "Missing Firestore instance or space ID",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const spaceData = await getParkingSpaceById(db, spaceId);
      if (!spaceData) {
        toast({ title: "Not Found", description: "Parking space not found", variant: "destructive" });
        setLoading(false);
        return;
      }
      setSpace(spaceData);

      const [reviewsData, statsData] = await Promise.all([
        getSpaceReviews(db, spaceId).catch(() => []),
        getReviewStats(db, spaceId).catch(() => null),
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (err) {
      console.error("[SpaceDetails] Load error:", err);
      toast({
        title: "Error",
        description: "Failed to load space details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [db, spaceId, toast]);

  useEffect(() => {
    loadSpaceDetails();
  }, [loadSpaceDetails]);

  const handleSubmitReview = async () => {
    if (!user || rating === 0) {
      toast({ title: "Required", description: "Please select a rating", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await createReview(db!, {
        spaceId,
        driverId: user.uid,
        driverName: userProfile?.displayName || "Anonymous",
        hostId: space?.hostId || "",
        bookingId: "", // can be filled later if needed
        rating,
        comment,
      });

      toast({ title: "Success", description: "Review submitted!" });
      setRating(0);
      setComment("");
      await loadSpaceDetails();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DriverDashboardNav />
        <div className="pt-16 flex items-center justify-center h-96">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // ─── Not Found ───
  if (!space) {
    return (
      <div className="min-h-screen bg-background">
        <DriverDashboardNav />
        <div className="pt-16 container mx-auto p-6 text-center">
          <p className="text-xl mb-4">Parking space not found</p>
          <Link href="/driver/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Render ───
  return (
    <div className="min-h-screen bg-background pb-12">
      <DriverDashboardNav />

      <div className="pt-16 container mx-auto p-4 max-w-5xl">
        <Link href="/driver/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </Link>

        <div className="space-y-8">
          {/* Images */}
          {space.images?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl overflow-hidden">
              {space.images.map((url, i) => (
                <img key={i} src={url} alt={`Image ${i + 1}`} className="w-full h-64 object-cover" />
              ))}
            </div>
          ) : null}

          {/* Details Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{space.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    {space.address}
                  </div>

                  {/* RESTORED: View host profile link */}
                  {space.hostId && (
                    <Link href={`/host/profile/${space.hostId}`} className="text-sm">
                      <Button variant="link" className="h-auto p-0 text-primary hover:underline">
                        View host profile →
                      </Button>
                    </Link>
                  )}
                </div>
                <Badge className="bg-green-600 text-white">Available</Badge>
              </div>

              <div className="flex items-center gap-4 my-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold">{space.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({space.reviewCount || 0})</span>
                </div>
                <Badge variant="outline">{space.spaceType}</Badge>
              </div>

              <p className="text-muted-foreground mb-6">{space.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {space.features?.map((f) => (
                  <Badge key={f} variant="secondary">{f}</Badge>
                ))}
              </div>

              <div className="flex justify-between items-end border-t pt-6">
                <div>
                  <p className="text-3xl font-bold text-primary">KES {space.pricePerHour}/hr</p>
                  {space.pricePerDay && <p className="text-muted-foreground">KES {space.pricePerDay}/day</p>}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${space.location.lat},${space.location.lng}`,
                        "_blank"
                      )
                    }
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    Book Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Stats */}
          {stats && <ReviewStatsCard stats={stats} />}

          {/* Submit Review */}
          {user && userProfile?.roles?.includes("driver") && (
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="font-medium mb-3">Your Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} onClick={() => setRating(v)}>
                        <Star
                          className={`w-10 h-10 transition-all ${
                            v <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />

                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting || rating === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
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
            <h2 className="text-2xl font-bold mb-6">Reviews ({reviews.length})</h2>
            <ReviewList reviews={reviews} onReviewUpdate={loadSpaceDetails} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpaceDetailsPage;