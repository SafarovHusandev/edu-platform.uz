'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Crown, Gift, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
    <div>
      <PageHeader
        title="Mukofotlar"
        description="Olmoslarga almashtiriladigan sovg'alar"
        actions={
          <Button onClick={openCreate} size="lg" className="h-10 rounded-md px-5 shadow-sm">
            <Plus className="size-4" /> Yangi mukofot
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCardGrid count={6} itemClassName="h-64 rounded-md" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Gift} title="Hali mukofot qo'shilmagan" />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.items.map((reward) => {
              const image = resolveAssetUrl(reward.image);
              return (
                <Card
                  key={reward._id}
                  className="gap-0 overflow-hidden rounded-md py-0 shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md"
                >
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
                        <Gift className="size-9 text-gold" />
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
                    {reward.premiumOnly && (
                      <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground shadow-sm">
                        <Crown className="size-3.5" /> Faqat Premium
                      </span>
                    )}
                  </div>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <h3 className="line-clamp-1 text-base font-semibold">{reward.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-sm font-semibold text-gold-foreground">
                        <Image
                          src="/diamond.png"
                          alt=""
                          width={32}
                          height={32}
                          className="size-4"
                        />{' '}
                        {formatNumber(reward.cost)}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {reward.stock === null ? 'Cheksiz' : `${reward.stock} dona`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-md"
                        onClick={() => openEdit(reward)}
                      >
                        <Pencil className="size-4" /> Tahrirlash
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="rounded-md"
                              aria-label="O'chirish"
                            />
                          }
                        >
                          <Trash2 className="size-4 text-destructive" />
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
              <span className="flex size-9 items-center justify-center rounded-md bg-gold/15 text-gold-foreground">
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
                      <Input className="h-11 rounded-md text-base" {...field} />
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
                          className="h-11 rounded-md text-base"
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
                          className="h-11 rounded-md text-base"
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
                  <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0 rounded-md bg-muted/50 px-3 py-2.5">
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
                  <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0 rounded-md bg-gold/10 px-3 py-2.5">
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
                  className="h-11 w-full rounded-md text-base sm:w-fit"
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
