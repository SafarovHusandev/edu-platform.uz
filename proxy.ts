import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_ROUTES = ["/login", "/register"]
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/notifications",
  "/payment",
  "/student",
  "/teacher",
  "/admin",
]
const ROLE_PREFIXES: Record<string, string[]> = {
  // Teachers can browse the rewards catalog, but redemption stays student-only
  // (the backend also restricts /rewards/:id/redeem and /redemptions/my to students).
  "/student/rewards/redemptions": ["student"],
  "/student/rewards": ["student", "teacher"],
  "/student": ["student"],
  "/teacher": ["teacher"],
  "/admin": ["admin", "superadmin"],
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("epu_token")?.value
  const role = request.cookies.get("epu_role")?.value

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isAuthRoute = AUTH_ROUTES.some((prefix) => pathname.startsWith(prefix))

  if (isProtected && !token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (token && role) {
    const matchedPrefix = Object.keys(ROLE_PREFIXES)
      .filter((prefix) => pathname.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0]

    if (matchedPrefix && !ROLE_PREFIXES[matchedPrefix].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
