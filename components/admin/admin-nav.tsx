"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, MapPin, Calendar, DollarSign, MessageSquare, Settings, LogOut } from "lucide-react"
import { signOut } from "@/lib/firebase/auth"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/contexts/firebase-context"

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { auth } = useFirebase()

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth)
      router.push("/")
    }
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/spaces", label: "Spaces", icon: MapPin },
    { href: "/admin/bookings", label: "Bookings", icon: Calendar },
    { href: "/admin/transactions", label: "Transactions", icon: DollarSign },
    { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-destructive flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-destructive font-sans">Admin Panel</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant={pathname === item.href ? "default" : "ghost"} className="gap-2" size="sm">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}
