"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Car, MapPin, Calendar, User, LogOut, MessageSquare, Menu } from "lucide-react"
import { signOut } from "@/lib/firebase/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/contexts/firebase-context"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function DriverDashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { userProfile } = useAuth()
  const { auth } = useFirebase()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth)
      router.push("/")
    }
  }

  const navItems = [
    { href: "/driver/dashboard", label: "Find Parking", icon: MapPin },
    { href: "/driver/bookings", label: "My Bookings", icon: Calendar },
    { href: "/driver/profile", label: "Profile", icon: User },
    { href: "/driver/support", label: "Support", icon: MessageSquare },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/driver/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary font-sans">ParkShare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant={pathname === item.href ? "default" : "ghost"} className="gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{userProfile?.displayName}</p>
              <p className="text-xs text-muted-foreground">Driver</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Menu</h2>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="mb-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{userProfile?.displayName}</p>
                      <p className="text-xs text-muted-foreground">Driver</p>
                    </div>

                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant={pathname === item.href ? "default" : "ghost"}
                          className="w-full justify-start gap-3"
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 bg-transparent"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
