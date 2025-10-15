"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Home } from "lucide-react"
import type { UserRole } from "@/lib/firebase/auth"

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void
}

export function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2 font-sans">Welcome to ParkShare</h1>
        <p className="text-muted-foreground text-lg">Choose how you want to get started</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedRole === "driver" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setSelectedRole("driver")}
        >
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">I'm a Driver</CardTitle>
            <CardDescription className="text-base">
              Find and book affordable parking spaces near your destination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Search parking by location
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Book instantly or in advance
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Save up to 70% on parking
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedRole === "host" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setSelectedRole("host")}
        >
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <Home className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl">I'm a Host</CardTitle>
            <CardDescription className="text-base">
              List your parking space and earn money from unused spots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                List your space for free
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Set your own prices
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Earn passive income
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button
          size="lg"
          onClick={() => selectedRole && onRoleSelect(selectedRole)}
          disabled={!selectedRole}
          className="px-8"
        >
          Continue as {selectedRole === "driver" ? "Driver" : selectedRole === "host" ? "Host" : "..."}
        </Button>
      </div>
    </div>
  )
}
