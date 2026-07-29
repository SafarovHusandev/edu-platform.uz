"use client"

import { useState } from "react"
import { Loader2, Plus, TicketPercent, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
} from "@/hooks/use-promo-codes"
import { formatDate } from "@/lib/format"

export default function AdminPromoCodesPage() {
  const { data, isLoading } = usePromoCodes({ page: 1, limit: 50 })
  const createPromo = useCreatePromoCode()
  const updatePromo = useUpdatePromoCode()
  const deletePromo = useDeletePromoCode()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ code: "", discountPercent: 10, expiresAt: "", maxUses: 100 })

  function handleCreate() {
    if (!form.code.trim() || !form.expiresAt) return
    createPromo.mutate(
      { ...form, expiresAt: new Date(form.expiresAt).toISOString() },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setForm({ code: "", discountPercent: 10, expiresAt: "", maxUses: 100 })
        },
      }
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Promo kodlar</h1>
          <p className="mt-1 text-muted-foreground">Chegirma kodlarini yarating va boshqaring</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Yangi kod
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <TicketPercent className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Hali promo kod yaratilmagan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((promo) => (
            <Card key={promo._id}>
              <CardContent className="flex items-center gap-4 pt-2">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TicketPercent className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold">{promo.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {promo.discountPercent}% chegirma · {promo.usedCount ?? 0}/{promo.maxUses} ishlatilgan ·
                    {" "}
                    {formatDate(promo.expiresAt)} gacha
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={promo.isActive}
                    onCheckedChange={(checked) =>
                      updatePromo.mutate({ id: promo._id, isActive: checked })
                    }
                  />
                  <Badge variant={promo.isActive ? "default" : "secondary"}>
                    {promo.isActive ? "Faol" : "O'chirilgan"}
                  </Badge>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Promo kodni o&apos;chirasizmi?</AlertDialogTitle>
                      <AlertDialogDescription>Bu amalni bekor qilib bo&apos;lmaydi.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePromo.mutate(promo._id)}>
                        O&apos;chirish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi promo kod</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Kod</Label>
              <Input
                placeholder="YOZGI30"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Chegirma (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, discountPercent: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Maks. foydalanish</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxUses: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Amal qilish muddati</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={createPromo.isPending}>
              {createPromo.isPending && <Loader2 className="size-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
