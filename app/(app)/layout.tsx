"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { AppTopbar } from "@/components/layout/app-topbar"
import { useAuthStore } from "@/store/auth-store"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login")
    }
  }, [isHydrated, user, router])

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-muted/20 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <div className="px-2 pb-6">
          <Logo />
        </div>
        <SidebarNav role={user.role} className="flex-1" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar role={user.role} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
