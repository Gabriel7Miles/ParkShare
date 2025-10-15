"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, ThumbsUp, Flag } from "lucide-react"
import type { Review } from "@/lib/types/review"
import { format } from "date-fns"
import { markReviewHelpful, reportReview } from "@/lib/firebase/reviews"
import { useToast } from "@/hooks/use-toast"

interface ReviewListProps {
  reviews: Review[]
  onReviewUpdate?: () => void
}

export function ReviewList({ reviews, onReviewUpdate }: ReviewListProps) {
  const { toast } = useToast()

  const handleHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId)
      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded",
      })
      onReviewUpdate?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleReport = async (reviewId: string) => {
    if (!confirm("Are you sure you want to report this review?")) return

    try {
      await reportReview(reviewId)
      toast({
        title: "Review reported",
        description: "We'll review this report shortly",
      })
      onReviewUpdate?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No reviews yet</p>
          <p className="text-sm text-muted-foreground">Be the first to leave a review</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">
                  {review.driverName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{review.driverName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(review.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm leading-relaxed">{review.comment}</p>

                <div className="flex items-center gap-4 pt-2">
                  <Button variant="ghost" size="sm" className="gap-2 h-8" onClick={() => handleHelpful(review.id)}>
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs">Helpful ({review.helpful})</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 h-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleReport(review.id)}
                  >
                    <Flag className="w-4 h-4" />
                    <span className="text-xs">Report</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
