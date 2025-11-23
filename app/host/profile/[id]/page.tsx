"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useFirebase } from "@/contexts/firebase-context"
import { getUserProfile } from "@/lib/firebase/auth"
import type { UserProfile } from "@/lib/types/profile"
import { 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Star,
  MapPin,
  TrendingUp,
  ArrowLeft,
  Loader2,
  User
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { collection, query, where, getDocs } from "firebase/firestore"
import type { ParkingSpace } from "@/lib/types/parking"

export default function PublicHostProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { db } = useFirebase()
  const { toast } = useToast()
  const [hostProfile, setHostProfile] = useState<UserProfile | null>(null)
  const [hostListings, setHostListings] = useState<ParkingSpace[]>([])
  const [loading, setLoading] = useState(true)

  const loadHostProfile = useCallback(async () => {
    if (!db) {
      setLoading(false)
      toast({
        title: "Error",
        description: "Database not initialized",
        variant: "destructive",
      })
      return
    }

    const hostId = params.id as string
    if (!hostId) {
      setLoading(false)
      toast({
        title: "Error",
        description: "Invalid host ID",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Fetch host profile
      const profile = await getUserProfile(db, hostId)
      if (!profile) {
        toast({
          title: "Error",
          description: "Host profile not found",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setHostProfile(profile)

      // Fetch host's listings
      try {
        const listingsQuery = query(
          collection(db, "parkingSpaces"),
          where("hostId", "==", hostId),
          where("status", "==", "active")
        )
        const listingsSnapshot = await getDocs(listingsQuery)
        const listings = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ParkingSpace[]
        setHostListings(listings)
      } catch (listingsError) {
        console.warn("Failed to load listings:", listingsError)
      }
    } catch (error) {
      console.error("Error loading host profile:", error)
      toast({
        title: "Error",
        description: "Failed to load host profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [db, params.id, toast])

  useEffect(() => {
    loadHostProfile()
  }, [loadHostProfile])

  // Format member since date
  const formatMemberSince = (createdAt: any) => {
    if (!createdAt) return "Unknown"
    
    let date: Date
    if (createdAt.toDate) {
      date = createdAt.toDate()
    } else if (createdAt instanceof Date) {
      date = createdAt
    } else if (typeof createdAt === "string") {
      date = new Date(createdAt)
    } else {
      return "Unknown"
    }

    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!hostProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 max-w-4xl pt-24">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Host profile not found</p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const initials = hostProfile.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4 max-w-5xl pt-8 pb-16">
        {/* Back button */}
        <Button onClick={() => router.back()} variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="space-y-6">
          {/* Profile Header Card */}
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={hostProfile.profilePicture} alt={hostProfile.displayName} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                      <h1 className="text-3xl font-bold">{hostProfile.displayName}</h1>
                      {hostProfile.hostVerified && (
                        <Badge className="bg-success gap-1">
                          <Shield className="w-3 h-3" />
                          Verified Host
                        </Badge>
                      )}
                    </div>
                    {hostProfile.roles.includes("host") && (
                      <p className="text-sm text-muted-foreground mt-1">Professional Host</p>
                    )}
                  </div>

                  {/* Bio */}
                  {hostProfile.bio && (
                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                      {hostProfile.bio}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm justify-center md:justify-start">
                    {hostProfile.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{hostProfile.email}</span>
                      </div>
                    )}
                    {hostProfile.phoneNumber && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{hostProfile.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {formatMemberSince(hostProfile.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Active Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{hostProfile.totalListings || hostListings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {hostListings.length} currently available
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-success">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  KES {hostProfile.totalEarnings?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All-time earnings</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Host Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">4.8</div>
                  <Star className="w-5 h-5 fill-accent text-accent" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Based on reviews</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Listings */}
          {hostListings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Available Parking Spaces ({hostListings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hostListings.map((listing) => (
                    <Link key={listing.id} href={`/driver/space/${listing.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                        <div className="relative">
                          {listing.images && listing.images[0] && (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-40 object-cover rounded-t-lg"
                            />
                          )}
                          <Badge className="absolute top-2 right-2 bg-success">
                            Available
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                            {listing.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {listing.address}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              KES {listing.pricePerHour}/hr
                            </span>
                            {listing.totalSpots && (
                              <span className="text-sm text-muted-foreground">
                                {listing.totalSpots} spots
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                About {hostProfile.displayName?.split(" ")[0]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Response Time</h3>
                  <p className="text-sm text-muted-foreground">Usually within an hour</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Languages</h3>
                  <p className="text-sm text-muted-foreground">English, Swahili</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-sm text-muted-foreground">Nairobi, Kenya</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Account Type</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {hostProfile.roles.includes("host") && hostProfile.roles.includes("driver")
                        ? "Host & Driver"
                        : hostProfile.roles.includes("host")
                        ? "Host"
                        : "Driver"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Notice */}
          <Card className="bg-muted/50 border-muted">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Safety & Trust</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All hosts on ParkShare are verified. We recommend communicating and paying through
                    our platform for your protection. Never transfer money or communicate outside of
                    ParkShare.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


