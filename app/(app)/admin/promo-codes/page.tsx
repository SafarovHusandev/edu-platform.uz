'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, TicketPercent, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
} from '@/hooks/use-promo-codes';
import { formatDate } from '@/lib/format';
import { StatusPill } from '@/components/dashboard/dashboard-ui';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;

const promoSchema = z.object({
  code: z.string().min(3, { error: 'Kamida 3 ta belgi' }),
  discountPercent: z.coerce
    .number()
    .min(1, { error: 'Kamida 1%' })
    .max(100, { error: "Ko'pi bilan 100%" }),
  maxUses: z.coerce.number().min(1, { error: 'Kamida 1' }),
  expiresAt: z.string().min(1, { error: 'Muddatni tanlang' }),
});

type PromoFormInput = z.input<typeof promoSchema>;
type PromoFormValues = z.output<typeof promoSchema>;

export default function AdminPromoCodesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = usePromoCodes({ page, limit: PAGE_SIZE });
  const createPromo = useCreatePromoCode();
  const updatePromo = useUpdatePromoCode();
  const deletePromo = useDeletePromoCode();
  // Muddati o'tganini aniqlash uchun — render paytida Date.now() chaqirilmaydi
  const [now] = useState(() => Date.now());

  const form = useForm<PromoFormInput, unknown, PromoFormValues>({
    resolver: zodResolver(promoSchema),
    defaultValues: { code: '', discountPercent: 10, expiresAt: '', maxUses: 100 },
  });

  function onSubmit(values: PromoFormValues) {
    createPromo.mutate(
      { ...values, expiresAt: new Date(values.expiresAt).toISOString() },
      {
        onSuccess: () => form.reset({ code: '', discountPercent: 10, expiresAt: '', maxUses: 100 }),
      }
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageHeader
        title="Promokodlar"
        description="Premium va kurs xaridlarida ishlaydi."
        className="mb-0"
      />

      <section className="rounded-[20px] border border-border bg-card p-5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr_0.8fr_auto] lg:items-start"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Kod</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="QISH25"
                      className="h-11 font-heading"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Chegirma %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      className="h-11"
                      {...field}
                      value={field.value as number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Amal qilish muddati</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-11" {...field} />
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
                  <FormLabel className="font-semibold">Maks. foydalanish</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      className="h-11"
                      {...field}
                      value={field.value as number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="h-11 lg:mt-[22px]"
              disabled={createPromo.isPending}
            >
              {createPromo.isPending && <Loader2 className="size-4 animate-spin" />}
              Yaratish
            </Button>
          </form>
        </Form>
      </section>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-[20px] bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={TicketPercent} title="Hali promokod yaratilmagan" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-[20px] border border-border bg-card">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-[13px] text-muted-foreground">
                  <th className="px-5 py-3.5 font-semibold">Kod</th>
                  <th className="px-3 py-3.5 font-semibold">Chegirma</th>
                  <th className="px-3 py-3.5 font-semibold">Foydalanilgan</th>
                  <th className="px-3 py-3.5 font-semibold">Muddat</th>
                  <th className="px-3 py-3.5 font-semibold">Holat</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((promo) => {
                  const used = promo.usedCount ?? 0;
                  const usage = promo.maxUses > 0 ? Math.min(100, (used / promo.maxUses) * 100) : 0;
                  const expired = new Date(promo.expiresAt).getTime() < now;
                  return (
                    <tr key={promo._id} className="border-t border-muted">
                      <td className="px-5 py-3 font-heading font-semibold">{promo.code}</td>
                      <td className="px-3 py-3 font-semibold">−{promo.discountPercent}%</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                usage >= 100 ? 'bg-destructive' : 'bg-primary'
                              )}
                              style={{ width: `${usage}%` }}
                            />
                          </div>
                          <span className="text-[13px] tabular-nums text-muted-foreground">
                            {used} / {promo.maxUses}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">{formatDate(promo.expiresAt)}</td>
                      <td className="px-3 py-3">
                        {expired ? (
                          <StatusPill tone="neutral">Muddati o&apos;tgan</StatusPill>
                        ) : promo.isActive ? (
                          <StatusPill tone="success">Faol</StatusPill>
                        ) : (
                          <StatusPill tone="neutral">O&apos;chirilgan</StatusPill>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={promo.isActive}
                            onCheckedChange={(checked) =>
                              updatePromo.mutate({ id: promo._id, isActive: checked })
                            }
                            aria-label={
                              promo.isActive ? "Promokodni o'chirish" : 'Promokodni yoqish'
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button variant="ghost" size="icon-sm" aria-label="O'chirish" />
                              }
                            >
                              <Trash2 className="size-4" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Promokodni o&apos;chirasizmi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{promo.code}&quot; o&apos;chiriladi. Bu amalni bekor qilib
                                  bo&apos;lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  onClick={() => deletePromo.mutate(promo._id)}
                                >
                                  O&apos;chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="promokod"
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
