"use client"

import { useEffect, useState, useCallback } from "react"
import { HostDashboardNav } from "@/components/host/dashboard-nav"
import { SpaceCard } from "@/components/host/space-card"
import { 
  getHostSpaces, 
  deleteParkingSpace 
} from "@/lib/firebase/host"
import type { ParkingSpace } from "@/lib/types/parking"
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/contexts/firebase-context"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Users, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function HostDashboard() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true) // Controlled separately
  const { user, userProfile, loading: authLoading } = useAuth()
  const { db, storage } = useFirebase()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadSpaces = async () => {
      if (unsubscribe) unsubscribe(); // Clean up previous listener
      if (user && db && storage && userProfile?.role === "host") {
        try {
          console.log("[Host Dashboard] Setting up listener for host:", user.uid);
          setStatsLoading(true); // Start loading stats when fetching new data
          unsubscribe = await getHostSpaces(db, user.uid, (newSpaces) => {
            console.log("[Host Dashboard] Received spaces:", newSpaces.length);
            setSpaces(newSpaces);
            setLoading(false); // General loading complete
            setStatsLoading(false); // Stats loading complete once data is received
          });
        } catch (error) {
          console.error("[Host Dashboard] Error setting up listener:", error);
          toast({
            title: "Error Loading Spaces",
            description: "Failed to load your parking spaces. Check your connection or Firestore rules.",
            variant: "destructive",
          });
          setLoading(false);
          setStatsLoading(false); // Stop stats loading on error
        }
      } else {
        setLoading(false);
        setStatsLoading(false); // Stop loading if conditions aren't met
      }
    };

    loadSpaces();

    const handleSpaceCreated = () => {
      console.log("[Host Dashboard] New space detected, refreshing...");
      loadSpaces();
    };

    window.addEventListener('space:created', handleSpaceCreated);
    window.addEventListener('focus', loadSpaces);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('space:created', handleSpaceCreated);
      window.removeEventListener('focus', loadSpaces);
    };
  }, [user, db, storage, userProfile, toast]);

  const handleDelete = async (spaceId: string) => {
    if (!confirm("Are you sure you want to delete this space? This will also delete all associated images. This action cannot be undone.")) return

    if (!db || !storage) {
      toast({
        title: "Error",
        description: "Database or storage not available",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`[Host Dashboard] Deleting space ${spaceId} with images...`)
      await deleteParkingSpace(db, storage, spaceId)
      setSpaces(prev => prev.filter(s => s.id !== spaceId))
      toast({
        title: "✅ Space Deleted Successfully",
        description: "Your parking space and all images have been removed.",
      })
      
      window.dispatchEvent(new CustomEvent('space:deleted', { detail: { spaceId } }))
    } catch (error: any) {
      console.error("[Host Dashboard] Delete error:", error)
      toast({
        title: "❌ Delete Failed",
        description: error.message || "Failed to delete space and images",
        variant: "destructive",
      })
    }
  }

  const availableSpaces = spaces.filter(s => s.availability === 'available').length
  const occupiedSpaces = spaces.filter(s => s.availability === 'occupied').length

  if (authLoading || !user || !db || !storage || userProfile?.role !== "host") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-success mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <HostDashboardNav />
      
      <div className="pt-16">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Parking Spaces</h1>
              <p className="text-muted-foreground">
                Manage your {spaces.length} listed parking space{spaces.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href="/host/add-space" className="no-underline">
              <Button className="gap-2 bg-success hover:bg-success/90">
                <Plus className="w-4 h-4" />
                Add New Space
              </Button>
            </Link>
          </div>

          {statsLoading ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <Badge className="text-xs">Total</Badge>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{spaces.length}</div>
                  <div className="text-sm text-muted-foreground">Parking Spaces</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <Badge variant="default" className="bg-success text-success-foreground">Available</Badge>
                  </div>
                  <div className="text-2xl font-bold text-success">{availableSpaces}</div>
                  <div className="text-sm text-muted-foreground">Ready to Book</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-destructive" />
                    </div>
                    <Badge variant="destructive">Occupied</Badge>
                  </div>
                  <div className="text-2xl font-bold text-destructive">{occupiedSpaces}</div>
                  <div className="text-sm text-muted-foreground">Currently Booked</div>
                </CardContent>
              </Card>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-success mx-auto mb-4" />
                <span className="text-muted-foreground">Loading your spaces with images...</span>
              </div>
            </div>
          ) : spaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg border-muted bg-muted/20 p-8 text-center">
              <Plus className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Parking Spaces Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start earning by listing your first parking space with images. Drivers are waiting for secure spots near them!
              </p>
              <Link href="/host/add-space" className="no-underline">
                <Button className="bg-success hover:bg-success/90 gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Space
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-4">
                💡 Tip: Upload clear images of your parking area to attract more bookings
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  onEdit={() => router.push(`/host/edit-space/${space.id}`)}
                  onDelete={handleDelete}
                  onView={() => router.push(`/host/space/${space.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}