"use client"

import { useEffect, useState } from "react"
import { HostDashboardNav } from "@/components/host/dashboard-nav"
import { SpaceCard } from "@/components/host/space-card"
import { getHostSpaces, deleteParkingSpace } from "@/lib/firebase/host"
import type { ParkingSpace } from "@/lib/types/parking"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function HostDashboard() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [loading, setLoading] = useState(true)
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (userProfile?.role === "driver") {
      router.push("/driver/dashboard")
    }
  }, [user, userProfile, authLoading, router])

  useEffect(() => {
    if (user) {
      loadSpaces()
    }
  }, [user])

  const loadSpaces = async () => {
    if (!user) return
    setLoading(true)
    try {
      const hostSpaces = await getHostSpaces(user.uid)
      setSpaces(hostSpaces)
    } catch (error) {
      console.error("[v0] Error loading spaces:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (spaceId: string) => {
    if (!confirm("Are you sure you want to delete this space?")) return

    try {
      await deleteParkingSpace(spaceId)
      setSpaces(spaces.filter((s) => s.id !== spaceId))
      toast({
        title: "Space deleted",
        description: "Your parking space has been removed",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (authLoading || !user || userProfile?.role !== "host") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <HostDashboardNav />

      <div className="pt-16">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 font-sans">My Parking Spaces</h1>
              <p className="text-muted-foreground">Manage your listed parking spaces</p>
            </div>
            <Link href="/host/add-space">
              <Button className="gap-2 bg-success hover:bg-success/90">
                <Plus className="w-4 h-4" />
                Add New Space
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : spaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
              <Plus className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No parking spaces yet</p>
              <p className="text-sm text-muted-foreground mb-4">Add your first space to start earning</p>
              <Link href="/host/add-space">
                <Button className="bg-success hover:bg-success/90">Add Your First Space</Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  onEdit={(space) => router.push(`/host/edit-space/${space.id}`)}
                  onDelete={handleDelete}
                  onView={(space) => router.push(`/host/space/${space.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
