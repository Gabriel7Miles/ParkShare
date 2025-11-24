// app/api/chatbase/token/route.ts
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Your Chatbase Identity Secret (never expose in frontend!)
const CHATBASE_SECRET = process.env.CHATBASE_IDENTITY_SECRET!

// Optional: Validate secret exists (fails fast in dev if missing)
if (!CHATBASE_SECRET) {
  throw new Error("Missing CHATBASE_IDENTITY_SECRET in environment variables")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, name } = body

    // Required: userId
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required and must be a string" },
        { status: 400 }
      )
    }

    // Generate secure JWT for Chatbase
    const token = jwt.sign(
      {
        user_id: userId,
        email: email || undefined,
        name: name || email?.split("@")[0] || "ParkShare User",
        // Add any extra user traits you want in Chatbase
        // plan: "premium",
        // joined_at: new Date().toISOString(),
      },
      CHATBASE_SECRET,
      {
        expiresIn: "24h", // Matches Chatbase recommendation
        algorithm: "HS256",
      }
    )

    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    console.error("Chatbase token generation failed:", error)
    return NextResponse.json(
      { error: "Failed to generate authentication token" },
      { status: 500 }
    )
  }
}

// Optional: Disable body parsing if you want (not needed here)
// export const config = { api: { bodyParser: false } }