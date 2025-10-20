// contexts/firebase-context.tsx
"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import { Loader2 } from "lucide-react"

const firebaseConfig = {
  apiKey: "AIzaSyCdTnvORbGpF1Y4X-mjnK-PCf6wGKxpJnE",
  authDomain: "parkshare-626e2.firebaseapp.com",
  projectId: "parkshare-626e2",
  storageBucket: "parkshare-626e2.firebasestorage.app",
  messagingSenderId: "91463875245",
  appId: "1:91463875245:web:9eeb5a43688a9641f9a424",
  measurementId: "G-2TR2WBWPZ9",
}

interface FirebaseContextType {
  app: FirebaseApp | null
  auth: Auth | null
  db: Firestore | null
  storage: FirebaseStorage | null
  isInitialized: boolean
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType>({
    app: null,
    auth: null,
    db: null,
    storage: null,
    isInitialized: false,
  })

  useEffect(() => {
    let isMounted = true

    const initializeFirebase = async () => {
      try {
        const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
        const auth = getAuth(app)
        const db = getFirestore(app)
        const storage = getStorage(app)

        if (isMounted) {
          setFirebase({
            app,
            auth,
            db,
            storage,
            isInitialized: true,
          })
          console.log("[v0] Firebase initialized successfully")
          console.log("[v0] Firestore instance:", !!db)
          console.log("[v0] Storage instance:", !!storage)
        }
      } catch (error) {
        if (isMounted) {
          console.error("[v0] Firebase initialization error:", error)
          setFirebase(prev => ({ ...prev, isInitialized: false }))
        }
      }
    }

    initializeFirebase()

    return () => {
      isMounted = false
    }
  }, [])

  if (!firebase.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Initializing Firebase...</p>
        </div>
      </div>
    )
  }

  return <FirebaseContext.Provider value={firebase}>{children}</FirebaseContext.Provider>
}

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error("useFirebase must be used within FirebaseProvider")
  }
  if (!context.isInitialized || !context.db) {
    throw new Error("Firebase not initialized or db is unavailable")
  }
  return context
}