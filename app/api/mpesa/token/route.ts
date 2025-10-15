import { NextResponse } from "next/server"
import { MPESA_CONFIG, getAuthorizationHeader } from "@/lib/mpesa/config"
import type { MpesaAccessTokenResponse } from "@/lib/mpesa/types"

export async function GET() {
  try {
    const response = await fetch(`${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: getAuthorizationHeader(),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get access token")
    }

    const data: MpesaAccessTokenResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("M-Pesa token error:", error)
    return NextResponse.json({ error: "Failed to get access token" }, { status: 500 })
  }
}
