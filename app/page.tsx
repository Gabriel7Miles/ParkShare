"use client"

import { useEffect, useState, useCallback } from "react"
import { PublicDashboardNav } from "@/components/driver/public-dashboard-nav"
import { SearchBar, type FilterOptions } from "@/components/driver/search-bar"
import { MapView } from "@/components/driver/map-view"
import { BookingModal } from "@/components/driver/booking-modal"
import { SpotSelectionModal } from "@/components/driver/spot-selection-modal"
import type { ParkingSpace } from "@/lib/types/parking"
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/contexts/firebase-context"
import { getParkingSpaces, searchParkingSpaces } from "@/lib/firebase/parking"
import { useRouter } from "next/navigation"
import { setupAutoReleaseInterval } from "@/lib/firebase/auto-release"
import { Loader2, AlertCircle, MapPin, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>([])
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [bookingSpace, setBookingSpace] = useState<ParkingSpace | null>(null)
  const [spotSelectionSpace, setSpotSelectionSpace] = useState<ParkingSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const { user, userProfile } = useAuth()
  const { db } = useFirebase()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const loadSpaces = async () => {
      if (!db) {
        console.error("[Home] Firestore instance not available")
        setMapError("Firestore not initialized. Please refresh the page.")
        setLoading(false)
        return
      }

      if (unsubscribe) unsubscribe()
      try {
        console.log("[Home] Setting up listener for available spaces...")
        unsubscribe = await getParkingSpaces(db, (newSpaces) => {
          console.log("[Home] Received spaces:", newSpaces.length)
          setSpaces(newSpaces)
          setFilteredSpaces(newSpaces)
          setLoading(false)
        })
      } catch (error) {
        console.error("[Home] Error setting up listener:", error)
        setMapError("Failed to load parking spaces. Please try again.")
        toast({
          title: "Connection Error",
          description: "Unable to load available spaces",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadSpaces()

    const handleSpaceCreated = () => {
      console.log("[Home] New space available, refreshing...")
      loadSpaces()
    }

    window.addEventListener('space:created', handleSpaceCreated)
    window.addEventListener('focus', loadSpaces)

    // Set up auto-release for expired bookings
    let autoReleaseCleanup: (() => void) | undefined
    if (db) {
      autoReleaseCleanup = setupAutoReleaseInterval(db, 60000) // Check every minute
    }

    return () => {
      if (unsubscribe) unsubscribe()
      if (autoReleaseCleanup) autoReleaseCleanup()
      window.removeEventListener('space:created', handleSpaceCreated)
      window.removeEventListener('focus', loadSpaces)
    }
  }, [db, toast])

  const handleSearch = useCallback(async (query: string, filters?: FilterOptions) => {
    if (!db) {
      console.error("[Home] Firestore instance not available during search")
      toast({
        title: "Search Error",
        description: "Firestore not initialized. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let unsubscribe: (() => void) | undefined
      unsubscribe = await searchParkingSpaces(db, query, (newSpaces) => {
        let filtered = [...newSpaces]
        if (filters) {
          const applyFilters = (spaces: ParkingSpace[]) => {
            return spaces.filter(space => {
              if (filters.spaceTypes?.length && !filters.spaceTypes.includes(space.spaceType || '')) return false
              if (filters.priceRange && space.pricePerHour) {
                if (space.pricePerHour < filters.priceRange[0] || space.pricePerHour > filters.priceRange[1]) return false
              }
              if (filters.minRating && space.rating) {
                if (space.rating < filters.minRating) return false
              }
              if (filters.features?.length && space.features) {
                const hasRequiredFeatures = filters.features.some(feat => (space.features || []).includes(feat))
                if (!hasRequiredFeatures) return false
              }
              return true
            })
          }
          filtered = applyFilters(filtered)
        }
        setFilteredSpaces(filtered)
        console.log("[Home] Filtered to", filtered.length, "spaces")
      })

    } catch (error) {
      console.error("[Home] Search error:", error)
      toast({
        title: "Search Error",
        description: "Failed to search parking spaces",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
    return () => { if (unsubscribe) unsubscribe() }
  }, [db, toast])

  const handleBookNow = (space: ParkingSpace) => {
    if (!user) {
      // Show spot selection modal for non-authenticated users
      setSpotSelectionSpace(space)
      return
    }
    // Authenticated users go directly to booking modal
    setBookingSpace(space)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading parking spaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicDashboardNav />
      
      <div className="pt-16">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <MapPin className="w-8 h-8" />
              Find Parking Near You
            </h1>
            <p className="text-muted-foreground">
              {filteredSpaces.length} available spaces • Last updated {new Date().toLocaleTimeString()}
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Search & Filters</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </CardHeader>
            <CardContent>
              <SearchBar onSearch={handleSearch} />
            </CardContent>
          </Card>

          {mapError && (
            <Card className="mb-6 border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">{mapError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMapError(null)
                        window.location.reload()
                      }}
                      className="mt-2"
                    >
                      Retry Loading Spaces
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{filteredSpaces.length}</div>
                <div className="text-sm text-muted-foreground">Available Spaces</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-success">
                  KES {Math.min(...filteredSpaces.map(s => s.pricePerHour || 0)) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Starting Price/Hr</div>
              </CardContent>
            </Card>
          </div>

          {/* Map Section - Full Width on Desktop */}
          <div className="mb-6">
            <div className="h-[400px] lg:h-[500px] w-full">
              <MapView
                spaces={filteredSpaces}
                selectedSpace={selectedSpace}
                onSpaceSelect={setSelectedSpace}
              />
            </div>
          </div>

          {/* Parking Cards Grid - 3 per row on Desktop */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Available Parking Spaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpaces.map((space) => (
                <Card 
                  key={space.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedSpace?.id === space.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => router.push(`/driver/space/${space.id}`)}
                >
                  <CardContent className="p-4">
                    {space.images && space.images.length > 0 && (
                      <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
                        <img 
                          src={space.images[0]} 
                          alt={space.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg mb-2">{space.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{space.address}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-primary">
                        KES {space.pricePerHour}
                        <span className="text-sm font-normal text-muted-foreground">/hr</span>
                      </span>
                      {space.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">{space.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookNow(space)
                      }}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredSpaces.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No parking spaces found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BookingModal 
        space={bookingSpace} 
        open={!!bookingSpace} 
        onClose={() => setBookingSpace(null)} 
      />
      <SpotSelectionModal
        space={spotSelectionSpace}
        open={!!spotSelectionSpace}
        onClose={() => setSpotSelectionSpace(null)}
      />
    </div>
  )
}
