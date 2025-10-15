import { type NextRequest, NextResponse } from "next/server"
import { MPESA_CONFIG, generatePassword, getTimestamp } from "@/lib/mpesa/config"
import type { MpesaStkPushRequest, MpesaStkPushResponse } from "@/lib/mpesa/types"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc } = await request.json()

    // Get access token
    const tokenResponse = await fetch(`${request.nextUrl.origin}/api/mpesa/token`)
    const { access_token } = await tokenResponse.json()

    const timestamp = getTimestamp()
    const password = generatePassword(timestamp)

    // Format phone number (remove leading 0 or +254, add 254)
    let formattedPhone = phoneNumber.replace(/\s/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1)
    } else if (formattedPhone.startsWith("+254")) {
      formattedPhone = formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone
    }

    const stkPushRequest: MpesaStkPushRequest = {
      BusinessShortCode: MPESA_CONFIG.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount).toString(),
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }

    const response = await fetch(`${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPushRequest),
    })

    if (!response.ok) {
      throw new Error("STK Push failed")
    }

    const data: MpesaStkPushResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("M-Pesa STK Push error:", error)
    return NextResponse.json({ error: "Payment initiation failed" }, { status: 500 })
  }
}
