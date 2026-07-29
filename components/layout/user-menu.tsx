"use client"

import Link from "next/link"
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth-store"
import { useLogout } from "@/hooks/use-auth"
import { ROLE_HOME, ROLE_LABELS } from "@/lib/roles"
import { resolveAssetUrl } from "@/lib/config"
import { initials } from "@/lib/format"

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar>
          <AvatarImage src={resolveAssetUrl(user.avatar)} alt={user.name} />
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROLE_HOME[user.role]} />}>
          <LayoutDashboard /> Boshqaruv paneli
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserIcon /> Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout.mutate()}>
          <LogOut /> Chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
