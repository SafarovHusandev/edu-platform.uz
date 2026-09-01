"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { StatusCard } from "@/components/layout/status-card"
import { Logo } from "@/components/logo"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

export function AppTopbar({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)
  const { data } = useNotifications(1, 50)
  const unread = data?.items.filter((n) => !n.isRead).length ?? 0
  const isPremium = useAuthStore((s) => s.user?.tarif === "premium")

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6",
        isPremium
          ? "border-gold/30 bg-linear-to-r from-gold/8 via-background/85 to-background/85"
          : "border-border/60"
      )}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menyu" />
          }
        >
          <Menu className="size-4" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <div className="px-2">
            <SidebarNav role={role} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {role === "student" && (
        <div className="hidden sm:block">
          <StatusCard />
        </div>
      )}

      <Button variant="ghost" size="icon" className="relative" render={<Link href="/notifications" />}>
        <Bell className="size-4.5" />
        {unread > 0 && (
          <Badge className="absolute -right-0.5 -top-0.5 size-4.5 justify-center rounded-full p-0 text-[10px]">
            {unread > 9 ? "9+" : unread}
          </Badge>
        )}
      </Button>
      <ThemeToggle />
      <UserMenu />
    </header>
  )
}
