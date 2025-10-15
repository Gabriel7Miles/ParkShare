export interface PaymentMethod {
  id: string
  type: "card" | "paypal" | "bank" | "mpesa"
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  phoneNumber?: string
  isDefault: boolean
}

export interface Transaction {
  id: string
  bookingId: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded"
  paymentMethod: string
  checkoutRequestId?: string
  merchantRequestId?: string
  mpesaReceiptNumber?: string
  transactionDate?: string | number
  createdAt: Date
  completedAt?: Date
}
