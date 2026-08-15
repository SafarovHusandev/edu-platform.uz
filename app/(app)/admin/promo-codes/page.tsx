"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus, TicketPercent, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonList } from "@/components/ui/skeleton"
import { PaginationBar } from "@/components/ui/pagination-bar"
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
} from "@/hooks/use-promo-codes"
import { formatDate } from "@/lib/format"

const PAGE_SIZE = 15

const promoSchema = z.object({
  code: z.string().min(3, { error: "Kamida 3 ta belgi" }),
  discountPercent: z.coerce.number().min(1, { error: "Kamida 1%" }).max(100, { error: "Ko'pi bilan 100%" }),
  maxUses: z.coerce.number().min(1, { error: "Kamida 1" }),
  expiresAt: z.string().min(1, { error: "Muddatni tanlang" }),
})

type PromoFormInput = z.input<typeof promoSchema>
type PromoFormValues = z.output<typeof promoSchema>

export default function AdminPromoCodesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = usePromoCodes({ page, limit: PAGE_SIZE })
  const createPromo = useCreatePromoCode()
  const updatePromo = useUpdatePromoCode()
  const deletePromo = useDeletePromoCode()

  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<PromoFormInput, unknown, PromoFormValues>({
    resolver: zodResolver(promoSchema),
    defaultValues: { code: "", discountPercent: 10, expiresAt: "", maxUses: 100 },
  })

  function openCreate() {
    form.reset({ code: "", discountPercent: 10, expiresAt: "", maxUses: 100 })
    setDialogOpen(true)
  }

  function onSubmit(values: PromoFormValues) {
    createPromo.mutate(
      { ...values, expiresAt: new Date(values.expiresAt).toISOString() },
      { onSuccess: () => setDialogOpen(false) }
    )
  }

  return (
    <div>
      <PageHeader
        title="Promo kodlar"
        description="Chegirma kodlarini yarating va boshqaring"
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Yangi kod
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonList count={4} itemClassName="h-16" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={TicketPercent} title="Hali promo kod yaratilmagan" />
      ) : (
        <>
          <div className="space-y-2">
            {data.items.map((promo) => (
              <Card key={promo._id}>
                <CardContent className="flex flex-wrap items-center gap-4 pt-2">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <TicketPercent className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
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
                      aria-label={promo.isActive ? "Promo kodni o'chirish" : "Promo kodni yoqish"}
                    />
                    <Badge variant={promo.isActive ? "default" : "secondary"}>
                      {promo.isActive ? "Faol" : "O'chirilgan"}
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}>
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

          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="promo kod"
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi promo kod</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kod</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="YOZGI30"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chegirma (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maks. foydalanish</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amal qilish muddati</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createPromo.isPending}>
                  {createPromo.isPending && <Loader2 className="size-4 animate-spin" />}
                  Yaratish
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
