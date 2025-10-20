"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { getUserProfile, type UserProfile, type UserRole } from "@/lib/firebase/auth"
import { useFirebase } from "@/contexts/firebase-context"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

// UserRole is now imported from auth.ts

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  activeRole: UserRole | null
  loading: boolean
  setActiveRole: (role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  activeRole: null,
  loading: true,
  setActiveRole: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const { auth, db, isInitialized } = useFirebase()
  const { toast } = useToast()

  useEffect(() => {
    if (!isInitialized || !auth || !db) {
      console.warn("[Auth] Firebase not initialized or auth/db missing")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[Auth] Auth state changed:", firebaseUser?.uid)
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const profile = await getUserProfile(db, firebaseUser.uid)

          if (!profile) {
            console.warn("[Auth] No profile found for user. Profile should have been created during sign-up/sign-in.")
            toast({
              title: "Profile Missing",
              description: "Your user profile is missing. Please contact support or try signing out and back in.",
              variant: "destructive",
            })
            setUserProfile(null)
            setActiveRoleState(null)
          } else {
            setUserProfile(profile)
            setActiveRoleState(profile.activeRole || (profile.roles.includes("driver") ? "driver" : profile.roles[0] || "driver"))
            console.log("[Auth] User profile loaded:", profile)
          }
        } catch (error: any) {
          console.error("[Auth] Error loading user profile:", error.message)
          
          // Handle permission errors gracefully
          if (error.code === "permission-denied") {
            toast({
              title: "Permission Denied",
              description: "Unable to access your profile. Please check your Firestore security rules or try signing out and back in.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error",
              description: "Failed to load user profile. Please try refreshing the page.",
              variant: "destructive",
            })
          }
          
          setUserProfile(null)
          setActiveRoleState(null)
        }
      } else {
        setUserProfile(null)
        setActiveRoleState(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [auth, db, isInitialized, toast])

  const handleSetActiveRole = async (role: UserRole) => {
    if (!user || !db || !userProfile) {
      toast({
        title: "Error",
        description: "User not authenticated or profile not loaded.",
        variant: "destructive",
      })
      return
    }

    if (!userProfile.roles.includes(role)) {
      toast({
        title: "Error",
        description: `You are not authorized for ${role} mode.`,
        variant: "destructive",
      })
      return
    }

    if (activeRole === role) {
      return
    }

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        activeRole: role,
        updatedAt: serverTimestamp(),
      })
      setActiveRoleState(role)
      console.log("[Auth] Active role updated to:", role)
      toast({
        title: "Role Switched",
        description: `Switched to ${role} mode successfully.`,
      })
    } catch (error: any) {
      console.error("[Auth] Error updating active role:", error)
      let errorMessage = "Failed to switch role. Please try again."
      if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your account settings."
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, activeRole, loading, setActiveRole: handleSetActiveRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}