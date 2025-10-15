// contexts/firebase-context.tsx
"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

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

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
  storage: null,
  isInitialized: false,
})

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType>({
    app: null,
    auth: null,
    db: null,
    storage: null,
    isInitialized: false,
  })

  useEffect(() => {
    // Initialize Firebase in useEffect to ensure it runs on client after mount
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
      const auth = getAuth(app)
      const db = getFirestore(app)
      const storage = getStorage(app)

      setFirebase({
        app,
        auth,
        db,
        storage,
        isInitialized: true,
      })

      console.log("[v0] Firebase initialized successfully")
      console.log("[v0] Firestore instance:", !!db) // ✅ Added for debugging
    } catch (error) {
      console.error("[v0] Firebase initialization error:", error)
    }
  }, [])

  return <FirebaseContext.Provider value={firebase}>{children}</FirebaseContext.Provider>
}

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error("useFirebase must be used within FirebaseProvider")
  }
  return context
}