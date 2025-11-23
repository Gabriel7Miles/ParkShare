# ParkShare Dialogflow Integration Guide

## Overview

This directory contains comprehensive Dialogflow configuration files for the ParkShare parking platform. The chatbot provides conversational interfaces for both drivers and hosts to:

- Search and book parking spaces
- Manage bookings and cancellations
- Add and manage parking listings
- Process payments via M-Pesa
- Leave reviews and ratings
- Access support and FAQ

## Files Description

### 1. `intents.json`

Contains all conversation intents with training phrases and responses. Includes:

- **Welcome & Navigation**: Greeting users and guiding them
- **Parking Search**: Finding and filtering parking spaces
- **Booking Management**: Creating, viewing, and canceling bookings
- **Payment Processing**: M-Pesa integration for payments
- **Host Features**: Adding spaces, viewing earnings, managing listings
- **Reviews**: Submitting and managing reviews
- **Support**: Customer support and troubleshooting
- **FAQs**: Common questions and answers

**Key Intents:**

- `Welcome` - Initial greeting
- `FindParking` - Start parking search
- `BookParking-*` - Booking flow
- `Payment-*` - Payment processing
- `AddSpace-*` - Host listing creation
- `ViewBookings` - Booking management
- `Support` - Customer support

### 2. `entities.json`

Custom entities for recognizing specific data types:

- `@parking-type` - Driveway, garage, lot, street
- `@booking-id` - Booking reference IDs
- `@booking-status` - Pending, confirmed, active, completed, cancelled
- `@payment-method` - M-Pesa, card, PayPal
- `@user-role` - Driver, host, admin
- `@parking-features` - Covered, security, CCTV, EV charging, etc.
- `@vehicle-type` - Car, SUV, motorcycle, van, truck, bus
- `@kenyan-locations` - Major Kenyan cities and areas
- `@common-landmarks` - Popular landmarks in Kenya

### 3. `contexts.json`

Context management for conversation flow:

- **Lifespan counts** for each context
- **Parameter tracking** across conversation turns
- **Context transition rules** for smooth dialogue flow

**Key Contexts:**

- `search-results` - Active parking search
- `booking-confirmation` - Confirming booking details
- `payment-processing` - During payment
- `adding-space-*` - Multi-step space creation flow
- `support-mode` - Customer support interaction

### 4. `fulfillment-config.json`

Webhook configuration for backend integration:

- **Webhook endpoints** for each action
- **Request/response formats** for API calls
- **Integration details** with Firebase, M-Pesa, Google Maps
- **Error handling** strategies

**Required Webhooks:**

- `searchParking` - Find available spaces
- `createBooking` - Create new booking
- `initiateMpesaPayment` - Process payment
- `createParkingSpace` - Add new listing
- `getUserBookings` - Retrieve bookings
- `submitReview` - Post reviews

### 5. `sample-dialogues.json`

Real conversation examples covering:

- Finding and booking parking
- Adding a parking space (host)
- Canceling bookings
- Leaving reviews
- Checking earnings (host)
- Customer support scenarios
- FAQ interactions
- Role switching

## Setup Instructions

### Step 1: Create Dialogflow Agent

1. Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
2. Create a new agent named "ParkShare"
3. Select your Google Cloud project
4. Choose timezone and default language (English)

### Step 2: Import Intents

1. Navigate to **Intents** in Dialogflow Console
2. For each intent in `intents.json`:
   - Click **Create Intent**
   - Add the intent name
   - Add training phrases from the JSON
   - Configure parameters if needed
   - Add responses
   - Set contexts (input/output)
   - Enable webhook fulfillment if required

**Automated Import (using Dialogflow API):**

```bash
# Install Dialogflow API client
npm install @google-cloud/dialogflow

# Use the provided import script (create one based on intents.json)
node scripts/import-intents.js
```

### Step 3: Create Custom Entities

1. Navigate to **Entities** in Dialogflow Console
2. For each entity in `entities.json`:
   - Click **Create Entity**
   - Add entity name (e.g., `parking-type`)
   - Add values and synonyms
   - Enable automated expansion where needed
   - Save entity

### Step 4: Configure Fulfillment

1. Navigate to **Fulfillment** in Dialogflow Console
2. Enable **Webhook**
3. Enter webhook URL: `https://your-domain.com/api/dialogflow/webhook`
4. Add headers for authentication
5. Save configuration

**Webhook Implementation:**
See `fulfillment-config.json` for endpoint specifications. Create webhook handler at:

```
/app/api/dialogflow/webhook/route.ts
```

### Step 5: Set Up Integrations

#### Firebase Integration

- Ensure Firebase is configured in your project
- Enable Firestore for data storage
- Set up Authentication for user management

#### M-Pesa Integration

- Configure M-Pesa credentials
- Set up STK Push endpoints
- Configure callback URLs

#### Google Maps Integration

- Enable Google Maps APIs (Geocoding, Distance Matrix, Places)
- Add API key to environment variables

### Step 6: Test the Agent

1. Use **Dialogflow Simulator** (right panel) to test conversations
2. Try sample dialogues from `sample-dialogues.json`
3. Verify webhook responses
4. Test all user flows:
   - Driver booking flow
   - Host space creation flow
   - Payment processing
   - Booking cancellation
   - Reviews

### Step 7: Deploy Integrations

#### Web Integration

```javascript
// Add to your React/Next.js app
<script src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"></script>
<df-messenger
  intent="WELCOME"
  chat-title="ParkShare Assistant"
  agent-id="YOUR_AGENT_ID"
  language-code="en"
></df-messenger>
```

#### Custom Chat Widget

The existing `components/chatbot/chat-widget.tsx` can be updated to use Dialogflow:

```typescript
// Update handleSend function to call Dialogflow API
const response = await fetch("/api/dialogflow/query", {
  method: "POST",
  body: JSON.stringify({
    queryText: input,
    sessionId: userId,
  }),
});
```

## Webhook Implementation

### Create Webhook Route

Create `/app/api/dialogflow/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { WebhookClient } from "dialogflow-fulfillment";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const agent = new WebhookClient({ request: body, response: {} });

  // Intent handlers
  const searchParking = async (agent) => {
    const location = agent.parameters.location;
    const startTime = agent.parameters["start-time"];

    // Call your Firebase function to search parking
    const results = await searchParkingSpaces(location, startTime);

    agent.add(`Found ${results.length} parking spaces in ${location}`);
    agent.setContext({
      name: "search-results",
      lifespan: 5,
      parameters: { results },
    });
  };

  const createBooking = async (agent) => {
    const spaceId = agent.parameters["space-id"];
    const userId = agent.context.get("user-session").parameters.userId;

    // Create booking in Firebase
    const booking = await createBookingInFirebase(spaceId, userId);

    agent.add(`Booking created! Reference: ${booking.id}`);
  };

  // Map intents to handlers
  const intentMap = new Map();
  intentMap.set("FindParking-DateTime", searchParking);
  intentMap.set("BookParking-Confirm", createBooking);
  // Add more intent handlers...

  agent.handleRequest(intentMap);

  return NextResponse.json(agent.responseJson_);
}
```

### Connect to Firebase

```typescript
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

async function searchParkingSpaces(location: string, startTime: Date) {
  const spacesRef = collection(db, "parkingSpaces");
  const q = query(
    spacesRef,
    where("address", ">=", location),
    where("availability", "==", "available")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
```

### Integrate M-Pesa Payment

```typescript
async function initiateMpesaPayment(
  phoneNumber: string,
  amount: number,
  bookingId: string
) {
  const response = await fetch("/api/mpesa/stk-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber,
      amount,
      accountReference: bookingId,
    }),
  });

  return await response.json();
}
```

## Context Flow Examples

### Parking Search Flow

```
User: "Find parking near Westgate"
→ Context: awaiting-location (cleared)
→ Context: has-location (set)

User: "Tomorrow at 2 PM"
→ Context: has-location (active)
→ Context: search-results (set)

User: "Show cheapest"
→ Context: search-results (active)
→ Context: viewing-results (set)
```

### Booking Flow

```
User: "Book this space"
→ Context: viewing-details (active)
→ Context: booking-confirmation (set)

User: "Confirm"
→ Context: booking-confirmation (active)
→ Context: awaiting-payment (set)

User: "254712345678"
→ Context: awaiting-payment (active)
→ Context: payment-processing (set)

[Payment Success]
→ All contexts cleared
```

## Testing Checklist

- [ ] Welcome intent triggers correctly
- [ ] Parking search with location works
- [ ] Date/time parsing is accurate
- [ ] Filtering (price, rating, distance) functions
- [ ] Booking flow completes end-to-end
- [ ] M-Pesa payment integration works
- [ ] Booking cancellation processes refunds
- [ ] Host can add parking spaces
- [ ] Earnings display correctly
- [ ] Reviews can be submitted
- [ ] Support escalation creates tickets
- [ ] FAQ responses are helpful
- [ ] Role switching works
- [ ] Context management flows properly
- [ ] Webhook responses are timely (<3s)

## Best Practices

### 1. Training Phrases

- Add 10-20 training phrases per intent
- Include variations and colloquialisms
- Use Kenyan English phrases
- Cover edge cases

### 2. Context Management

- Set appropriate lifespan counts (2-5 for most)
- Clean up contexts after flow completion
- Pass necessary parameters between contexts
- Use descriptive context names

### 3. Responses

- Keep responses concise and friendly
- Use emojis sparingly but effectively
- Provide clear next steps
- Include error handling messages
- Personalize with user's name when available

### 4. Error Handling

```typescript
try {
  // Webhook logic
} catch (error) {
  agent.add(
    "I'm sorry, I encountered an error. Please try again or contact support."
  );
  console.error("Dialogflow webhook error:", error);
}
```

### 5. Security

- Validate webhook requests
- Sanitize user inputs
- Protect sensitive data
- Use HTTPS for all webhooks
- Implement rate limiting

## Monitoring & Analytics

### Track Key Metrics

- Intent match rate
- Conversation completion rate
- Booking conversion rate
- Average conversation length
- Most common intents
- Fallback rate

### Dialogflow Analytics

1. Go to **Analytics** in Dialogflow Console
2. Monitor:
   - Sessions over time
   - Intent usage
   - Unhandled queries
   - Exit rate per intent

### Custom Analytics

```typescript
// Log to Firebase Analytics
import { logEvent } from "firebase/analytics";

logEvent(analytics, "chatbot_booking_completed", {
  booking_id: bookingId,
  amount: totalPrice,
  payment_method: "mpesa",
});
```

## Troubleshooting

### Common Issues

**Intent not matching:**

- Add more training phrases
- Check for typos in entities
- Verify context requirements

**Webhook timeout:**

- Optimize database queries
- Add caching where possible
- Increase timeout limit (max 30s)

**Context not persisting:**

- Check lifespan count
- Verify context name spelling
- Ensure output context is set

**Payment failures:**

- Verify M-Pesa credentials
- Check phone number format
- Test callback URL accessibility

## Next Steps

1. **Train the Agent**: Add more training phrases based on real user queries
2. **A/B Testing**: Test different response variations
3. **Multi-language**: Add Swahili language support
4. **Voice Integration**: Enable voice commands via Google Assistant
5. **Rich Responses**: Add images, cards, and quick replies
6. **Sentiment Analysis**: Detect user satisfaction
7. **Proactive Messages**: Send booking reminders

## Resources

- [Dialogflow Documentation](https://cloud.google.com/dialogflow/docs)
- [Dialogflow ES vs CX](https://cloud.google.com/dialogflow/docs/editions)
- [Webhook Guide](https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook)
- [Best Practices](https://cloud.google.com/dialogflow/es/docs/best-practices)
- [Firebase Integration](https://firebase.google.com/docs/dialogflow)

## Support

For issues or questions:

- Email: dev@parkshare.com
- Slack: #parkshare-chatbot
- Documentation: `/docs/dialogflow`

## Version History

- **v1.0.0** (Current) - Initial Dialogflow integration
  - Driver booking flow
  - Host space management
  - Payment integration
  - Reviews and support
  - FAQ handling

---

**Created by:** ParkShare Development Team  
**Last Updated:** October 21, 2025  
**Dialogflow Version:** ES (Essential)


