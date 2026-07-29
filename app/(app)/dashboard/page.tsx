"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { ROLE_HOME } from "@/lib/roles"

export default function DashboardRedirectPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user) {
      router.replace(ROLE_HOME[user.role])
    }
  }, [user, router])

  return null
}
