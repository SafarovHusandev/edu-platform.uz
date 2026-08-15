'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Gem, Gift, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardGrid } from '@/components/ui/skeleton';
import { PaginationBar } from '@/components/ui/pagination-bar';
import {
  useRewards,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
  useUploadRewardImage,
} from '@/hooks/use-rewards';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import type { Reward } from '@/types';

const PAGE_SIZE = 12

const rewardSchema = z.object({
  title: z.string().min(2, { error: "Kamida 2 ta belgi" }),
  description: z.string().optional(),
  cost: z.coerce.number().min(1, { error: "Kamida 1" }),
  unlimited: z.boolean(),
  stock: z.coerce.number().min(0, { error: "0 yoki ko'proq" }).optional(),
})

type RewardFormInput = z.input<typeof rewardSchema>
type RewardFormValues = z.output<typeof rewardSchema>

export default function AdminRewardsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useRewards({ page, limit: PAGE_SIZE });
  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();
  const uploadImage = useUploadRewardImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);

  const form = useForm<RewardFormInput, unknown, RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: { title: '', description: '', cost: 10, unlimited: false, stock: 10 },
  })
  const unlimited = form.watch('unlimited')

  function openCreate() {
    setEditing(null);
    form.reset({ title: '', description: '', cost: 10, unlimited: false, stock: 10 })
    setDialogOpen(true);
  }

  function openEdit(reward: Reward) {
    setEditing(reward);
    form.reset({
      title: reward.title,
      description: reward.description ?? '',
      cost: reward.cost,
      unlimited: reward.stock === null,
      stock: reward.stock ?? 10,
    })
    setDialogOpen(true);
  }

  function onSubmit(values: RewardFormValues) {
    const payload = {
      title: values.title,
      description: values.description,
      cost: values.cost,
      stock: values.unlimited ? null : values.stock ?? 0,
    }
    if (editing) {
      updateReward.mutate({ id: editing._id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createReward.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div>
      <PageHeader
        title="Mukofotlar"
        description="Olmoslarga almashtiriladigan sovg'alar"
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Yangi mukofot
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCardGrid count={6} itemClassName="h-56" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Gift} title="Hali mukofot qo'shilmagan" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((reward) => {
              const image = resolveAssetUrl(reward.image);
              return (
                <Card key={reward._id} className="py-0">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {image ? (
                      <Image
                        src={image}
                        alt={reward.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-gold/20 to-primary/10">
                        <Gift className="size-8 text-gold" />
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label="Rasmni almashtirish"
                      onClick={() => {
                        setUploadTargetId(reward._id);
                        fileInputRef.current?.click();
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {uploadImage.isPending && uploadTargetId === reward._id ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Camera className="size-5" />
                      )}
                    </button>
                  </div>
                  <CardContent className="flex flex-col gap-2 py-4">
                    <h3 className="line-clamp-1 text-md font-semibold">{reward.title}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 font-medium text-gold-foreground">
                        <Gem className="size-4 text-gold" /> {formatNumber(reward.cost)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {reward.stock === null ? 'Cheksiz' : `${reward.stock} dona`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEdit(reward)}
                      >
                        <Pencil className="size-4" /> Tahrirlash
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="outline" size="icon-sm" aria-label="O'chirish" />}>
                          <Trash2 className="size-4" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mukofotni o&apos;chirasizmi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu amalni bekor qilib bo&apos;lmaydi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteReward.mutate(reward._id)}>
                              O&apos;chirish
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="mukofot"
            onPageChange={setPage}
          />
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadTargetId) uploadImage.mutate({ id: uploadTargetId, file });
          e.target.value = '';
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Mukofotni tahrirlash' : 'Yangi mukofot'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mukofot nomi</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tavsif (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Narxi (olmos)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} value={field.value as number} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miqdori</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} disabled={unlimited} {...field} value={field.value as number} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="unlimited"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Cheksiz miqdor</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createReward.isPending || updateReward.isPending}>
                  {(createReward.isPending || updateReward.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Saqlash
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
