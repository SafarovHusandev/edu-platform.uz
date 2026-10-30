'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Crown, Gift, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  useRewards,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
  useUploadRewardImage,
} from '@/hooks/use-rewards';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import type { Reward } from '@/types';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { StatusPill } from '@/components/dashboard/dashboard-ui';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

const rewardSchema = z.object({
  title: z.string().min(2, { error: 'Kamida 2 ta belgi' }),
  description: z.string().optional(),
  cost: z.coerce.number().min(1, { error: 'Kamida 1' }),
  unlimited: z.boolean(),
  stock: z.coerce.number().min(0, { error: "0 yoki ko'proq" }).optional(),
  premiumOnly: z.boolean(),
});

type RewardFormInput = z.input<typeof rewardSchema>;
type RewardFormValues = z.output<typeof rewardSchema>;

export default function AdminRewardsPage() {
  const [page, setPage] = useState(1);
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
    defaultValues: {
      title: '',
      description: '',
      cost: 10,
      unlimited: false,
      stock: 10,
      premiumOnly: false,
    },
  });
  const unlimited = form.watch('unlimited');

  function openCreate() {
    setEditing(null);
    form.reset({
      title: '',
      description: '',
      cost: 10,
      unlimited: false,
      stock: 10,
      premiumOnly: false,
    });
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
      premiumOnly: reward.premiumOnly ?? false,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: RewardFormValues) {
    const payload = {
      title: values.title,
      description: values.description,
      cost: values.cost,
      stock: values.unlimited ? null : (values.stock ?? 0),
      premiumOnly: values.premiumOnly,
    };
    if (editing) {
      updateReward.mutate(
        { id: editing._id, ...payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createReward.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Mukofotlar katalogi"
        description="Olmoslarga almashtiriladigan sovg'alar"
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus className="size-4" /> Mukofot qo&apos;shish
          </Button>
        }
      />

      {isLoading ? (
        <div className="h-80 animate-pulse rounded-[20px] bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Gift} title="Hali mukofot qo'shilmagan" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-[20px] border border-border bg-card">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-[13px] text-muted-foreground">
                  <th className="px-5 py-3.5 font-semibold">Mukofot</th>
                  <th className="px-3 py-3.5 font-semibold">Narx</th>
                  <th className="px-3 py-3.5 font-semibold">Qoldiq</th>
                  <th className="px-3 py-3.5 font-semibold">Kimlarga</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((reward) => {
                  const image = resolveAssetUrl(reward.image);
                  const uploading = uploadImage.isPending && uploadTargetId === reward._id;
                  return (
                    <tr key={reward._id} className="border-t border-muted">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label="Rasmni almashtirish"
                            title="Rasmni almashtirish"
                            onClick={() => {
                              setUploadTargetId(reward._id);
                              fileInputRef.current?.click();
                            }}
                            className="group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted"
                          >
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={image} alt="" className="size-full object-cover" />
                            ) : (
                              <Gift className="size-5 text-muted-foreground" />
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                              {uploading ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Camera className="size-4" />
                              )}
                            </span>
                          </button>
                          <span className="min-w-0">
                            <span className="block font-semibold">{reward.title}</span>
                            {reward.description && (
                              <span className="line-clamp-1 text-[13px] text-muted-foreground">
                                {reward.description}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1 font-heading font-semibold text-gold-foreground">
                          <DiamondIcon className="size-4" /> {formatNumber(reward.cost)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {reward.stock === null ? (
                          <span className="text-muted-foreground">Cheksiz</span>
                        ) : (
                          <span
                            className={cn(
                              'font-semibold',
                              reward.stock === 0 && 'text-destructive',
                              reward.stock > 0 && reward.stock <= 3 && 'text-gold-foreground'
                            )}
                          >
                            {reward.stock === 0 ? 'Tugagan' : reward.stock}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {reward.premiumOnly ? (
                          <StatusPill tone="warning">
                            <Crown className="size-3.5" /> Premium
                          </StatusPill>
                        ) : (
                          <StatusPill tone="neutral">Barcha</StatusPill>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => openEdit(reward)}>
                            <Pencil className="size-3.5" /> Tahrir
                          </Button>
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
                                <AlertDialogTitle>Mukofotni o&apos;chirasizmi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{reward.title}&quot; katalogdan o&apos;chiriladi. Bu amalni
                                  bekor qilib bo&apos;lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  onClick={() => deleteReward.mutate(reward._id)}
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

          <div className="mt-4">
            <PaginationBar
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              itemLabel="mukofot"
              onPageChange={setPage}
            />
          </div>
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
        <DialogContent className="rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <span className="flex size-9 items-center justify-center bg-gold/15 text-gold-foreground">
                <Gift className="size-4.5" />
              </span>
              {editing ? 'Mukofotni tahrirlash' : 'Yangi mukofot'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              O&apos;quvchilar olmoslarga almashtira oladigan sovg&apos;a ma&apos;lumotlarini
              kiriting
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Mukofot nomi</FormLabel>
                    <FormControl>
                      <Input className="h-11 text-base" {...field} />
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
                    <FormLabel className="text-sm font-medium">Tavsif (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea className="rounded-md text-base" {...field} />
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
                      <FormLabel className="text-sm font-medium">Narxi (olmos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="h-11 text-base"
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
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Miqdori</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          disabled={unlimited}
                          className="h-11 text-base"
                          {...field}
                          value={field.value as number}
                        />
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
                  <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0 bg-muted/50 px-3 py-2.5">
                    <FormLabel className="text-sm font-medium">Cheksiz miqdor</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="premiumOnly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0 bg-gold/10 px-3 py-2.5">
                    <FormLabel className="flex items-center gap-1.5 text-sm font-medium text-gold-foreground">
                      <Crown className="size-4" /> Faqat Premium foydalanuvchilar uchun
                    </FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full text-base sm:w-fit"
                  disabled={createReward.isPending || updateReward.isPending}
                >
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
