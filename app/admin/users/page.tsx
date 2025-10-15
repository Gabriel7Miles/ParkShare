"use client"

import { AdminNav } from "@/components/admin/admin-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, MoreVertical } from "lucide-react"

export default function AdminUsers() {
  const users = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "driver", status: "active", joined: "2024-01-15" },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "host",
      status: "active",
      joined: "2024-01-20",
    },
    { id: "3", name: "Mike Davis", email: "mike@example.com", role: "driver", status: "active", joined: "2024-02-01" },
    {
      id: "4",
      name: "Emily Wilson",
      email: "emily@example.com",
      role: "host",
      status: "suspended",
      joined: "2024-02-10",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />

      <div className="pt-16">
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 font-sans">User Management</h1>
            <p className="text-muted-foreground">Manage all platform users</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Users</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Joined</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-secondary/30">
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={user.status === "active" ? "bg-success" : "bg-destructive"}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{user.joined}</td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
