"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/layout/user-menu"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

const LINKS = [
  { label: "Bosh sahifa", href: "/" },
  { label: "Kurslar", href: "/courses" },
  { label: "Reyting", href: "/leaderboard" },
  { label: "Sertifikat tekshirish", href: "/certificates/verify" },
  { label: "Homiylik", href: "/donate" },
]

export function PublicNavbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" render={<Link href="/login" />}>
                Kirish
              </Button>
              <Button render={<Link href="/register" />}>Ro&apos;yxatdan o&apos;tish</Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menyu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-3">
                <Button variant="outline" className="flex-1" render={<Link href="/login" />}>
                  Kirish
                </Button>
                <Button className="flex-1" render={<Link href="/register" />}>
                  Ro&apos;yxatdan o&apos;tish
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
