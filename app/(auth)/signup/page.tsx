"use client"

import { useState } from "react"
import { RoleSelection } from "@/components/auth/role-selection"
import { SignUpForm } from "@/components/auth/sign-up-form"
import type { UserRole } from "@/lib/firebase/auth"

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  if (!selectedRole) {
    return <RoleSelection onRoleSelect={setSelectedRole} />
  }

  return <SignUpForm role={selectedRole} onBack={() => setSelectedRole(null)} />
}
