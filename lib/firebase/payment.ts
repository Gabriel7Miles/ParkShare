import { collection, addDoc, updateDoc, doc, getDoc, type Firestore } from "firebase/firestore"
import type { Transaction } from "@/lib/types/payment"

export async function processPayment(
  db: Firestore,
  bookingId: string,
  amount: number,
  phoneNumber: string,
  accountReference: string,
): Promise<{ checkoutRequestId: string; merchantRequestId: string }> {
  try {
    // Initiate M-Pesa STK Push
    const response = await fetch("/api/mpesa/stk-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        amount,
        accountReference,
        transactionDesc: `ParkShare Booking ${bookingId}`,
      }),
    })

    if (!response.ok) {
      throw new Error("Payment initiation failed")
    }

    const data = await response.json()

    // Create transaction record
    const transaction: Omit<Transaction, "id"> = {
      bookingId,
      amount,
      currency: "KES",
      status: "pending",
      paymentMethod: "mpesa",
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      createdAt: new Date(),
    }

    const transactionsRef = collection(db, "transactions")
    await addDoc(transactionsRef, transaction)

    // Update booking payment status to pending
    const bookingRef = doc(db, "bookings", bookingId)
    await updateDoc(bookingRef, {
      paymentStatus: "pending",
      checkoutRequestId: data.CheckoutRequestID,
    })

    return {
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
    }
  } catch (error) {
    console.error("Payment processing error:", error)
    throw error
  }
}

export async function refundPayment(db: Firestore, transactionId: string): Promise<void> {
  const transactionRef = doc(db, "transactions", transactionId)
  await updateDoc(transactionRef, {
    status: "refunded",
  })
}

export async function getTransaction(db: Firestore, transactionId: string): Promise<Transaction | null> {
  const transactionDoc = await getDoc(doc(db, "transactions", transactionId))
  if (transactionDoc.exists()) {
    return { id: transactionDoc.id, ...transactionDoc.data() } as Transaction
  }
  return null
}
