// app/api/chatbase/token/route.ts
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const SECRET = "col6gaj8rest5kpr12wj4conjphzzfoi" // Your Chatbase secret key

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const token = jwt.sign(
      {
        user_id: userId,
        email: email || "unknown@parkshare.app",
        name: email?.split("@")[0] || "User",
      },
      SECRET,
      { expiresIn: "24h" }
    )

    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 })
  }
}