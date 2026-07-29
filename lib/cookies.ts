import Cookies from "js-cookie"

const TOKEN_KEY = "epu_token"
const ROLE_KEY = "epu_role"

const cookieOptions: Cookies.CookieAttributes = {
  expires: 30,
  sameSite: "lax",
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
  path: "/",
}

export function getTokenCookie() {
  return Cookies.get(TOKEN_KEY)
}

export function setTokenCookie(token: string) {
  Cookies.set(TOKEN_KEY, token, cookieOptions)
}

export function getRoleCookie() {
  return Cookies.get(ROLE_KEY)
}

export function setRoleCookie(role: string) {
  Cookies.set(ROLE_KEY, role, cookieOptions)
}

export function clearAuthCookies() {
  Cookies.remove(TOKEN_KEY, { path: "/" })
  Cookies.remove(ROLE_KEY, { path: "/" })
}
