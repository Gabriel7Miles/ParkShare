// contexts/auth-context.tsx
"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { getUserProfile, createProfileForExistingUser, type UserProfile } from "@/lib/firebase/auth"
import { useFirebase } from "@/contexts/firebase-context"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { auth, db, isInitialized } = useFirebase() // ✅ Get db from context

  useEffect(() => {
    if (!isInitialized || !auth || !db) { // ✅ Check for db too
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[v0] Auth state changed:", firebaseUser?.uid)
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // ✅ PASS db AS FIRST PARAMETER
          let profile = await getUserProfile(db, firebaseUser.uid)

          if (!profile) {
            console.log("[v0] No profile found, creating default profile")
            // ✅ PASS db AS FIRST PARAMETER
            profile = await createProfileForExistingUser(db, firebaseUser, "driver")
          }

          setUserProfile(profile)
          console.log("[v0] User profile loaded successfully")
        } catch (error: any) {
          console.error("[v0] Error loading user profile:", error.message)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [auth, db, isInitialized]) // ✅ Add db to dependencies

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
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