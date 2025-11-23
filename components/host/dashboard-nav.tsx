"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Calendar, DollarSign, User, LogOut, MessageSquare, Plus, Menu, Car } from "lucide-react"
import { signOut } from "@/lib/firebase/auth"
import { useRouter } from "next/navigation"
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

export function HostDashboardNav() {
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

  const handleSwitchToDriver = () => {
    router.push("/")
  }

  const navItems = [
    { href: "/host/dashboard", label: "My Spaces", icon: Home },
    { href: "/host/bookings", label: "Bookings", icon: Calendar },
    { href: "/host/earnings", label: "Earnings", icon: DollarSign },
    { href: "/host/profile", label: "Profile", icon: User },
    { href: "/host/support", label: "Support", icon: MessageSquare },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/host/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-success flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-success font-sans">ParkShare Host</span>
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
            <Link href="/host/add-space">
              <Button className="gap-2 bg-success hover:bg-success/90">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Space</span>
              </Button>
            </Link>
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
                    <p className="text-xs text-muted-foreground">Host Mode</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/host/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/host/bookings")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Bookings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/host/earnings")}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Earnings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSwitchToDriver}>
                  <Car className="w-4 h-4 mr-2" />
                  Switch to Driver Mode
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/host/add-space">
              <Button size="icon" className="bg-success hover:bg-success/90">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
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
                      <p className="text-xs text-muted-foreground">Host</p>
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

                  <div className="pt-4 border-t space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 bg-transparent"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleSwitchToDriver()
                      }}
                    >
                      <Car className="w-5 h-5" />
                      Switch to Driver Mode
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
