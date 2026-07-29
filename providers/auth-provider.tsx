"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api, setUnauthorizedHandler } from "@/lib/api-client"
import { getTokenCookie, clearAuthCookies, setTokenCookie, setRoleCookie } from "@/lib/cookies"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/types"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clear)
  const checked = useRef(false)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear()
      clearAuthCookies()
      router.push("/login")
    })
  }, [clear, router])

  useEffect(() => {
    if (!isHydrated || checked.current) return
    checked.current = true

    const token = getTokenCookie()
    if (!token) {
      clear()
      clearAuthCookies()
      return
    }

    api
      .get<{ user: User }>("/auth/me")
      .then(({ user }) => {
        setSession(user, token)
        setTokenCookie(token)
        setRoleCookie(user.role)
      })
      .catch(() => {
        clear()
        clearAuthCookies()
      })
  }, [isHydrated, clear, setSession])

  return <>{children}</>
}
