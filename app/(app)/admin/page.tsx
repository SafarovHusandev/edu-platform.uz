"use client"

import Link from "next/link"
import { BookOpen, ClipboardList, FolderTree, Gift, PackageCheck, TicketPercent, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useUsers } from "@/hooks/use-users"
import { useAllRedemptions } from "@/hooks/use-rewards"
import { useCategories } from "@/hooks/use-categories"
import { useCourses } from "@/hooks/use-courses"
import { useQuizzes } from "@/hooks/use-quizzes"
import { useRewards } from "@/hooks/use-rewards"
import { useAuthStore } from "@/store/auth-store"
import { formatNumber } from "@/lib/format"

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: users } = useUsers({ page: 1, limit: 1 })
  const { data: categories } = useCategories()
  const { data: courses } = useCourses({ page: 1, limit: 1 })
  const { data: quizzes } = useQuizzes({ page: 1, limit: 1 })
  const { data: rewards } = useRewards({ page: 1, limit: 1 })
  const { data: pendingRedemptions } = useAllRedemptions({ status: "pending", page: 1, limit: 1 })

  const cards = [
    { icon: Users, label: "Foydalanuvchilar", value: users?.total ?? 0, href: "/admin/users", color: "bg-primary/10 text-primary" },
    { icon: BookOpen, label: "Kurslar", value: courses?.total ?? 0, href: "/admin/courses", color: "bg-success/15 text-success" },
    { icon: ClipboardList, label: "Testlar", value: quizzes?.total ?? 0, href: "/admin/quizzes", color: "bg-primary/10 text-primary" },
    { icon: FolderTree, label: "Kategoriyalar", value: categories?.length ?? 0, href: "/admin/categories", color: "bg-accent text-accent-foreground" },
    { icon: Gift, label: "Mukofotlar", value: rewards?.total ?? 0, href: "/admin/rewards", color: "bg-gold/15 text-gold-foreground" },
    {
      icon: PackageCheck,
      label: "Kutilayotgan yutuqlar",
      value: pendingRedemptions?.total ?? 0,
      href: "/admin/redemptions",
      color: "bg-destructive/10 text-destructive",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-linear-to-br from-primary to-primary/70 p-6 text-primary-foreground sm:p-8">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Xush kelibsiz, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-primary-foreground/80">Platforma holatiga umumiy nazar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="flex items-center gap-4 pt-2">
                <span className={`flex size-11 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-semibold">{formatNumber(card.value)}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/promo-codes">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex items-center gap-4 pt-2">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TicketPercent className="size-5" />
              </span>
              <div>
                <p className="font-medium">Promo kodlar</p>
                <p className="text-sm text-muted-foreground">Chegirma kodlarini yarating</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/redemptions">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex items-center gap-4 pt-2">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold-foreground">
                <PackageCheck className="size-5" />
              </span>
              <div>
                <p className="font-medium">Yutuqlarni tasdiqlash</p>
                <p className="text-sm text-muted-foreground">O&apos;quvchilar so&apos;rovlarini ko&apos;rib chiqing</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
