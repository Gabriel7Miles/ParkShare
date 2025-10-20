import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Auth,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, type Firestore } from "firebase/firestore"

export type UserRole = "driver" | "host"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  roles: UserRole[]
  phoneNumber?: string
  createdAt: any
  profileComplete: boolean
  updatedAt?: any
  activeRole?: UserRole
}

export async function signUpWithEmail(
  auth: Auth,
  db: Firestore,
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await updateProfile(user, { displayName })

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      displayName,
      roles: ["driver", "host"],
      createdAt: serverTimestamp(),
      profileComplete: false,
      activeRole: "driver",
    }

    await setDoc(doc(db, "users", user.uid), userProfile)
    console.log("[Auth] Profile created for sign-up:", user.uid)
    return user
  } catch (error: any) {
    console.error("[Auth] Error in signUpWithEmail:", error.message)
    throw error
  }
}

export async function signInWithEmail(auth: Auth, email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signInWithGoogle(auth: Auth, db: Firestore): Promise<User> {
  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)
  const user = userCredential.user

  const userDoc = await getDoc(doc(db, "users", user.uid))

  if (!userDoc.exists()) {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "unknown@example.com",
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      roles: ["driver", "host"],
      createdAt: serverTimestamp(),
      profileComplete: false,
      activeRole: "driver",
    }
    await setDoc(doc(db, "users", user.uid), userProfile)
    console.log("[Auth] Profile created for Google sign-in:", user.uid)
  }

  return user
}

export async function signOut(auth: Auth): Promise<void> {
  await firebaseSignOut(auth)
}

export async function getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  try {
    console.log(`[Auth] Fetching profile for ${uid}`)
    const userDoc = await getDoc(doc(db, "users", uid))

    if (userDoc.exists()) {
      console.log("[Auth] Profile found successfully")
      const data = userDoc.data() as UserProfile
      return { 
        ...data, 
        roles: data.roles && data.roles.length > 0 ? data.roles : ["driver", "host"],
        activeRole: data.activeRole || "driver"
      }
    }

    console.log("[Auth] Profile document does not exist")
    return null
  } catch (error: any) {
    console.error(`[Auth] Error fetching profile:`, error.message)
    throw error
  }
}

export async function updateUserRoles(db: Firestore, uid: string, newRoles: UserRole[]): Promise<void> {
  const userRef = doc(db, "users", uid)
  await updateDoc(userRef, {
    roles: newRoles,
    updatedAt: serverTimestamp(),
  })
  console.log("[Auth] User roles updated for:", uid)
}

export { onAuthStateChanged }