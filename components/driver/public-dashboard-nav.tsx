"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Car, MapPin, Calendar, User, LogOut, MessageSquare, Menu, Home as HomeIcon } from "lucide-react"
import { signOut } from "@/lib/firebase/auth"
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/contexts/firebase-context"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function PublicDashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const { auth } = useFirebase()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth)
      router.push("/")
    }
  }

  const handleSwitchToHost = () => {
    router.push("/host/dashboard")
  }

  const navItems = user
    ? [
        { href: "/", label: "Find Parking", icon: MapPin },
        { href: "/driver/bookings", label: "My Bookings", icon: Calendar },
        { href: "/driver/profile", label: "Profile", icon: User },
        { href: "/driver/support", label: "Support", icon: MessageSquare },
      ]
    : [
        { href: "/", label: "Find Parking", icon: MapPin },
      ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
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
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="w-4 h-4" />
                      {userProfile?.displayName || "Account"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div>
                        <p className="font-medium">{userProfile?.displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/driver/profile")}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/driver/bookings")}>
                      <Calendar className="w-4 h-4 mr-2" />
                      My Bookings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSwitchToHost}>
                      <HomeIcon className="w-4 h-4 mr-2" />
                      Switch to Host Mode
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => router.push("/signup")}>Get Started</Button>
              </>
            )}
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

                  {user ? (
                    <>
                      <div className="mb-6 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium">{userProfile?.displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>

                      <div className="flex-1 space-y-2">
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

                      <div className="pt-4 border-t space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 bg-transparent"
                          onClick={() => {
                            setMobileMenuOpen(false)
                            handleSwitchToHost()
                          }}
                        >
                          <HomeIcon className="w-5 h-5" />
                          Switch to Host Mode
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 bg-transparent"
                          onClick={handleSignOut}
                        >
                          <LogOut className="w-5 h-5" />
                          Sign Out
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          router.push("/signup")
                        }}
                      >
                        Get Started
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          router.push("/login")
                        }}
                      >
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}


