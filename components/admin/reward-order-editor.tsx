'use client';

import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Crown,
  Gift,
  GripVertical,
  Info,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { StatusPill } from '@/components/dashboard/dashboard-ui';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useReorderRewards, useRewards } from '@/hooks/use-rewards';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Reward } from '@/types';

// Tartiblashda barcha mukofotlar bitta ro'yxatda bo'lishi kerak (sahifalashsiz)
const ORDER_LIMIT = 100;

function SortableRewardRow({
  reward,
  index,
  count,
  disabled,
  onMove,
}: {
  reward: Reward;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: reward._id, disabled });
  const image = resolveAssetUrl(reward.image);
  const active = reward.isActive !== false;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5',
        isDragging && 'relative z-10 border-primary shadow-lg',
        !active && 'bg-muted/40'
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={`"${reward.title}" ni sudrab ko'chirish`}
        className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed"
      >
        <GripVertical className="size-5" />
      </button>

      <span className="w-6 shrink-0 text-center font-heading text-sm font-semibold text-muted-foreground tabular-nums">
        {index + 1}
      </span>

      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted',
          !active && 'opacity-55'
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <Gift className="size-5 text-muted-foreground" />
        )}
      </span>

      <div className={cn('min-w-0 flex-1', !active && 'opacity-55')}>
        <div className="truncate font-semibold">{reward.title}</div>
        <div className="flex items-center gap-1 text-[13px] font-semibold text-gold-foreground">
          <DiamondIcon className="size-3.5" /> {formatNumber(reward.cost)}
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {reward.premiumOnly && (
          <StatusPill tone="warning">
            <Crown className="size-3.5" /> Premium
          </StatusPill>
        )}
        {!active && <StatusPill tone="neutral">Faolsiz</StatusPill>}
      </div>

      <div className="flex shrink-0 gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Yuqoriga"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Pastga"
          disabled={disabled || index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
    </li>
  );
}

// Katalog tartibini belgilash: sudrab yoki ↑↓ bilan, "Saqlash" da butun tartib yuboriladi.
// Ro'yxatda faqat faol mukofotlar — o'quvchi katalogida faqat ular ko'rinadi.
export function RewardOrderEditor({ onDone }: { onDone: () => void }) {
  const { data, isLoading, isError, refetch } = useRewards({
    page: 1,
    limit: ORDER_LIMIT,
    includeInactive: true,
  });
  const reorder = useReorderRewards();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Foydalanuvchi o'zgartirgan tartib; null — serverdagi tartib (hali tegilmagan)
  const [orderIds, setOrderIds] = useState<string[] | null>(null);

  const serverItems = data?.items ?? [];
  // Faqat faollari tartiblanadi (o'quvchi faqat ularni ko'radi). isActive yo'q eski yozuvlar — faol.
  const serverActive = serverItems.filter((r) => r.isActive !== false);
  const serverInactive = serverItems.filter((r) => r.isActive === false);
  const byId = new Map(serverActive.map((r) => [r._id, r]));
  const items = orderIds
    ? orderIds.map((id) => byId.get(id)).filter((r): r is Reward => !!r)
    : serverActive;
  const dirty = !!orderIds && orderIds.some((id, i) => id !== serverActive[i]?._id);
  const incomplete = !!data && data.total > serverItems.length;
  const busy = reorder.isPending;

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    setOrderIds(arrayMove(items, from, to).map((r) => r._id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((r) => r._id === active.id);
    const to = items.findIndex((r) => r._id === over.id);
    if (from !== -1 && to !== -1) move(from, to);
  }

  // Backend to'liq ro'yxat kutadi: faollar yangi tartibda, faolsizlar esa ular ortidan
  // avvalgi nisbiy tartibida (qayta faollashtirilganda ro'yxat oxirida chiqadi)
  function save() {
    reorder.mutate([...items, ...serverInactive].map((r) => r._id), {
      onSuccess: () => setOrderIds(null),
    });
  }

  if (isLoading) return <div className="h-80 animate-pulse rounded-[20px] bg-muted" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (items.length === 0)
    return (
      <EmptyState
        icon={Gift}
        title="Faol mukofotlar yo'q"
        action={
          <Button variant="outline" onClick={onDone}>
            Yopish
          </Button>
        }
      />
    );

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary-soft px-4 py-3">
        <p className="flex items-start gap-2 text-sm text-primary">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            O&apos;quvchilar katalogida mukofotlar shu tartibda ko&apos;rinadi: yuqoridagisi
            birinchi. Sudrab yoki ↑↓ tugmalari bilan joyini o&apos;zgartiring.
          </span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => (dirty ? setOrderIds(null) : onDone())}
            disabled={busy}
          >
            {dirty ? 'Bekor qilish' : 'Yopish'}
          </Button>
          <Button onClick={save} disabled={!dirty || busy || incomplete}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Saqlash
          </Button>
        </div>
      </div>

      {incomplete && (
        <p className="flex items-start gap-2 rounded-xl bg-gold-soft px-3.5 py-2.5 text-sm text-gold-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Mukofotlar {ORDER_LIMIT} tadan ko&apos;p — hammasi bir ro&apos;yxatga sig&apos;madi,
          shuning uchun tartibni saqlab bo&apos;lmaydi.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((r) => r._id)} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2">
            {items.map((reward, index) => (
              <SortableRewardRow
                key={reward._id}
                reward={reward}
                index={index}
                count={items.length}
                disabled={busy}
                onMove={move}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
