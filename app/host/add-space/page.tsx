"use client"

import { HostDashboardNav } from "@/components/host/dashboard-nav"
import { AddSpaceForm } from "@/components/host/add-space-form"

export default function AddSpacePage() {
  return (
    <div className="min-h-screen bg-background">
      <HostDashboardNav />

      <div className="pt-16">
        <div className="container mx-auto p-4 max-w-3xl">
          <AddSpaceForm />
        </div>
      </div>
    </div>
  )
}
