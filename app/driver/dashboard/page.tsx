"use client"

import { useEffect, useState, useCallback } from "react"
import { DriverDashboardNav } from "@/components/driver/dashboard-nav"
import { SearchBar, type FilterOptions } from "@/components/driver/search-bar"
import { MapView } from "@/components/driver/map-view"
import { ParkingList } from "@/components/driver/parking-list"
import { BookingModal } from "@/components/driver/booking-modal"
import type { ParkingSpace } from "@/lib/types/parking"
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/contexts/firebase-context"
import { getParkingSpaces, searchParkingSpaces } from "@/lib/firebase/parking"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, MapPin, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function DriverDashboard() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>([])
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [bookingSpace, setBookingSpace] = useState<ParkingSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const { user, userProfile, loading: authLoading } = useAuth()
  const { db } = useFirebase() // useFirebase now throws if not initialized
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadSpaces = async () => {
      if (!db) {
        console.error("[Driver Dashboard] Firestore instance not available");
        setMapError("Firestore not initialized. Please refresh the page.");
        setLoading(false);
        return;
      }

      if (unsubscribe) unsubscribe(); // Clean up previous listener
      try {
        console.log("[Driver Dashboard] Setting up listener for available spaces...");
        unsubscribe = await getParkingSpaces(db, (newSpaces) => {
          console.log("[Driver Dashboard] Received spaces:", newSpaces.length);
          setSpaces(newSpaces);
          setFilteredSpaces(newSpaces); // Sync filteredSpaces with latest data
          setLoading(false);
        });
      } catch (error) {
        console.error("[Driver Dashboard] Error setting up listener:", error);
        setMapError("Failed to load parking spaces. Please try again.");
        toast({
          title: "Connection Error",
          description: "Unable to load available spaces",
          variant: "destructive",
        });
        setLoading(false); // Ensure loading stops on error
      }
    };

    loadSpaces();

    const handleSpaceCreated = () => {
      console.log("[Driver Dashboard] New space available, refreshing...");
      loadSpaces();
    };

    window.addEventListener('space:created', handleSpaceCreated);
    window.addEventListener('focus', loadSpaces);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('space:created', handleSpaceCreated);
      window.removeEventListener('focus', loadSpaces);
    };
  }, [db, toast]);

  const handleSearch = useCallback(async (query: string, filters?: FilterOptions) => {
    if (!db) {
      console.error("[Driver Dashboard] Firestore instance not available during search");
      toast({
        title: "Search Error",
        description: "Firestore not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let unsubscribe: (() => void) | undefined;
      unsubscribe = await searchParkingSpaces(db, query, (newSpaces) => {
        let filtered = [...newSpaces]; // Work with a copy to avoid mutation issues
        if (filters) {
          const applyFilters = (spaces: ParkingSpace[]) => {
            return spaces.filter(space => {
              if (filters.spaceTypes?.length && !filters.spaceTypes.includes(space.spaceType || '')) return false;
              if (filters.priceRange && space.pricePerHour) {
                if (space.pricePerHour < filters.priceRange[0] || space.pricePerHour > filters.priceRange[1]) return false;
              }
              if (filters.minRating && space.rating) {
                if (space.rating < filters.minRating) return false;
              }
              if (filters.features?.length && space.features) {
                const hasRequiredFeatures = filters.features.some(feat => (space.features || []).includes(feat));
                if (!hasRequiredFeatures) return false;
              }
              return true;
            });
          };
          filtered = applyFilters(filtered);
        }
        setFilteredSpaces(filtered);
        console.log("[Driver Dashboard] Filtered to", filtered.length, "spaces");
      });

    } catch (error) {
      console.error("[Driver Dashboard] Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search parking spaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [db, toast]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading parking spaces...</p>
        </div>
      </div>
    )
  }

  if (!user || userProfile?.role !== "driver") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Driver account required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DriverDashboardNav />
      
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
                        setMapError(null);
                        loadSpaces();
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

          {!loading && (
            <div className="grid lg:grid-cols-[1fr_400px] gap-6">
              <div className="lg:order-1 h-[500px] lg:h-[calc(100vh-300px)]">
                <MapView
                  spaces={filteredSpaces}
                  selectedSpace={selectedSpace}
                  onSpaceSelect={setSelectedSpace}
                />
              </div>
              
              <div className="lg:order-2">
                <ParkingList
                  spaces={filteredSpaces}
                  onSpaceSelect={setSelectedSpace}
                  selectedSpace={selectedSpace}
                  onBookNow={setBookingSpace}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <BookingModal 
        space={bookingSpace} 
        open={!!bookingSpace} 
        onClose={() => setBookingSpace(null)} 
      />
    </div>
  )
}