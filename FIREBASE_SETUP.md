# Firebase Setup Guide for ParkShare

## Overview

This guide provides setup instructions and solutions for common Firebase issues in the ParkShare application. It includes configuration steps for Firestore, authentication, and environment variables, with updates to support multi-role functionality (driver and host) and role switching.

## Current Issues and Solutions

### 1. Google Sign-In Error: "auth/unauthorized-domain"

**Problem**: The preview domain is not authorized in the Firebase Console, causing authentication failures.
**Solution**: Add the preview domain to Firebase authorized domains:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `parkshare-626e2`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your preview domain (e.g., `preview-parkshare-frontend-design-*.vusercontent.net`)
6. Optionally add a wildcard: `*.vusercontent.net` to allow all preview domains

### 2. Firestore "Client is Offline" Error

**Problem**: Firestore cannot establish a connection due to WebChannel transport errors.
**Solutions Implemented**:

- ✅ Enabled `experimentalForceLongPolling` to use HTTP long polling instead of WebSocket
- ✅ Disabled `useFetchStreams` to avoid fetch stream issues
- ✅ Added retry logic with exponential backoff
- ✅ Auto-create user profiles if they don't exist with default roles
  **Additional Steps** (if issues persist):

1. **Enable Firestore Database**:
   - Go to Firebase Console → Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select a location close to your users
2. **Check Firestore Rules** (see below for updated rules)
3. **Network/CORS Issues**:
   - The preview environment may have network restrictions
   - For production, deploy to Vercel where these issues are less common

### 3. Missing User Profiles

**Problem**: Users logging in directly (without signup) lack profiles.
**Solution Implemented**:

- ✅ Auto-create default profiles for users without existing profiles
- ✅ Default roles set to `["driver"]` (can be updated to include "host" via role selection or switching)

### 4. Environment Variables

Ensure these environment variables are set:
