import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { FirebaseProvider } from "@/contexts/firebase-context"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { ChatWidget } from "@/components/chatbot/chat-widget"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ParkShare - Find & Share Parking Spaces",
  description:
    "Connect drivers with parking space owners. Find affordable parking or earn money from your unused space.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${poppins.variable} ${inter.variable}`}>
        <Suspense>
          <FirebaseProvider>
            <AuthProvider>
              {children}
              <ChatWidget />
              <Toaster />
            </AuthProvider>
          </FirebaseProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
