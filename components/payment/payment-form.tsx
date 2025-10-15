"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone, Loader2 } from "lucide-react"

interface PaymentFormProps {
  amount: number
  onSubmit: (phoneNumber: string) => Promise<void>
  loading: boolean
}

export function PaymentForm({ amount, onSubmit, loading }: PaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(phoneNumber)
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "")
    // Format as Kenyan phone number
    if (cleaned.startsWith("254")) {
      return cleaned.substring(0, 12)
    } else if (cleaned.startsWith("0")) {
      return cleaned.substring(0, 10)
    }
    return cleaned.substring(0, 9)
  }

  // Convert USD to KES (approximate rate: 1 USD = 130 KES)
  const amountInKES = Math.round(amount * 130)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Pay securely using M-Pesa</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="flex items-center space-x-2 border-2 border-[#66cc66] rounded-lg p-4 bg-[#66cc66]/5">
              <Smartphone className="w-6 h-6 text-[#66cc66]" />
              <div className="flex-1">
                <p className="font-semibold text-[#003366]">M-Pesa</p>
                <p className="text-sm text-muted-foreground">Pay with your mobile money</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="0712345678 or 254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                required
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Safaricom M-Pesa number. You'll receive a prompt on your phone.
              </p>
            </div>
          </div>

          <div className="bg-[#003366] text-white p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-90">Amount (USD)</span>
                <span className="font-semibold">${amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/20 pt-2">
                <span className="font-semibold">Total Amount (KES)</span>
                <span className="text-2xl font-bold">KES {amountInKES.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#66cc66] hover:bg-[#66cc66]/90 text-[#003366]" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initiating Payment...
              </>
            ) : (
              `Pay KES ${amountInKES.toLocaleString()}`
            )}
          </Button>

          <div className="bg-[#ff9933]/10 border border-[#ff9933]/30 rounded-lg p-3">
            <p className="text-xs text-center text-[#003366]">
              <strong>Note:</strong> You will receive an M-Pesa prompt on your phone. Enter your M-Pesa PIN to complete
              the payment.
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your payment is secure and processed through Safaricom M-Pesa
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
