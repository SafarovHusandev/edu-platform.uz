'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Gem, Gift, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

export default function AdminRewardsPage() {
  const { data, isLoading } = useRewards({ page: 1, limit: 50 });
  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();
  const uploadImage = useUploadRewardImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    cost: number;
    stock: number | null;
  }>({ title: '', description: '', cost: 10, stock: 10 });

  function openCreate() {
    setEditing(null);
    setForm({ title: '', description: '', cost: 10, stock: 10 });
    setDialogOpen(true);
  }

  function openEdit(reward: Reward) {
    setEditing(reward);
    setForm({
      title: reward.title,
      description: reward.description ?? '',
      cost: reward.cost,
      stock: reward.stock,
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    if (editing) {
      updateReward.mutate({ id: editing._id, ...form }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createReward.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Mukofotlar</h1>
          <p className="mt-1 text-muted-foreground">Olmoslarga almashtiriladigan sovg&apos;alar</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Yangi mukofot
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Gift className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Hali mukofot qo&apos;shilmagan</p>
        </div>
      ) : (
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
                    onClick={() => {
                      setUploadTargetId(reward._id);
                      fileInputRef.current?.click();
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
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
                      <AlertDialogTrigger render={<Button variant="outline" size="icon-sm" />}>
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
          <div className="space-y-3">
            <Input
              placeholder="Mukofot nomi"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Tavsif (ixtiyoriy)"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Narxi (olmos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.cost}
                  onChange={(e) => setForm((prev) => ({ ...prev, cost: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Miqdori</Label>
                <Input
                  type="number"
                  min={0}
                  disabled={form.stock === null}
                  value={form.stock ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.stock === null}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, stock: checked ? null : 10 }))
                }
              />
              <Label>Cheksiz miqdor</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={createReward.isPending || updateReward.isPending}
            >
              {(createReward.isPending || updateReward.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
