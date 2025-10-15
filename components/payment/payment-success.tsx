"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Calendar, Clock } from "lucide-react"
import type { Booking } from "@/lib/types/parking"
import { format } from "date-fns"

interface PaymentSuccessProps {
  booking: Booking
  onViewBooking: () => void
  onDownloadReceipt: () => void
}

export function PaymentSuccess({ booking, onViewBooking, onDownloadReceipt }: PaymentSuccessProps) {
  const isPending = booking.paymentStatus === "pending"

  return (
    <Card className={isPending ? "border-[#ff9933]" : "border-[#66cc66]"}>
      <CardHeader className="text-center">
        <div
          className={`w-16 h-16 rounded-full ${isPending ? "bg-[#ff9933]/10" : "bg-[#66cc66]/10"} flex items-center justify-center mx-auto mb-4`}
        >
          {isPending ? (
            <Clock className="w-10 h-10 text-[#ff9933]" />
          ) : (
            <CheckCircle className="w-10 h-10 text-[#66cc66]" />
          )}
        </div>
        <CardTitle className="text-2xl">{isPending ? "Payment Initiated!" : "Payment Successful!"}</CardTitle>
        <CardDescription>
          {isPending ? "Please complete the payment on your phone" : "Your parking space has been reserved"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPending && (
          <div className="bg-[#ff9933]/10 border border-[#ff9933]/30 rounded-lg p-4">
            <p className="text-sm text-center text-[#003366]">
              <strong>Action Required:</strong> Check your phone for the M-Pesa prompt and enter your PIN to complete
              the payment. Your booking will be confirmed once payment is received.
            </p>
          </div>
        )}

        <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Booking ID</span>
            <span className="font-medium">#{booking.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className={`font-bold ${isPending ? "text-[#ff9933]" : "text-[#66cc66]"}`}>
              ${booking.totalPrice.toFixed(2)} (KES {Math.round(booking.totalPrice * 130).toLocaleString()})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment Status</span>
            <span className={`font-medium ${isPending ? "text-[#ff9933]" : "text-[#66cc66]"}`}>
              {isPending ? "Pending" : "Paid"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Start Time</span>
            <span className="font-medium">{format(new Date(booking.startTime), "MMM dd, yyyy h:mm a")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">End Time</span>
            <span className="font-medium">{format(new Date(booking.endTime), "MMM dd, yyyy h:mm a")}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full bg-[#003366] hover:bg-[#003366]/90" onClick={onViewBooking}>
            <Calendar className="w-4 h-4 mr-2" />
            View Booking Details
          </Button>
          {!isPending && (
            <Button variant="outline" className="w-full bg-transparent" onClick={onDownloadReceipt}>
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          )}
        </div>

        <div className="bg-[#003366]/10 p-4 rounded-lg">
          <p className="text-sm text-center text-[#003366]">
            {isPending
              ? "You will receive a confirmation SMS and email once your payment is processed successfully."
              : "A confirmation email has been sent to your registered email address with all the booking details."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
