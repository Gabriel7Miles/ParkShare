// app/driver/dashboard/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { DriverDashboardNav } from "@/components/driver/dashboard-nav"
import { SearchBar, type FilterOptions } from "@/components/driver/search-bar"
import { MapView } from "@/components/driver/map-view"
import { ParkingList } from "@/components/driver/parking-list"
import { BookingModal } from "@/components/driver/booking-modal"
import type { ParkingSpace } from "@/lib/types/parking"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"

export default function DriverDashboard() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>([])
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [bookingSpace, setBookingSpace] = useState<ParkingSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()

  // ✅ AUTH REDIRECT
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      if (userProfile?.role === "host") {
        router.push("/host/dashboard")
      }
    }
  }, [user, userProfile, authLoading, router])

  // ✅ LOAD SPACES (Replace with real API call later)
  useEffect(() => {
    loadSpaces()
  }, [])

  const loadSpaces = async () => {
    setLoading(true)
    setMapError(null)
    try {
      console.log("[Dashboard] Loading parking spaces...")
      
      // TODO: Replace with real API call
      // const response = await fetch('/api/spaces/available')
      // const data = await response.json()
      
      const mockSpaces: ParkingSpace[] = [
        {
          id: "1",
          hostId: "host1",
          hostName: "John Smith",
          hostPhone: "+254 712 345 678",
          title: "Downtown Garage - Covered Parking",
          description: "Secure covered parking in the heart of downtown. Perfect for daily commuters.",
          address: "123 Main St, Nairobi, Kenya",
          location: { lat: -1.2864, lng: 36.8172 },
          pricePerHour: 850,
          pricePerDay: 4500,
          availability: "available",
          features: ["Covered", "24/7 Access", "Security Camera", "EV Charging"],
          images: [],
          rating: 4.8,
          reviewCount: 127,
          spaceType: "garage",
          vehicleTypes: ["sedan", "suv", "truck"],
          numberOfSpaces: 5,
          createdAt: new Date(),
        },
        {
          id: "2",
          hostId: "host2",
          hostName: "Sarah Johnson",
          hostPhone: "+254 723 456 789",
          title: "Westlands Driveway - Easy Access",
          description: "Private driveway with easy in/out access. Close to shopping centers.",
          address: "456 Waiyaki Way, Westlands, Nairobi",
          location: { lat: -1.2676, lng: 36.807 },
          pricePerHour: 600,
          pricePerDay: 3500,
          availability: "available",
          features: ["Private", "Well-lit", "Close to Transit"],
          images: [],
          rating: 4.5,
          reviewCount: 89,
          spaceType: "driveway",
          vehicleTypes: ["sedan", "suv"],
          numberOfSpaces: 2,
          createdAt: new Date(),
        },
        {
          id: "3",
          hostId: "host3",
          hostName: "Mike Davis",
          hostPhone: "+254 734 567 890",
          title: "CBD Parking Lot - Monthly Available",
          description: "Large parking lot with monthly rates available. Perfect for office workers.",
          address: "789 Kenyatta Avenue, CBD, Nairobi",
          location: { lat: -1.2841, lng: 36.8155 },
          pricePerHour: 1000,
          pricePerDay: 5500,
          pricePerMonth: 45000,
          availability: "available",
          features: ["Covered", "Security Camera", "24/7 Access"],
          images: [],
          rating: 4.9,
          reviewCount: 203,
          spaceType: "lot",
          vehicleTypes: ["sedan", "suv", "truck", "motorcycle"],
          numberOfSpaces: 20,
          createdAt: new Date(),
        },
      ]

      setSpaces(mockSpaces)
      setFilteredSpaces(mockSpaces)
      console.log(`[Dashboard] Loaded ${mockSpaces.length} spaces`)
    } catch (error) {
      console.error("[Dashboard] Error loading spaces:", error)
      setMapError("Failed to load parking spaces")
    } finally {
      setLoading(false)
    }
  }

  // ✅ SEARCH & FILTER
  const handleSearch = useCallback(async (query: string, filters?: FilterOptions) => {
    setLoading(true)
    try {
      let results = [...spaces]

      // Text search
      if (query.trim()) {
        const searchTerm = query.toLowerCase()
        results = results.filter((space) =>
          space.title.toLowerCase().includes(searchTerm) ||
          space.address.toLowerCase().includes(searchTerm) ||
          space.description.toLowerCase().includes(searchTerm)
        )
      }

      // Filters
      if (filters) {
        if (filters.spaceTypes?.length > 0) {
          results = results.filter((space) => 
            filters.spaceTypes.includes(space.spaceType)
          )
        }

        if (filters.features?.length > 0) {
          results = results.filter((space) => 
            filters.features.some((feature) => 
              space.features?.includes(feature)
            )
          )
        }

        if (filters.vehicleTypes?.length > 0) {
          results = results.filter((space) => 
            filters.vehicleTypes.some((type) => 
              space.vehicleTypes?.includes(type)
            )
          )
        }

        if (filters.priceRange) {
          results = results.filter((space) => 
            space.pricePerHour >= filters.priceRange[0] && 
            space.pricePerHour <= filters.priceRange[1]
          )
        }

        if (filters.minRating && filters.minRating > 0) {
          results = results.filter((space) => 
            space.rating >= filters.minRating!
          )
        }
      }

      setFilteredSpaces(results)
      console.log(`[Dashboard] Filtered to ${results.length} spaces`)
    } catch (error) {
      console.error("[Dashboard] Search error:", error)
    } finally {
      setLoading(false)
    }
  }, [spaces])

  // AUTH LOADING
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // AUTH CHECK
  if (!user || userProfile?.role !== "driver") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please log in as a driver</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DriverDashboardNav />
      
      <div className="pt-16">
        <div className="container mx-auto p-4 max-w-7xl">
          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Find Parking Near You</h1>
            <p className="text-muted-foreground">Discover and book secure parking spaces</p>
          </div>

          {/* SEARCH BAR */}
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* ERROR STATE */}
          {mapError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive">{mapError}</span>
                <button
                  onClick={loadSpaces}
                  className="ml-auto text-sm text-primary hover:underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* CONTENT */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Loading parking spaces...</p>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_400px] gap-6">
              {/* LIST VIEW */}
              <div className="lg:order-2">
                <ParkingList
                  spaces={filteredSpaces}
                  onSpaceSelect={setSelectedSpace}
                  selectedSpace={selectedSpace}
                  onBookNow={setBookingSpace}
                />
              </div>

              {/* MAP VIEW */}
              <div className="lg:order-1 h-[500px] lg:h-[calc(100vh-280px)]">
                <MapView
                  spaces={filteredSpaces}
                  selectedSpace={selectedSpace}
                  onSpaceSelect={setSelectedSpace}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOOKING MODAL */}
      <BookingModal 
        space={bookingSpace} 
        open={!!bookingSpace} 
        onClose={() => setBookingSpace(null)} 
      />
    </div>
  )
}