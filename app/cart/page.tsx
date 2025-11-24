"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PublicDashboardNav } from "@/components/driver/public-dashboard-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Trash2, ShoppingCart, AlertCircle } from "lucide-react"
import { getCart, removeFromCart, clearCart } from "@/lib/utils/cart"
import type { CartItem } from "@/lib/types/cart"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { BookingModal } from "@/components/driver/booking-modal"
import { releaseSpot } from "@/lib/firebase/spot-reservation"
import { useFirebase } from "@/contexts/firebase-context"

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { db } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const cart = getCart()
    setCartItems(cart.items)
    
    // Check for expired reservations
    const now = new Date()
    const validItems = cart.items.filter(item => item.reservedUntil > now)
    
    if (validItems.length !== cart.items.length) {
      // Some items expired, remove them
      const expiredItems = cart.items.filter(item => item.reservedUntil <= now)
      expiredItems.forEach(item => {
        removeFromCart(item.spaceId, item.spotLabel)
        // Release the spot in Firestore
        if (db) {
          releaseSpot(db, item.spaceId, item.spotLabel).catch(console.error)
        }
      })
      setCartItems(validItems)
      toast({
        title: "Reservation expired",
        description: "Some items in your cart have expired and were removed",
        variant: "destructive",
      })
    }

    // Check if user just signed in and should proceed to checkout
    const checkoutParam = searchParams?.get("checkout")
    if (user && checkoutParam && cart.items.length > 0) {
      // Find the item to checkout
      const [spaceId, spotLabel] = checkoutParam.split("-")
      const itemToCheckout = cart.items.find(
        item => item.spaceId === spaceId && item.spotLabel === spotLabel
      )
      if (itemToCheckout) {
        // Small delay to ensure auth state is fully loaded
        setTimeout(() => {
          handleCheckout(itemToCheckout).catch(console.error)
        }, 500)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, toast, user, searchParams])

  const handleRemove = async (item: CartItem) => {
    setLoading(true)
    
    // Always remove from cart first (localStorage) for better UX
    removeFromCart(item.spaceId, item.spotLabel)
    const updatedCart = getCart()
    setCartItems(updatedCart.items)
    
    // Try to release spot in Firestore (optional - don't fail if this doesn't work)
    if (db) {
      try {
        await releaseSpot(db, item.spaceId, item.spotLabel)
        toast({
          title: "Removed from cart",
          description: `Spot ${item.spotLabel} has been released and is now available`,
        })
      } catch (error: any) {
        // Spot removed from cart, but Firestore update failed
        // This is okay - the spot will be available when the reservation expires
        console.error("[Cart] Error releasing spot in Firestore:", error)
        toast({
          title: "Removed from cart",
          description: `Spot ${item.spotLabel} removed from your cart. It will become available when the reservation expires.`,
        })
      }
    } else {
      toast({
        title: "Removed from cart",
        description: `Spot ${item.spotLabel} has been removed from your cart`,
      })
    }
    
    setLoading(false)
  }

  const handleCheckout = async (item: CartItem) => {
    if (!user) {
      // Redirect to sign-in with cart item info
      router.push(`/login?redirect=/cart&checkout=${item.spaceId}-${item.spotLabel}`)
      return
    }
    
    // If spot wasn't reserved in Firestore yet, reserve it now
    if (db) {
      try {
        const { reserveSpot } = await import("@/lib/firebase/spot-reservation")
        await reserveSpot(db, item.spaceId, item.spotLabel, item.reservedUntil)
      } catch (error) {
        console.error("[Cart] Error reserving spot:", error)
        // Continue anyway - spot will be reserved during booking creation
      }
    }
    
    // Open booking modal with pre-filled data
    setSelectedItem(item)
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <PublicDashboardNav />
        <div className="pt-16 container mx-auto p-6 max-w-4xl">
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add parking spots to your cart to continue
              </p>
              <Button onClick={() => router.push("/")}>
                Browse Parking Spaces
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicDashboardNav />
      <div className="pt-16 container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

        <div className="space-y-4 mb-6">
          {cartItems.map((item) => {
            const timeLeft = Math.max(0, Math.floor((item.reservedUntil.getTime() - Date.now()) / 1000 / 60))
            const isExpired = timeLeft === 0

            return (
              <Card key={`${item.spaceId}-${item.spotLabel}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Space Image */}
                    {item.space.images && item.space.images.length > 0 && (
                      <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.space.images[0]}
                          alt={item.space.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{item.space.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            {item.space.address}
                          </div>
                        </div>
                        <Badge variant="outline">Spot {item.spotLabel}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {new Date(`${item.startDate}T${item.startTime}`).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          <span className="font-medium">{item.duration} hours</span>
                        </div>
                      </div>

                      {isExpired ? (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>Reservation expired</span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Reservation expires in {timeLeft} minutes
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-2xl font-bold text-primary">
                          KES {item.totalPrice.toFixed(0)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRemove(item).catch((error) => {
                                console.error("[Cart] Remove error:", error)
                                toast({
                                  title: "Error",
                                  description: "Failed to remove item. Please try again.",
                                  variant: "destructive",
                                })
                              })
                            }}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {loading ? "Removing..." : "Remove"}
                          </Button>
                          <Button
                            onClick={() => handleCheckout(item)}
                            disabled={isExpired}
                          >
                            {user ? "Pay Now" : "Sign In to Pay"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-lg">
              <span>Total</span>
              <span className="font-bold text-2xl text-primary">
                KES {totalAmount.toFixed(0)}
              </span>
            </div>
            {!user && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You need to sign in to complete your purchase
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Modal for authenticated users */}
      {selectedItem && user && (
        <BookingModal
          space={selectedItem.space}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          preSelectedSpot={selectedItem.spotLabel}
          preFilledData={{
            startDate: selectedItem.startDate,
            startTime: selectedItem.startTime,
            duration: selectedItem.duration,
          }}
        />
      )}
    </div>
  )
}

