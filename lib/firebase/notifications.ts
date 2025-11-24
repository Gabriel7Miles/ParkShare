import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { Notification, NotificationType } from "@/lib/types/notification";

/**
 * Create a notification for a user
 */
export async function createNotification(
  db: Firestore,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedBookingId?: string,
  relatedSpaceId?: string
): Promise<string> {
  try {
    const notificationsRef = collection(db, "notifications");
    const docRef = await addDoc(notificationsRef, {
      userId,
      type,
      title,
      message,
      relatedBookingId,
      relatedSpaceId,
      read: false,
      createdAt: serverTimestamp(),
    });
    console.log(`[Notifications] Created notification ${docRef.id} for user ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error("[Notifications] Error creating notification:", error);
    throw error;
  }
}

/**
 * Get notifications for a user (real-time listener)
 */
export function getUserNotifications(
  db: Firestore,
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Notification[];
      callback(notifications);
    },
    (error) => {
      console.error("[Notifications] Error listening to notifications:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  db: Firestore,
  notificationId: string
): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error("[Notifications] Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  db: Firestore,
  userId: string
): Promise<void> {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );
    await Promise.all(updates);
  } catch (error) {
    console.error("[Notifications] Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(
  db: Firestore,
  userId: string
): Promise<number> {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("[Notifications] Error getting unread count:", error);
    return 0;
  }
}

