"use client"

import { useAuth } from "@/contexts/auth-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function RoleSwitcher() {
  const { user, userProfile, activeRole, setActiveRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  console.log("[RoleSwitcher] userProfile:", userProfile)

  if (!user || !userProfile || !activeRole || userProfile.roles.length < 1) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Label htmlFor="role-switch">Switch Role:</Label>
        <p className="text-sm text-destructive">Profile not loaded. Please try signing out and back in.</p>
      </div>
    )
  }

  const toggleRole = async () => {
    const newRole = activeRole === "driver" ? "host" : "driver"
    try {
      await setActiveRole(newRole)
      router.push(newRole === "driver" ? "/driver/profile" : "/host/profile")
    } catch (error: any) {
      console.error("[RoleSwitcher] Error switching role:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to switch role. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <Label htmlFor="role-switch">Switch Role:</Label>
      <Switch
        id="role-switch"
        checked={activeRole === "host"}
        onCheckedChange={toggleRole}
        disabled={!userProfile.roles.includes("driver") || !userProfile.roles.includes("host")}
      />
      <span>{activeRole === "driver" ? "Driver" : "Host"} Mode</span>
      {userProfile.roles.includes("driver") && userProfile.roles.includes("host") ? (
        <p className="text-sm text-muted-foreground">
          You are registered as both Driver and Host.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          You are only registered as {activeRole} mode.
        </p>
      )}
    </div>
  )
}