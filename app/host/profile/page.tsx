// app/host/profile/page.tsx
"use client"

import { useEffect, useState } from "react"
import { HostDashboardNav } from "@/components/host/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react" // ✅ ADDED: Import Loader2
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/contexts/firebase-context"
import { doc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, Calendar } from "lucide-react"

export default function HostProfile() {
  const { user, userProfile } = useAuth()
  const { db } = useFirebase()
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [saving, setSaving] = useState(false)
  const [memberSince, setMemberSince] = useState("N/A")

  // ✅ HANDLE DATE FORMATTING & PHONE INIT
  useEffect(() => {
    if (userProfile) {
      // Initialize phone number
      setPhoneNumber(userProfile.phoneNumber || "")
      
      // ✅ FIX: Handle different createdAt formats
      if (userProfile.createdAt) {
        let createdDate: Date
        
        if (userProfile.createdAt instanceof Date) {
          createdDate = userProfile.createdAt
        } else if (userProfile.createdAt?.toDate) {
          // Firebase Timestamp
          createdDate = userProfile.createdAt.toDate()
        } else if (typeof userProfile.createdAt === "string") {
          createdDate = new Date(userProfile.createdAt)
        } else {
          createdDate = new Date(userProfile.createdAt || Date.now())
        }
        
        // ✅ VALIDATE DATE
        if (!isNaN(createdDate.getTime()) && createdDate.getTime() > 0) {
          setMemberSince(createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }))
        } else {
          console.warn("[Host Profile] Invalid createdAt date:", userProfile.createdAt)
          setMemberSince("Recently joined")
        }
      } else {
        // Fallback if no createdAt
        setMemberSince("Recently joined")
      }
    }
  }, [userProfile])

  // ✅ SAVE PROFILE CHANGES
  const handleSave = async () => {
    if (!user || !db || !phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const userRef = doc(db, "users", user.uid)
      
      // Update profile in Firestore
      await updateDoc(userRef, {
        phoneNumber: phoneNumber.trim(),
        updatedAt: new Date(),
        displayName: userProfile?.displayName || user.displayName || user.email?.split('@')[0]
      })
      
      // ✅ SUCCESS TOAST
      toast({
        title: "✅ Profile Updated",
        description: "Your phone number has been saved successfully."
      })
      
      console.log("[Host Profile] Profile updated for user:", user.uid)
      
    } catch (error: any) {
      console.error("[Host Profile] Error saving profile:", error)
      
      // Handle specific Firebase errors
      let errorMessage = "Failed to save changes. Please try again."
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your account settings."
      } else if (error.message.includes('does not exist')) {
        errorMessage = "User profile not found. Please contact support."
      }
      
      toast({
        title: "❌ Save Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // ✅ PHONE VALIDATION
  const isValidPhone = (phone: string) => {
    // Basic Kenyan phone validation (+254 format)
    const kenyaPhoneRegex = /^(\+254|0)?[17]\d{8}$/
    return kenyaPhoneRegex.test(phone.replace(/\s+/g, ''))
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <HostDashboardNav />

      <div className="pt-16">
        <div className="container mx-auto p-4 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Host Profile</h1>
            <p className="text-muted-foreground">Manage your host account information</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PROFILE HEADER */}
              <div className="flex items-center gap-4 pb-6 border-b">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{userProfile.displayName || user.email}</p>
                  <p className="text-sm text-muted-foreground">Host Account</p>
                  <p className="text-xs text-green-600">✓ Verified Host</p>
                </div>
              </div>

              {/* FORM FIELDS */}
              <div className="space-y-4">
                {/* NAME - Read Only */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      value={userProfile.displayName || user.email?.split('@')[0] || ""} 
                      className="pl-10 bg-muted/50" 
                      readOnly 
                    />
                  </div>
                </div>

                {/* EMAIL - Read Only */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={user?.email || ""} 
                      className="pl-10 bg-muted/50" 
                      readOnly 
                    />
                  </div>
                </div>

                {/* PHONE - Editable */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+254 712 345 678" 
                      className={`pl-10 ${
                        phoneNumber && !isValidPhone(phoneNumber) 
                          ? "border-destructive focus:border-destructive" 
                          : ""
                      }`}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  {phoneNumber && !isValidPhone(phoneNumber) && (
                    <p className="text-xs text-destructive mt-1">
                      Please enter a valid Kenyan phone number (e.g., +254 712 345 678)
                    </p>
                  )}
                </div>

                {/* MEMBER SINCE - Read Only */}
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={memberSince}
                      className="pl-10 bg-muted/50"
                      readOnly
                    />
                  </div>
                </div>

                {/* HOST STATS */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center p-4 bg-success/5 rounded-lg">
                    <div className="text-2xl font-bold text-success">{userProfile?.spaces?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Spaces Listed</div>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold">{userProfile?.totalEarnings || 0}</div>
                    <div className="text-xs text-muted-foreground">KES Earned</div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1 bg-success hover:bg-success/90" 
                  onClick={handleSave} 
                  disabled={saving || !phoneNumber.trim() || !isValidPhone(phoneNumber)}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPhoneNumber(userProfile?.phoneNumber || "")}
                  disabled={saving}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}