"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, Gift, Loader2, PackageCheck, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonList } from "@/components/ui/skeleton"
import { PaginationBar } from "@/components/ui/pagination-bar"
import {
  useAllRedemptions,
  useApproveRedemption,
  useRejectRedemption,
  useDeliverRedemption,
} from "@/hooks/use-rewards"
import { formatDate, initials } from "@/lib/format"
import { resolveAssetUrl } from "@/lib/config"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Redemption, RedemptionActor, RedemptionStatus } from "@/types"

const PAGE_SIZE = 15

const STATUS_TABS: { value: RedemptionStatus | "all"; label: string }[] = [
  { value: "pending", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "delivered", label: "Topshirilgan" },
  { value: "rejected", label: "Rad etilgan" },
  { value: "all", label: "Barchasi" },
]

const STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  delivered: "Topshirildi",
  rejected: "Rad etildi",
}

const STATUS_STYLES: Record<RedemptionStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  approved: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  delivered: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
}

function actorName(actor: RedemptionActor | string | null | undefined) {
  if (!actor || typeof actor === "string") return null
  return actor.name
}

export default function AdminRedemptionsPage() {
  const [status, setStatus] = useState<RedemptionStatus | "all">("pending")
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useAllRedemptions({
    status: status === "all" ? undefined : status,
    page,
    limit: PAGE_SIZE,
  })
  const approveRedemption = useApproveRedemption()
  const rejectRedemption = useRejectRedemption()
  const deliverRedemption = useDeliverRedemption()

  const [rejecting, setRejecting] = useState<Redemption | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [delivering, setDelivering] = useState<Redemption | null>(null)
  const [deliveryNote, setDeliveryNote] = useState("")

  function handleReject() {
    if (!rejecting) return
    rejectRedemption.mutate(
      { id: rejecting._id, reason: rejectReason.trim() || undefined },
      { onSuccess: () => setRejecting(null) }
    )
  }

  function handleDeliver() {
    if (!delivering) return
    deliverRedemption.mutate(
      { id: delivering._id, note: deliveryNote.trim() || undefined },
      { onSuccess: () => setDelivering(null) }
    )
  }

  return (
    <div>
      <PageHeader title="Yutuqlar" description="Mukofot so'rovlarini ko'rib chiqing" />

      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as RedemptionStatus | "all")
          setPage(1)
        }}
        className="mb-6"
      >
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <SkeletonList count={4} itemClassName="h-20" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={PackageCheck} title="Bu bo'limda so'rovlar yo'q" />
      ) : (
        <>
          <div className="space-y-2">
            {data.items.map((redemption) => {
              const reward = typeof redemption.reward === "object" ? redemption.reward : null
              const student = typeof redemption.student === "object" ? redemption.student : null
              const rewardImage = resolveAssetUrl(reward?.image)
              const approvedByName = actorName(redemption.approvedBy)
              const rejectedByName = actorName(redemption.rejectedBy)
              const deliveredByName = actorName(redemption.deliveredBy)
              const note = redemption.deliveryNote || redemption.rejectReason || redemption.adminNote

              return (
                <Card key={redemption._id} className="rounded-md shadow-sm ring-1 ring-border/60">
                  <CardContent className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {rewardImage ? (
                          <Image
                            src={rewardImage}
                            alt={reward?.title ?? "Mukofot"}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <Gift className="size-5" />
                          </div>
                        )}
                      </div>
                      <Avatar>
                        <AvatarFallback>{initials(student?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student?.name ?? "Foydalanuvchi"}</p>
                      <p className="text-sm text-muted-foreground">{reward?.title ?? "Mukofot"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(redemption.createdAt)}
                      </p>
                      {redemption.status === "approved" && (approvedByName || redemption.approvedAt) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tasdiqladi{approvedByName ? `: ${approvedByName}` : ""}
                          {redemption.approvedAt && ` · ${formatDate(redemption.approvedAt)}`}
                        </p>
                      )}
                      {redemption.status === "delivered" &&
                        (deliveredByName || redemption.deliveredAt) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Topshirdi{deliveredByName ? `: ${deliveredByName}` : ""}
                            {redemption.deliveredAt && ` · ${formatDate(redemption.deliveredAt)}`}
                          </p>
                        )}
                      {redemption.status === "rejected" &&
                        (rejectedByName || redemption.rejectedAt) && (
                          <p className="mt-1 text-xs text-destructive">
                            Rad etdi{rejectedByName ? `: ${rejectedByName}` : ""}
                            {redemption.rejectedAt && ` · ${formatDate(redemption.rejectedAt)}`}
                          </p>
                        )}
                      {note && (
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            redemption.status === "rejected"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}
                        >
                          &quot;{note}&quot;
                        </p>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        "w-fit gap-1.5 rounded-full px-2.5 py-1",
                        STATUS_STYLES[redemption.status]
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[redemption.status]}
                    </Badge>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {redemption.status === "pending" && (
                        <Button
                          size="sm"
                          className="rounded-md"
                          disabled={approveRedemption.isPending}
                          onClick={() => approveRedemption.mutate(redemption._id)}
                        >
                          {approveRedemption.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          Tasdiqlash
                        </Button>
                      )}
                      {redemption.status === "approved" && (
                        <Button
                          size="sm"
                          className="rounded-md"
                          onClick={() => {
                            setDelivering(redemption)
                            setDeliveryNote("")
                          }}
                        >
                          <PackageCheck className="size-4" /> Topshirildi
                        </Button>
                      )}
                      {(redemption.status === "pending" || redemption.status === "approved") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-md"
                          onClick={() => {
                            setRejecting(redemption)
                            setRejectReason("")
                          }}
                        >
                          <X className="size-4" /> Rad etish
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="so'rov"
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent className="rounded-md">
          <DialogHeader>
            <DialogTitle>So&apos;rovni rad etish</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Rad etish sababi (ixtiyoriy)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="rounded-md text-base"
            maxLength={500}
          />
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-md"
              onClick={handleReject}
              disabled={rejectRedemption.isPending}
            >
              {rejectRedemption.isPending && <Loader2 className="size-4 animate-spin" />}
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!delivering} onOpenChange={(open) => !open && setDelivering(null)}>
        <DialogContent className="rounded-md">
          <DialogHeader>
            <DialogTitle>Mukofot topshirildi deb belgilash</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Topshirish haqida izoh (ixtiyoriy)"
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            className="rounded-md text-base"
            maxLength={500}
          />
          <DialogFooter>
            <Button
              className="rounded-md"
              onClick={handleDeliver}
              disabled={deliverRedemption.isPending}
            >
              {deliverRedemption.isPending && <Loader2 className="size-4 animate-spin" />}
              Topshirildi deb belgilash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
