"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { api, setUnauthorizedHandler } from "@/lib/api-client"
import { getTokenCookie, clearAuthCookies, setTokenCookie, setRoleCookie } from "@/lib/cookies"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/types"

// Bu yo'llar autentifikatsiyasiz ham ochiq. Eski/yaroqsiz token cookie tufayli
// fon rejimidagi "/auth/me" so'rovi 401 qaytarsa, shu sahifalarda foydalanuvchini
// majburan /login'ga uzatmaymiz (aks holda, masalan, /register'ni hech qachon
// ochib bo'lmay qolardi — ro'yxatdan o'tishga ulgurmasdan loginga otilib ketardi).
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/courses",
  "/books",
  "/certificates/verify",
  "/rewards",
  "/donate",
  "/oferta",
  "/maxfiylik-siyosati",
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clear)
  const checked = useRef(false)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear()
      clearAuthCookies()
      if (!isPublicPath(pathnameRef.current)) {
        router.push("/login")
      }
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
