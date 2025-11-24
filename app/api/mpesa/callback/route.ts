import { type NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, getDoc, getFirestore, collection, query, where, getDocs } from "firebase/firestore"
import { initializeApp, getApps } from "firebase/app"
import type { MpesaCallbackResponse } from "@/lib/mpesa/types"
import { createNotification } from "@/lib/firebase/notifications"

const firebaseConfig = {
  apiKey: "AIzaSyCdTnvORbGpF1Y4X-mjnK-PCf6wGKxpJnE",
  authDomain: "parkshare-626e2.firebaseapp.com",
  projectId: "parkshare-626e2",
  storageBucket: "parkshare-626e2.firebasestorage.app",
  messagingSenderId: "91463875245",
  appId: "1:91463875245:web:9eeb5a43688a9641f9a424",
  measurementId: "G-2TR2WBWPZ9",
}

export async function POST(request: NextRequest) {
  try {
    const data: MpesaCallbackResponse = await request.json()
    const { stkCallback } = data.Body

    console.log("[v0] M-Pesa callback received:", stkCallback)

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
    const db = getFirestore(app)

    // Find booking by MerchantRequestID or CheckoutRequestID
    const merchantRequestId = stkCallback.MerchantRequestID
    const checkoutRequestId = stkCallback.CheckoutRequestID

    // Search for booking by checkoutRequestId (stored in booking document)
    const bookingsRef = collection(db, "bookings")
    const q = query(bookingsRef, where("checkoutRequestId", "==", checkoutRequestId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      console.error("[v0] Booking not found for checkoutRequestId:", checkoutRequestId)
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" }) // Return success to M-Pesa even if booking not found
    }

    const bookingDoc = snapshot.docs[0]
    const bookingId = bookingDoc.id
    const booking = bookingDoc.data()
    const bookingRef = doc(db, "bookings", bookingId)

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const mpesaReceiptNumber = metadata.find((item) => item.Name === "MpesaReceiptNumber")?.Value
      const transactionDate = metadata.find((item) => item.Name === "TransactionDate")?.Value

      // Update booking status
      await updateDoc(bookingRef, {
        paymentStatus: "paid",
        status: "confirmed",
        mpesaReceiptNumber,
        transactionDate,
      })

      // Send notifications
      await createNotification(
        db,
        booking.driverId,
        "payment_received",
        "Payment Successful",
        `Your payment of KES ${booking.totalPrice} for booking ${bookingId.substring(0, 8)} has been received.`,
        bookingId,
        booking.spaceId
      )

      await createNotification(
        db,
        booking.hostId,
        "payment_received",
        "Payment Received",
        `You received KES ${booking.totalPrice} for booking ${bookingId.substring(0, 8)}.`,
        bookingId,
        booking.spaceId
      )

      console.log("[v0] Payment successful for booking:", bookingId)
    } else {
      // Payment failed
      await updateDoc(bookingRef, {
        paymentStatus: "failed",
        paymentError: stkCallback.ResultDesc,
      })

      // Send notification to driver
      await createNotification(
        db,
        booking.driverId,
        "payment_failed",
        "Payment Failed",
        `Payment for booking ${bookingId.substring(0, 8)} failed: ${stkCallback.ResultDesc}. Please try again.`,
        bookingId,
        booking.spaceId
      )

      console.log("[v0] Payment failed for booking:", bookingId, stkCallback.ResultDesc)
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  } catch (error) {
    console.error("M-Pesa callback error:", error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" }, { status: 500 })
  }
}
