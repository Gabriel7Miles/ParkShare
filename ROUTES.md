# ParkShare Application Routes

## Public Routes (No Authentication Required)

### Landing & Marketing
- `/` - Landing page with hero, features, pricing, and CTA
- `/login` - Login page with email/password and Google sign-in
- `/signup` - Sign up page with role selection (driver/host)

## Driver Routes (Requires Driver Role)

### Dashboard & Search
- `/driver/dashboard` - Main driver dashboard with map view and parking search
- `/driver/bookings` - View all driver bookings (active, past, cancelled)
- `/driver/profile` - Driver profile settings and preferences

### Parking Details
- `/driver/space/[id]` - View detailed information about a specific parking space including reviews

## Host Routes (Requires Host Role)

### Dashboard & Management
- `/host/dashboard` - Main host dashboard showing all parking spaces
- `/host/add-space` - Form to add a new parking space
- `/host/edit-space/[id]` - Edit existing parking space details
- `/host/space/[id]` - View detailed information about host's parking space

### Bookings & Earnings
- `/host/bookings` - Manage all bookings (pending, active, completed)
- `/host/earnings` - View earnings dashboard and payment history
- `/host/profile` - Host profile settings and contact information

## Admin Routes (Requires Admin Role)

### Administration
- `/admin/dashboard` - Admin overview with platform statistics
- `/admin/users` - Manage all users (drivers and hosts)
- `/admin/spaces` - Manage all parking spaces on the platform

## API Routes

### Authentication
- `/api/auth/*` - Firebase authentication endpoints (handled by Firebase SDK)

### Payments
- `/api/mpesa/token` - Generate M-Pesa OAuth token
- `/api/mpesa/stk-push` - Initiate M-Pesa STK Push payment
- `/api/mpesa/callback` - Handle M-Pesa payment callbacks
- `/api/webhooks/payment` - Handle payment webhook events

### Google Maps
- `/api/google-maps-key` - Securely serve Google Maps API key

## Route Protection

All routes under `/driver/*`, `/host/*`, and `/admin/*` are protected and require:
1. User to be authenticated (logged in)
2. User to have the correct role for the route
3. Automatic redirect to login page if not authenticated
4. Automatic redirect to correct dashboard if wrong role

## Navigation Flow

### New User Journey
1. Land on `/` (landing page)
2. Click "Get Started" → `/signup`
3. Select role (driver or host)
4. Complete signup with email or Google
5. Redirect to `/driver/dashboard` or `/host/dashboard`

### Returning User Journey
1. Visit `/login`
2. Sign in with email or Google
3. Redirect to appropriate dashboard based on role

### Driver Booking Flow
1. `/driver/dashboard` - Search and browse parking spaces
2. Click on space → View details and reviews
3. Select dates and book → Payment modal
4. Complete M-Pesa payment
5. Redirect to `/driver/bookings` - View booking confirmation

### Host Space Management Flow
1. `/host/dashboard` - View all spaces
2. Click "Add Space" → `/host/add-space`
3. Fill form with space details
4. Submit → Redirect back to `/host/dashboard`
5. Manage bookings at `/host/bookings`
