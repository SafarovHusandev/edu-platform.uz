"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS, COMMON_NAV_ITEMS, ROLE_LABELS } from "@/lib/roles"
import type { Role } from "@/types"
import { cn } from "@/lib/utils"

export function SidebarNav({
  role,
  onNavigate,
  className,
}: {
  role: Role
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const items = NAV_ITEMS[role] ?? []

  function isActive(href: string) {
    return href === `/${role}` ? pathname === href : pathname.startsWith(href)
  }

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {ROLE_LABELS[role]} paneli
      </p>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive(item.href) && "bg-sidebar-primary/10 text-sidebar-primary"
          )}
        >
          <item.icon className="size-4.5" />
          {item.label}
        </Link>
      ))}
      <p className="mt-4 px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Umumiy
      </p>
      {COMMON_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            pathname.startsWith(item.href) && "bg-sidebar-primary/10 text-sidebar-primary"
          )}
        >
          <item.icon className="size-4.5" />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
