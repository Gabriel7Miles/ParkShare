# Firebase Setup Guide for ParkShare

## Current Issues and Solutions

### 1. Google Sign-In Error: "auth/unauthorized-domain"

**Problem**: The preview domain is not authorized in Firebase Console.

**Solution**: Add the preview domain to Firebase authorized domains:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `parkshare-626e2`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your preview domain (e.g., `preview-parkshare-frontend-design-*.vusercontent.net`)
6. You can also add a wildcard: `*.vusercontent.net` to allow all preview domains

### 2. Firestore "Client is Offline" Error

**Problem**: Firestore cannot establish a connection due to WebChannel transport errors.

**Solutions Implemented**:
- ✅ Enabled `experimentalForceLongPolling` to use HTTP long polling instead of WebSocket
- ✅ Disabled `useFetchStreams` to avoid fetch stream issues
- ✅ Added retry logic with exponential backoff
- ✅ Auto-create user profiles if they don't exist

**Additional Steps** (if issues persist):

1. **Enable Firestore Database**:
   - Go to Firebase Console → Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select a location close to your users

2. **Check Firestore Rules**:
   \`\`\`
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /parkingSpaces/{spaceId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       match /bookings/{bookingId} {
         allow read, write: if request.auth != null;
       }
       match /reviews/{reviewId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   \`\`\`

3. **Network/CORS Issues**:
   - The preview environment may have network restrictions
   - For production, deploy to Vercel where these issues typically don't occur

### 3. Missing User Profiles

**Problem**: Users who log in directly (without going through signup) don't have profiles.

**Solution Implemented**:
- ✅ Auto-create default profiles for users without existing profiles
- ✅ Default role is set to "driver" (can be changed in profile settings)

### 4. Environment Variables

Make sure these environment variables are set:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCdTnvORbGpF1Y4X-mjnK-PCf6wGKxpJnE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=parkshare-626e2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=parkshare-626e2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=parkshare-626e2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=91463875245
NEXT_PUBLIC_FIREBASE_APP_ID=1:91463875245:web:9eeb5a43688a9641f9a424
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCqR92ywjrcjDjjiBbwhtHdMgZKHUYux30
NEXT_PUBLIC_APP_URL=your-app-url
\`\`\`

## Testing Checklist

- [ ] Firestore database is created and active
- [ ] Firestore rules are configured
- [ ] Preview domain is added to authorized domains
- [ ] Email/Password authentication is enabled in Firebase Console
- [ ] Google authentication is enabled in Firebase Console
- [ ] All environment variables are set
- [ ] Test email/password signup
- [ ] Test email/password login
- [ ] Test Google sign-in (after domain authorization)

## Deployment Notes

For production deployment:
1. Update Firestore rules to be more restrictive
2. Add your production domain to authorized domains
3. Consider enabling Firebase App Check for additional security
4. Set up proper error monitoring (e.g., Sentry)
