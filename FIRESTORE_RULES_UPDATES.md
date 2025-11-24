# Firestore Security Rules - Updated for v5.2

## 🔐 Key Changes Made

### 1. **User Profiles** ✅ Updated

- **Read Access**: Changed to allow any authenticated user to read profiles (needed for public host profiles)
- **Optional Fields**: Removed strict validation for optional fields like `bio`, `profilePicture`, `activeRole`, etc.
- **Reasoning**: Users need to view host profiles when browsing parking spaces

### 2. **Parking Spaces** ✅ Major Updates

- **Public Read Access**: Changed from `request.auth != null` to `true`
  - **Why**: Home page now shows parking spaces to unauthenticated users (browse before signup)
- **Create Validation**: Added new required fields:
  - `totalSpots` (integer, must be > 0)
  - `spots` (array, size must equal totalSpots)
  - `images` (array, minimum 1, maximum 5)
  - `hostName` (string)
  - `vehicleTypes` (array)
- **Update Rules**: Enhanced to allow:
  - Host updating their own spaces
  - System updating ratings/reviewCount (from reviews)
  - System updating spot availability (from bookings)

### 3. **Bookings** ✅ Major Updates

- **Create Validation**: Added new required fields:
  - `spotLabel` (string) - which specific spot was booked
  - `carDetails` (object) with:
    - `color` (required)
    - `numberPlate` (required)
    - `ownershipType` (required, must be: personal, hired, borrowed, company, rental)
    - `make` (optional)
    - `model` (optional)
  - `driverName` (string)

### 4. **Reviews** ✅ Updated

- **Public Read**: Changed to `true` (reviews visible to everyone)
- **Create Validation**: Added new required fields:
  - `hostId` (string)
  - `bookingId` (string)

### 5. **Payments** ✅ New Collection

- Added security rules for payments collection
- Create/Update/Delete: System only (webhook)
- Read: User can read their own payment records

---

## 🆕 Helper Functions Added

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

function hasRole(role) {
  return isAuthenticated()
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([role]);
}
```

---

## 📋 Detailed Rule Changes

### Before vs After Comparison

#### Parking Spaces - Read Access

**Before:**

```javascript
allow read: if request.auth != null;
```

**After:**

```javascript
allow read: if true;  // Public browsing enabled
```

#### Parking Spaces - Create Validation

**Before:**

```javascript
allow create: if request.auth != null
  && request.resource.data.hostId == request.auth.uid
  && request.resource.data.keys().hasAll(['hostId', 'title', 'address', 'pricePerHour', 'availability'])
  && request.resource.data.availability in ['available', 'occupied'];
```

**After:**

```javascript
allow create: if isAuthenticated()
  && request.resource.data.hostId == request.auth.uid
  && request.resource.data.keys().hasAll([
    'hostId', 'hostName', 'title', 'description', 'address',
    'location', 'pricePerHour', 'availability', 'features',
    'images', 'rating', 'reviewCount', 'spaceType',
    'vehicleTypes', 'totalSpots', 'spots'
  ])
  && request.resource.data.availability in ['available', 'occupied', 'reserved']
  && request.resource.data.totalSpots is int
  && request.resource.data.totalSpots > 0
  && request.resource.data.spots is list
  && request.resource.data.spots.size() == request.resource.data.totalSpots
  && request.resource.data.images is list
  && request.resource.data.images.size() >= 1
  && request.resource.data.images.size() <= 5;
```

#### Bookings - Create Validation

**Before:**

```javascript
allow create: if request.auth != null;
```

**After:**

```javascript
allow create: if isAuthenticated()
  && request.resource.data.driverId == request.auth.uid
  && request.resource.data.keys().hasAll([
    'spaceId', 'driverId', 'driverName', 'hostId',
    'startTime', 'endTime', 'totalPrice', 'status',
    'paymentStatus', 'spotLabel', 'carDetails'
  ])
  && request.resource.data.carDetails.keys().hasAll([
    'color', 'numberPlate', 'ownershipType'
  ])
  && request.resource.data.carDetails.ownershipType in [
    'personal', 'hired', 'borrowed', 'company', 'rental'
  ];
```

---

## 🚀 Deployment Instructions

### Option 1: Firebase Console (Recommended for First Time)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `parkshare-app-[your-id]`
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules`
5. Paste into the editor
6. Click **Publish**

### Option 2: Firebase CLI

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## ✅ Security Checklist

- ✅ **Public browsing enabled** - Unauthenticated users can view parking spaces
- ✅ **Authentication required for actions** - Only authenticated users can book, review, etc.
- ✅ **Owner-only updates** - Users can only modify their own data
- ✅ **Image validation** - Minimum 1, maximum 5 images enforced
- ✅ **Spot validation** - Total spots must match spots array length
- ✅ **Car details validation** - Required fields enforced for bookings
- ✅ **System updates allowed** - Ratings and spot availability can be updated programmatically
- ✅ **Payment security** - Payments can only be created by system (webhook)

---

## 🔒 Security Features

### Multi-layered Protection:

1. **Authentication**: Most operations require authentication
2. **Authorization**: Users can only access/modify their own data
3. **Validation**: Required fields and data types enforced
4. **Constraints**: Enums validated (e.g., ownershipType, availability)
5. **Size limits**: Image count limited to prevent abuse

### Data Integrity:

- Spot count validation ensures consistency
- Booking requires valid car details
- Reviews require valid ratings (1-5)
- Timestamps automatically managed

---

## 🐛 Common Issues & Solutions

### Issue: "Missing permissions"

**Solution**: Make sure you're logged in when creating bookings/reviews

### Issue: "Image validation failed"

**Solution**: Upload at least 1 image (max 5) when creating a parking space

### Issue: "Spot validation failed"

**Solution**: Ensure `totalSpots` matches the length of `spots` array

### Issue: "Car details missing"

**Solution**: Include color, numberPlate, and ownershipType when creating a booking

---

## 📊 Rule Complexity

- **Lines of Code**: 180+
- **Collections Protected**: 5 (users, parkingSpaces, bookings, reviews, payments)
- **Helper Functions**: 3
- **Validation Rules**: 15+

---

## 🎯 Testing Recommendations

Test these scenarios after deploying:

1. ✅ Unauthenticated user can view parking spaces (home page)
2. ✅ Unauthenticated user cannot create bookings
3. ✅ Authenticated user can create parking space with images
4. ✅ Cannot create parking space without images
5. ✅ Can create booking with car details
6. ✅ Cannot create booking without car details
7. ✅ Can view public host profile
8. ✅ Host can delete their own spaces
9. ✅ Host cannot delete other hosts' spaces
10. ✅ Reviews are publicly visible

---

## 📝 Notes

- Rules are optimized for the current application structure
- Public read access on parking spaces enables SEO and sharing
- All write operations still require authentication
- Helper functions improve code readability and maintainability
- Rules follow the principle of least privilege

---

**Last Updated**: October 25, 2025  
**Version**: 5.2  
**Status**: Production Ready ✅
