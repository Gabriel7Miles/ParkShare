/**
 * ParkShare Dialogflow Webhook Implementation Example
 * 
 * This file provides a complete webhook implementation for handling
 * Dialogflow fulfillment requests for the ParkShare application.
 * 
 * Place this at: /app/api/dialogflow/webhook/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Type definitions for Dialogflow requests
interface DialogflowRequest {
  responseId: string;
  queryResult: {
    queryText: string;
    action: string;
    parameters: Record<string, any>;
    allRequiredParamsPresent: boolean;
    fulfillmentText: string;
    outputContexts: Array<{
      name: string;
      lifespanCount: number;
      parameters: Record<string, any>;
    }>;
    intent: {
      name: string;
      displayName: string;
    };
  };
  session: string;
  originalDetectIntentRequest?: any;
}

interface DialogflowResponse {
  fulfillmentText?: string;
  fulfillmentMessages?: Array<{
    text?: { text: string[] };
    payload?: any;
  }>;
  outputContexts?: Array<{
    name: string;
    lifespanCount: number;
    parameters: Record<string, any>;
  }>;
  source?: string;
}

export async function POST(req: NextRequest) {
  try {
    const dialogflowRequest: DialogflowRequest = await req.json();
    const { action, parameters } = dialogflowRequest.queryResult;
    const session = dialogflowRequest.session;

    // Extract user ID from session
    const userId = extractUserIdFromSession(session);

    let response: DialogflowResponse;

    // Route to appropriate handler based on action
    switch (action) {
      case 'findParking.searchWithDateTime':
        response = await handleParkingSearch(parameters, userId);
        break;

      case 'filterParking.byPrice':
        response = await handleFilterByPrice(parameters, userId);
        break;

      case 'filterParking.byRating':
        response = await handleFilterByRating(parameters, userId);
        break;

      case 'filterParking.byDistance':
        response = await handleFilterByDistance(parameters, userId);
        break;

      case 'viewParkingDetails':
        response = await handleViewParkingDetails(parameters, userId);
        break;

      case 'bookParking.confirmDetails':
        response = await handleBookingConfirmation(parameters, userId);
        break;

      case 'payment.initiateMpesa':
        response = await handleMpesaPayment(parameters, userId);
        break;

      case 'viewBookings.list':
        response = await handleViewBookings(userId);
        break;

      case 'cancelBooking.request':
        response = await handleCancelBookingRequest(parameters, userId);
        break;

      case 'cancelBooking.confirm':
        response = await handleCancelBookingConfirm(parameters, userId);
        break;

      case 'addSpace.setLocation':
        response = await handleAddSpaceLocation(parameters, userId);
        break;

      case 'addSpace.publish':
        response = await handlePublishSpace(parameters, userId);
        break;

      case 'viewEarnings.summary':
        response = await handleViewEarnings(userId);
        break;

      case 'manageSpaces.list':
        response = await handleManageSpaces(userId);
        break;

      case 'review.submit':
        response = await handleSubmitReview(parameters, userId);
        break;

      case 'support.escalate':
        response = await handleSupportEscalation(parameters, userId);
        break;

      default:
        response = {
          fulfillmentText: "I'm not sure how to help with that. Could you please rephrase?"
        };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dialogflow webhook error:', error);
    return NextResponse.json({
      fulfillmentText: "I'm sorry, I encountered an error processing your request. Please try again or contact support."
    }, { status: 500 });
  }
}

// Helper function to extract user ID from session string
function extractUserIdFromSession(session: string): string {
  const parts = session.split('/');
  return parts[parts.length - 1] || 'anonymous';
}

// Handler: Search for parking spaces
async function handleParkingSearch(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  const location = parameters.location;
  const startTime = parameters['start-time'];
  
  try {
    // Query Firebase for available parking spaces
    const spacesRef = collection(db, 'parkingSpaces');
    const q = query(
      spacesRef,
      where('availability', '==', 'available')
      // Add more filters based on location
    );

    const snapshot = await getDocs(q);
    const spaces = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by location proximity (you'd use Google Maps Distance Matrix API here)
    // For now, simple address matching
    const filteredSpaces = spaces.filter(space => 
      space.address.toLowerCase().includes(location.toLowerCase())
    ).slice(0, 10);

    if (filteredSpaces.length === 0) {
      return {
        fulfillmentText: `Sorry, I couldn't find any available parking spaces in ${location}. Would you like to try a different location?`
      };
    }

    const fulfillmentText = `I found ${filteredSpaces.length} parking spaces in ${location}. Would you like to see options sorted by price, rating, or distance?`;

    return {
      fulfillmentText,
      outputContexts: [
        {
          name: 'search-results',
          lifespanCount: 5,
          parameters: {
            location,
            'start-time': startTime,
            results: filteredSpaces,
            'results-count': filteredSpaces.length
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error searching parking:', error);
    throw error;
  }
}

// Handler: Filter parking by price
async function handleFilterByPrice(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  // Get results from context (in real implementation, retrieve from context)
  const results = parameters.results || [];
  const maxPrice = parameters['max-price'];

  let filteredResults = [...results].sort((a, b) => a.pricePerHour - b.pricePerHour);
  
  if (maxPrice) {
    filteredResults = filteredResults.filter(space => space.pricePerHour <= maxPrice);
  }

  const top3 = filteredResults.slice(0, 3);
  
  const listText = top3.map((space, index) => 
    `${index + 1}. **${space.title}** - KSH ${space.pricePerHour}/hour ⭐ ${space.rating}`
  ).join('\n');

  const fulfillmentText = `Here are the most affordable parking options:\n\n${listText}\n\nWould you like more details about any of these?`;

  return {
    fulfillmentText,
    outputContexts: [
      {
        name: 'viewing-results',
        lifespanCount: 5,
        parameters: {
          'results-list': top3,
          'sort-preference': 'price'
        }
      }
    ]
  };
}

// Handler: Filter by rating
async function handleFilterByRating(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  const results = parameters.results || [];
  
  const filteredResults = [...results].sort((a, b) => b.rating - a.rating);
  const top3 = filteredResults.slice(0, 3);
  
  const listText = top3.map((space, index) => 
    `${index + 1}. **${space.title}** - ⭐ ${space.rating} (${space.reviewCount} reviews) - KSH ${space.pricePerHour}/hour`
  ).join('\n');

  return {
    fulfillmentText: `Here are the top-rated parking spaces:\n\n${listText}\n\nInterested in any of these?`,
    outputContexts: [
      {
        name: 'viewing-results',
        lifespanCount: 5,
        parameters: {
          'results-list': top3,
          'sort-preference': 'rating'
        }
      }
    ]
  };
}

// Handler: Filter by distance
async function handleFilterByDistance(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  // In production, use Google Maps Distance Matrix API
  // For now, mock implementation
  const results = parameters.results || [];
  const location = parameters.location;

  // Sort by distance (you'd calculate actual distances here)
  const top3 = results.slice(0, 3);
  
  const listText = top3.map((space, index) => 
    `${index + 1}. **${space.title}** - 0.5km away - KSH ${space.pricePerHour}/hour`
  ).join('\n');

  return {
    fulfillmentText: `Here are the closest parking spaces to ${location}:\n\n${listText}\n\nWant to book one?`
  };
}

// Handler: View parking space details
async function handleViewParkingDetails(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  const spaceId = parameters['space-id'];

  try {
    const spaceRef = doc(db, 'parkingSpaces', spaceId);
    const spaceDoc = await getDoc(spaceRef);

    if (!spaceDoc.exists()) {
      return {
        fulfillmentText: "Sorry, I couldn't find that parking space. Please try another one."
      };
    }

    const space = spaceDoc.data();
    const features = Array.isArray(space.features) ? space.features.join(', ') : '';

    const fulfillmentText = `📍 **${space.title}**\n\n` +
      `⭐ ${space.rating} (${space.reviewCount} reviews)\n` +
      `💰 KSH ${space.pricePerHour}/hour\n` +
      `📏 Near ${space.address}\n\n` +
      `**Features:**\n${features}\n\n` +
      `**Description:**\n${space.description}\n\n` +
      `**Host:** ${space.hostName}\n\n` +
      `Would you like to book this space?`;

    return {
      fulfillmentText,
      outputContexts: [
        {
          name: 'viewing-details',
          lifespanCount: 5,
          parameters: {
            'space-id': spaceId,
            'space-title': space.title,
            'space-price': space.pricePerHour,
            'space-rating': space.rating,
            'host-name': space.hostName
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching space details:', error);
    throw error;
  }
}

// Handler: Confirm booking details
async function handleBookingConfirmation(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  const spaceId = parameters['space-id'];
  const startTime = parameters['start-time'];
  const endTime = parameters['end-time'] || calculateEndTime(startTime, parameters.duration);
  
  // Calculate duration and total price
  const duration = calculateDuration(startTime, endTime);
  const totalPrice = await calculateTotalPrice(spaceId, duration);

  const fulfillmentText = `Great! Let me confirm your booking:\n\n` +
    `📍 **${parameters['space-title']}**\n` +
    `📅 Start: ${formatDateTime(startTime)}\n` +
    `📅 End: ${formatDateTime(endTime)}\n` +
    `⏱️ Duration: ${duration} hours\n` +
    `💰 Total: KSH ${totalPrice}\n\n` +
    `Is this correct?`;

  return {
    fulfillmentText,
    outputContexts: [
      {
        name: 'booking-confirmation',
        lifespanCount: 3,
        parameters: {
          'space-id': spaceId,
          'start-time': startTime,
          'end-time': endTime,
          duration,
          'total-price': totalPrice
        }
      }
    ]
  };
}

// Handler: Initiate M-Pesa payment
async function handleMpesaPayment(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  const phoneNumber = parameters['phone-number'];
  const totalPrice = parameters['total-price'];
  const bookingId = parameters['booking-id'];

  try {
    // Call M-Pesa STK Push API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/stk-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        amount: totalPrice,
        accountReference: bookingId || `BK${Date.now()}`
      })
    });

    const data = await response.json();

    if (data.ResponseCode === '0') {
      return {
        fulfillmentText: `Processing M-Pesa STK Push to ${phoneNumber} for KSH ${totalPrice}. Please check your phone and enter your M-Pesa PIN to complete the payment. 📱`,
        outputContexts: [
          {
            name: 'payment-processing',
            lifespanCount: 5,
            parameters: {
              'booking-id': bookingId,
              'phone-number': phoneNumber,
              'checkout-request-id': data.CheckoutRequestID,
              'merchant-request-id': data.MerchantRequestID
            }
          }
        ]
      };
    } else {
      return {
        fulfillmentText: `Payment initiation failed: ${data.ResponseDescription}. Please try again or use a different payment method.`
      };
    }
  } catch (error) {
    console.error('M-Pesa payment error:', error);
    return {
      fulfillmentText: "There was an error processing your payment. Please try again later."
    };
  }
}

// Handler: View user bookings
async function handleViewBookings(userId: string): Promise<DialogflowResponse> {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('driverId', '==', userId));
    const snapshot = await getDocs(q);

    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const activeBookings = bookings.filter(b => b.status === 'active');
    const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
    const completedBookings = bookings.filter(b => b.status === 'completed');

    const activeList = activeBookings.map(b => 
      `${b.id} - ${b.spaceTitle} (${formatDateTime(b.startTime)} - ${formatDateTime(b.endTime)})`
    ).join('\n');

    const upcomingList = upcomingBookings.slice(0, 3).map(b => 
      `${b.id} - ${b.spaceTitle} (${formatDateTime(b.startTime)})`
    ).join('\n');

    const fulfillmentText = `Here are your bookings:\n\n` +
      `**Active Bookings:**\n${activeList || 'None'}\n\n` +
      `**Upcoming:**\n${upcomingList || 'None'}\n\n` +
      `Type a booking ID to see details or cancel.`;

    return {
      fulfillmentText,
      outputContexts: [
        {
          name: 'viewing-bookings',
          lifespanCount: 5,
          parameters: {
            'active-bookings': activeBookings,
            'upcoming-bookings': upcomingBookings,
            'completed-bookings': completedBookings
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

// Handler: Cancel booking request
async function handleCancelBookingRequest(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  const bookingId = parameters['booking-id'];

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return {
        fulfillmentText: "Sorry, I couldn't find that booking. Please check the booking ID and try again."
      };
    }

    const booking = bookingDoc.data();
    
    // Calculate refund amount based on cancellation policy
    const refundAmount = calculateRefundAmount(booking);

    const fulfillmentText = `Are you sure you want to cancel booking ${bookingId}?\n\n` +
      `📍 ${booking.spaceTitle}\n` +
      `📅 ${formatDateTime(booking.startTime)} to ${formatDateTime(booking.endTime)}\n` +
      `💰 Paid: KSH ${booking.totalPrice}\n\n` +
      `Refund: KSH ${refundAmount}\n\n` +
      `Type 'confirm' to proceed with cancellation.`;

    return {
      fulfillmentText,
      outputContexts: [
        {
          name: 'canceling-booking',
          lifespanCount: 2,
          parameters: {
            'booking-id': bookingId,
            'refund-amount': refundAmount
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching booking for cancellation:', error);
    throw error;
  }
}

// Handler: Confirm booking cancellation
async function handleCancelBookingConfirm(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  const bookingId = parameters['booking-id'];
  const refundAmount = parameters['refund-amount'];

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      refundAmount
    });

    return {
      fulfillmentText: `✅ Booking ${bookingId} has been cancelled. Refund of KSH ${refundAmount} will be processed within 3-5 business days.`
    };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return {
      fulfillmentText: "There was an error cancelling your booking. Please contact support."
    };
  }
}

// Handler: Add space location validation
async function handleAddSpaceLocation(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  const address = parameters.address;

  // In production, validate address using Google Geocoding API
  // For now, accept any address
  
  return {
    fulfillmentText: `Got it! Address: ${address}\n\nNow, what type of parking space is it?\n1. Driveway\n2. Garage\n3. Parking Lot\n4. Street Parking`,
    outputContexts: [
      {
        name: 'adding-space-type',
        lifespanCount: 10,
        parameters: {
          address,
          location: address
        }
      }
    ]
  };
}

// Handler: Publish new parking space
async function handlePublishSpace(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  try {
    const newSpace = {
      hostId: userId,
      address: parameters.address,
      spaceType: parameters['space-type'],
      pricePerHour: parameters['hourly-rate'],
      pricePerDay: parameters['daily-rate'] || null,
      features: parameters.features.split(',').map((f: string) => f.trim()),
      title: parameters.title,
      description: parameters.description,
      availability: 'available',
      rating: 0,
      reviewCount: 0,
      createdAt: serverTimestamp()
    };

    const spacesRef = collection(db, 'parkingSpaces');
    const docRef = await addDoc(spacesRef, newSpace);

    return {
      fulfillmentText: `🎉 Congratulations! Your parking space has been listed successfully!\n\n**Listing ID:** ${docRef.id}\n\nYou can now start receiving bookings. Manage your space from the Host Dashboard. Good luck! 💰`
    };
  } catch (error) {
    console.error('Error publishing space:', error);
    return {
      fulfillmentText: "There was an error publishing your parking space. Please try again or contact support."
    };
  }
}

// Handler: View host earnings
async function handleViewEarnings(userId: string): Promise<DialogflowResponse> {
  try {
    // Query completed bookings for this host
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('hostId', '==', userId),
      where('status', '==', 'completed')
    );
    const snapshot = await getDocs(q);

    const completedBookings = snapshot.docs.map(doc => doc.data());
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.totalPrice * 0.85), 0); // 85% after commission
    
    // Calculate monthly earnings
    const thisMonth = new Date().getMonth();
    const monthlyBookings = completedBookings.filter(b => 
      new Date(b.completedAt).getMonth() === thisMonth
    );
    const monthlyEarnings = monthlyBookings.reduce((sum, b) => sum + (b.totalPrice * 0.85), 0);

    return {
      fulfillmentText: `Here's your earnings summary:\n\n` +
        `💰 **Total Earnings:** KSH ${totalEarnings.toFixed(2)}\n` +
        `📅 **This Month:** KSH ${monthlyEarnings.toFixed(2)}\n` +
        `📊 **Completed Bookings:** ${completedBookings.length}\n\n` +
        `Would you like to see a detailed breakdown?`
    };
  } catch (error) {
    console.error('Error fetching earnings:', error);
    throw error;
  }
}

// Handler: Manage spaces
async function handleManageSpaces(userId: string): Promise<DialogflowResponse> {
  try {
    const spacesRef = collection(db, 'parkingSpaces');
    const q = query(spacesRef, where('hostId', '==', userId));
    const snapshot = await getDocs(q);

    const spaces = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const spacesList = spaces.map((space, index) => 
      `${index + 1}. **${space.title}** - KSH ${space.pricePerHour}/hr - ${space.availability}`
    ).join('\n');

    return {
      fulfillmentText: `Here are your parking spaces:\n\n${spacesList}\n\nType a space number to view details or edit.`,
      outputContexts: [
        {
          name: 'managing-spaces',
          lifespanCount: 5,
          parameters: {
            'spaces-list': spaces,
            'spaces-count': spaces.length
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching spaces:', error);
    throw error;
  }
}

// Handler: Submit review
async function handleSubmitReview(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  try {
    const review = {
      spaceId: parameters['space-id'],
      bookingId: parameters['booking-id'],
      driverId: userId,
      rating: parameters.rating,
      comment: parameters.comment || '',
      createdAt: serverTimestamp(),
      helpful: 0,
      reported: false
    };

    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, review);

    // Update space rating
    // (In production, this would be done via Cloud Function)

    return {
      fulfillmentText: `✅ Review submitted! Thank you for your feedback.\n\n` +
        `⭐ ${parameters.rating} stars\n` +
        `💬 "${parameters.comment}"\n\n` +
        `Your review helps the ParkShare community!`
    };
  } catch (error) {
    console.error('Error submitting review:', error);
    return {
      fulfillmentText: "There was an error submitting your review. Please try again."
    };
  }
}

// Handler: Support escalation
async function handleSupportEscalation(
  parameters: Record<string, any>,
  userId: string
): Promise<DialogflowResponse> {
  try {
    const ticket = {
      userId,
      category: parameters.category || 'general',
      description: parameters['issue-description'] || 'No description provided',
      status: 'open',
      createdAt: serverTimestamp()
    };

    const ticketsRef = collection(db, 'supportTickets');
    const docRef = await addDoc(ticketsRef, ticket);

    return {
      fulfillmentText: `I've escalated your issue to our human support team.\n\n` +
        `**Ticket #${docRef.id}**\n\n` +
        `Contact options:\n` +
        `📧 support@parkshare.com\n` +
        `📱 +254712345678\n\n` +
        `We'll get back to you soon!`
    };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return {
      fulfillmentText: "There was an error creating your support ticket. Please email support@parkshare.com directly."
    };
  }
}

// Helper functions
function calculateEndTime(startTime: any, duration: any): Date {
  const start = new Date(startTime);
  const durationHours = parseInt(duration) || 4; // default 4 hours
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000);
}

function calculateDuration(startTime: any, endTime: any): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

async function calculateTotalPrice(spaceId: string, durationHours: number): Promise<number> {
  try {
    const spaceRef = doc(db, 'parkingSpaces', spaceId);
    const spaceDoc = await getDoc(spaceRef);
    
    if (spaceDoc.exists()) {
      const space = spaceDoc.data();
      return space.pricePerHour * durationHours;
    }
    return 0;
  } catch (error) {
    console.error('Error calculating price:', error);
    return 0;
  }
}

function calculateRefundAmount(booking: any): number {
  const now = new Date();
  const startTime = new Date(booking.startTime);
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart > 24) {
    return booking.totalPrice; // Full refund
  } else if (hoursUntilStart > 12) {
    return booking.totalPrice * 0.5; // 50% refund
  } else {
    return 0; // No refund
  }
}

function formatDateTime(dateTime: any): string {
  const date = new Date(dateTime);
  return date.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}



