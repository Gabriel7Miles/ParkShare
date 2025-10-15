import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Handle payment webhook events
    console.log("[v0] Payment webhook received:", body)

    // Process different event types
    switch (body.type) {
      case "payment.succeeded":
        // Update booking status
        break
      case "payment.failed":
        // Handle failed payment
        break
      case "refund.processed":
        // Handle refund
        break
      default:
        console.log("[v0] Unhandled webhook event:", body.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 })
  }
}
