"use client"

import { useState } from "react"
import { Loader2, PackageCheck } from "lucide-react"
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
import { useAllRedemptions, useUpdateRedemptionStatus } from "@/hooks/use-rewards"
import { formatDate, initials } from "@/lib/format"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Redemption, RedemptionStatus } from "@/types"

const PAGE_SIZE = 15

const STATUS_TABS: { value: RedemptionStatus | "all"; label: string }[] = [
  { value: "pending", label: "Kutilmoqda" },
  { value: "delivered", label: "Yetkazilgan" },
  { value: "rejected", label: "Rad etilgan" },
  { value: "all", label: "Barchasi" },
]

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

export default function AdminRedemptionsPage() {
  const [status, setStatus] = useState<RedemptionStatus | "all">("pending")
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useAllRedemptions({
    status: status === "all" ? undefined : status,
    page,
    limit: PAGE_SIZE,
  })
  const updateStatus = useUpdateRedemptionStatus()

  const [editing, setEditing] = useState<Redemption | null>(null)
  const [note, setNote] = useState("")

  function openUpdate(redemption: Redemption) {
    setEditing(redemption)
    setNote(redemption.adminNote ?? "")
  }

  function handleUpdate(newStatus: RedemptionStatus) {
    if (!editing) return
    updateStatus.mutate(
      { id: editing._id, status: newStatus, adminNote: note },
      { onSuccess: () => setEditing(null) }
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
            return (
              <Card key={redemption._id}>
                <CardContent className="flex items-center gap-4 pt-2">
                  <Avatar>
                    <AvatarFallback>{initials(student?.name ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{student?.name ?? "Foydalanuvchi"}</p>
                    <p className="text-sm text-muted-foreground">{reward?.title ?? "Mukofot"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(redemption.createdAt)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[redemption.status]}>
                    {STATUS_LABELS[redemption.status]}
                  </Badge>
                  {redemption.status === "pending" && (
                    <Button size="sm" onClick={() => openUpdate(redemption)}>
                      Ko&apos;rib chiqish
                    </Button>
                  )}
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

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>So&apos;rovni ko&apos;rib chiqish</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Admin izohi (ixtiyoriy)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              variant="outline"
              onClick={() => handleUpdate("rejected")}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Rad etish
            </Button>
            <Button onClick={() => handleUpdate("delivered")} disabled={updateStatus.isPending}>
              {updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Yetkazildi deb belgilash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
