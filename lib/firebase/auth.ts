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
import { doc, setDoc, getDoc, type Firestore } from "firebase/firestore"

export type UserRole = "driver" | "host"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  phoneNumber?: string
  createdAt: Date
  profileComplete: boolean
}

export async function signUpWithEmail(
  auth: Auth,
  db: Firestore,
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await updateProfile(user, { displayName })

  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName,
    role,
    createdAt: new Date(),
    profileComplete: false,
  }

  await setDoc(doc(db, "users", user.uid), userProfile)

  return user
}

export async function signInWithEmail(auth: Auth, email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signInWithGoogle(auth: Auth, db: Firestore, role: UserRole): Promise<User> {
  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)
  const user = userCredential.user

  const userDoc = await getDoc(doc(db, "users", user.uid))

  if (!userDoc.exists()) {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || "User",
      role,
      createdAt: new Date(),
      profileComplete: false,
    }
    await setDoc(doc(db, "users", user.uid), userProfile)
  }

  return user
}

export async function signOut(auth: Auth): Promise<void> {
  await firebaseSignOut(auth)
}

export async function getUserProfile(db: Firestore, uid: string, retries = 3): Promise<UserProfile | null> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[v0] Attempting to fetch profile for ${uid}, attempt ${i + 1}/${retries}`)
      const userDoc = await getDoc(doc(db, "users", uid))

      if (userDoc.exists()) {
        console.log("[v0] Profile found successfully")
        return userDoc.data() as UserProfile
      }

      console.log("[v0] Profile document does not exist")
      return null
    } catch (error: any) {
      console.error(`[v0] Error fetching profile (attempt ${i + 1}/${retries}):`, error.message)

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)))
      } else {
        console.error("[v0] All retry attempts failed, returning null")
        return null
      }
    }
  }
  return null
}

export async function createProfileForExistingUser(
  db: Firestore,
  user: User,
  role: UserRole = "driver",
): Promise<UserProfile> {
  console.log("[v0] Creating profile for existing user:", user.email)

  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName: user.displayName || user.email?.split("@")[0] || "User",
    role,
    createdAt: new Date(),
    profileComplete: false,
  }

  try {
    await setDoc(doc(db, "users", user.uid), userProfile)
    console.log("[v0] Profile created successfully")
    return userProfile
  } catch (error) {
    console.error("[v0] Error creating profile:", error)
    throw error
  }
}

export { onAuthStateChanged }
