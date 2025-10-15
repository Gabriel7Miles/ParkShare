import { type NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, getFirestore } from "firebase/firestore"
import { initializeApp, getApps } from "firebase/app"
import type { MpesaCallbackResponse } from "@/lib/mpesa/types"

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

    // Extract booking ID from MerchantRequestID or CheckoutRequestID
    const bookingId = stkCallback.MerchantRequestID

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const metadata = stkCallback.CallbackMetadata?.Item || []
      const mpesaReceiptNumber = metadata.find((item) => item.Name === "MpesaReceiptNumber")?.Value
      const transactionDate = metadata.find((item) => item.Name === "TransactionDate")?.Value

      // Update booking status
      const bookingRef = doc(db, "bookings", bookingId)
      await updateDoc(bookingRef, {
        paymentStatus: "paid",
        status: "confirmed",
        mpesaReceiptNumber,
        transactionDate,
      })

      console.log("[v0] Payment successful for booking:", bookingId)
    } else {
      // Payment failed
      const bookingRef = doc(db, "bookings", bookingId)
      await updateDoc(bookingRef, {
        paymentStatus: "failed",
        paymentError: stkCallback.ResultDesc,
      })

      console.log("[v0] Payment failed for booking:", bookingId, stkCallback.ResultDesc)
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  } catch (error) {
    console.error("M-Pesa callback error:", error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" }, { status: 500 })
  }
}
