"use client"

import Link from "next/link"
import { ArrowLeft, PackageCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonList } from "@/components/ui/skeleton"
import { useMyRedemptions } from "@/hooks/use-rewards"
import { formatDate } from "@/lib/format"
import type { RedemptionStatus } from "@/types"

const STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: "Kutilmoqda",
  delivered: "Yetkazildi",
  rejected: "Rad etildi",
}

const STATUS_VARIANTS: Record<RedemptionStatus, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  delivered: "default",
  rejected: "destructive",
}

export default function MyRedemptionsPage() {
  const { data, isLoading, isError, refetch } = useMyRedemptions(1, 24)

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/student/rewards" />}>Mukofotlar</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mening yutuqlarim</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button variant="ghost" size="sm" render={<Link href="/student/rewards" />} className="mb-4 w-fit">
        <ArrowLeft className="size-4" /> Mukofotlarga qaytish
      </Button>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Mening yutuqlarim</h1>
      <p className="mt-1 text-muted-foreground">Almashtirilgan mukofotlar tarixi</p>

      <div className="mt-6">
        {isLoading ? (
          <SkeletonList count={4} itemClassName="h-16" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={PackageCheck} title="Hali mukofotga almashtirmagansiz" />
        ) : (
          <div className="space-y-2">
            {data.items.map((redemption) => {
              const reward = typeof redemption.reward === "object" ? redemption.reward : null
              return (
                <Card key={redemption._id}>
                  <CardContent className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{reward?.title ?? "Mukofot"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(redemption.createdAt)}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[redemption.status]}>
                        {STATUS_LABELS[redemption.status]}
                      </Badge>
                    </div>
                    {redemption.status === "rejected" && redemption.adminNote && (
                      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {redemption.adminNote}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
