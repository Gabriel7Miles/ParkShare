// app/api/google-maps-key/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth" // If using NextAuth
// import { getAuth } from "@clerk/nextjs" // If using Clerk

export async function GET(request: NextRequest) {
  try {
    // ✅ OPTIONAL: Add authentication check
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error("[API] Google Maps API key not configured")
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      )
    }

    // ✅ SECURITY: Log access (remove in production)
    console.log("[API] Google Maps key requested")

    return NextResponse.json({ 
      apiKey,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[API] Error fetching Google Maps key:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}