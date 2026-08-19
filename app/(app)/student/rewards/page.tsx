"use client"

import Link from "next/link"
import Image from "next/image"
import { Gem, Gift, PackageCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonCardGrid } from "@/components/ui/skeleton"
import { useRewards, useRedeemReward } from "@/hooks/use-rewards"
import { useAuthStore } from "@/store/auth-store"
import { resolveAssetUrl } from "@/lib/config"
import { formatNumber } from "@/lib/format"

export default function StudentRewardsPage() {
  const user = useAuthStore((s) => s.user)
  const isStudent = user?.role === "student"
  const { data, isLoading, isError, refetch } = useRewards({ page: 1, limit: 24 })
  const redeem = useRedeemReward()
  const diamonds = user?.diamonds ?? 0

  return (
    <div>
      <PageHeader
        title="Mukofotlar"
        description={
          isStudent ? "Olmoslaringizni sovg'alarga almashtiring" : "O'quvchilar uchun sovg'alar katalogi"
        }
        actions={
          isStudent ? (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-sm font-semibold text-gold-foreground">
                <Gem className="size-4 text-gold" /> {formatNumber(diamonds)}
              </span>
              <Button variant="outline" size="sm" render={<Link href="/student/rewards/redemptions" />}>
                <PackageCheck className="size-4" /> Mening yutuqlarim
              </Button>
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <SkeletonCardGrid count={6} itemClassName="h-56" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Gift} title="Hozircha mukofotlar mavjud emas" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((reward) => {
            const image = resolveAssetUrl(reward.image)
            const inStock = reward.stock === null || reward.stock > 0
            const canAfford = diamonds >= reward.cost && inStock
            return (
              <Card key={reward._id} className="py-0">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {image ? (
                    <Image src={image} alt={reward.title} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-linear-to-br from-gold/20 to-primary/10">
                      <Gift className="size-8 text-gold" />
                    </div>
                  )}
                </div>
                <CardContent className="flex flex-col gap-2 pt-4">
                  <h3 className="line-clamp-1 text-sm font-semibold">{reward.title}</h3>
                  {reward.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{reward.description}</p>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-semibold text-gold-foreground">
                      <Gem className="size-4 text-gold" /> {formatNumber(reward.cost)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {reward.stock === null
                        ? "Cheksiz"
                        : reward.stock > 0
                          ? `${reward.stock} dona qoldi`
                          : "Tugagan"}
                    </span>
                  </div>
                  {isStudent && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button className="mt-1 w-full" disabled={!canAfford} />}
                      >
                        Almashtirish
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Mukofotga almashtirasizmi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{reward.title}&quot; uchun {formatNumber(reward.cost)} olmos
                            yechiladi. Bu amalni bekor qilib bo&apos;lmaydi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                          <AlertDialogAction onClick={() => redeem.mutate(reward._id)}>
                            Tasdiqlash
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
