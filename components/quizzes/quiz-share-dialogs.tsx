'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, CheckCircle2, Clock, Inbox, Loader2, Search, Send, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  useAcceptQuizShare,
  useQuizShares,
  useRejectQuizShare,
  useShareQuiz,
} from '@/hooks/use-quizzes';
import { useTeachersSearch, type TeacherOption } from '@/hooks/use-users';
import { resolveAssetUrl } from '@/lib/config';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Quiz, QuizShare, QuizShareStatus } from '@/types';

const STATUS_META: Record<
  QuizShareStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: {
    label: 'Kutilmoqda',
    className: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400',
    icon: Clock,
  },
  accepted: {
    label: 'Qabul qilingan',
    className: 'bg-success/10 text-success ring-1 ring-success/20',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rad etilgan',
    className: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
    icon: XCircle,
  },
};

function quizTitle(share: QuizShare) {
  if (share.quiz && typeof share.quiz === 'object') return share.quiz.title;
  return 'Test';
}

function teacherLabel(teacher: QuizShare['fromTeacher']) {
  if (!teacher || typeof teacher !== 'object') return '—';
  return teacher.phone ? `${teacher.name} · +${teacher.phone}` : teacher.name;
}

interface ShareQuizDialogProps {
  quiz: Pick<Quiz, '_id' | 'title'> | null;
  onOpenChange: (open: boolean) => void;
}

// Faqat standalone testlar ulashiladi — qabul qiluvchi o'qituvchiga testning
// nusxasi yaratiladi, asl test esa o'zgarmaydi.
export function ShareQuizDialog({ quiz, onOpenChange }: ShareQuizDialogProps) {
  const shareQuiz = useShareQuiz();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<TeacherOption | null>(null);
  const teachers = useTeachersSearch(debouncedSearch, !!quiz);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSearch('');
      setDebouncedSearch('');
      setSelected(null);
    }
    onOpenChange(open);
  }

  function handleShare() {
    if (!quiz || !selected) return;
    shareQuiz.mutate(
      { quizId: quiz._id, toTeacherPhone: selected.phone },
      { onSuccess: () => handleOpenChange(false) }
    );
  }

  const list = teachers.data ?? [];

  return (
    <Dialog open={!!quiz} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Testni ulashish</DialogTitle>
          <DialogDescription>
            &quot;{quiz?.title}&quot; testining nusxasi o&apos;qituvchiga yuboriladi. U qabul qilsa,
            test uning testlari ro&apos;yxatida paydo bo&apos;ladi — sizning testingiz
            o&apos;zgarmaydi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="O'qituvchi ismi yoki telefon raqami..."
              className="pl-9"
              aria-label="O'qituvchini qidirish"
              autoFocus
            />
            {teachers.isFetching && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <div
            role="listbox"
            aria-label="O'qituvchilar"
            className="max-h-64 overflow-y-auto rounded-lg border border-border/70"
          >
            {teachers.isLoading ? (
              <p className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Yuklanmoqda...
              </p>
            ) : teachers.isError ? (
              <p className="p-4 text-center text-sm text-destructive">
                O&apos;qituvchilarni yuklab bo&apos;lmadi
              </p>
            ) : list.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {debouncedSearch ? 'Hech kim topilmadi' : "O'qituvchilar topilmadi"}
              </p>
            ) : (
              list.map((teacher) => {
                const isSelected = selected?._id === teacher._id;
                return (
                  <button
                    key={teacher._id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelected(teacher)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-border/50 px-3 py-2.5 text-left transition-colors last:border-0',
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/60'
                    )}
                  >
                    <Avatar size="sm">
                      <AvatarImage src={resolveAssetUrl(teacher.avatar)} alt={teacher.name} />
                      <AvatarFallback>{initials(teacher.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{teacher.name}</span>
                      <span className="block text-xs text-muted-foreground">+{teacher.phone}</span>
                    </span>
                    {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
          {!debouncedSearch && list.length >= 20 && (
            <p className="text-xs text-muted-foreground">
              Ko&apos;pi bilan 20 ta ko&apos;rsatiladi — kerakli o&apos;qituvchini qidiring.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleShare} disabled={!selected || shareQuiz.isPending}>
            {shareQuiz.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {selected ? `${selected.name}ga ulashish` : 'Ulashish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function shareDateTime(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "Ulashilgan testlar" sahifasi (edu-platform-dizayn: QuizShares)
export function QuizSharesPanel() {
  const router = useRouter();
  const [direction, setDirection] = useState<'incoming' | 'outgoing'>('incoming');
  const [status, setStatus] = useState<QuizShareStatus | 'all'>('all');
  const { data, isLoading, isError, refetch } = useQuizShares(
    direction,
    status === 'all' ? undefined : status
  );
  const { data: pendingIncoming } = useQuizShares('incoming', 'pending');
  const acceptShare = useAcceptQuizShare();
  const rejectShare = useRejectQuizShare();
  const pendingCount = pendingIncoming?.length ?? 0;

  function handleAccept(shareId: string) {
    acceptShare.mutate(shareId, {
      // Nusxa nofaol va eski sinflar bilan keladi — o'qituvchi darhol o'z
      // sinfini tanlashi kerak, aks holda test boshqa sinf uchun qolib ketadi.
      onSuccess: (clonedQuiz) => router.push(`/teacher/quizzes/${clonedQuiz._id}?shared=1`),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex gap-1 rounded-xl bg-muted p-1">
          {(
            [
              {
                value: 'incoming',
                label: `Menga ulashilganlar${pendingCount > 0 ? ` · ${pendingCount}` : ''}`,
              },
              { value: 'outgoing', label: 'Men ulashganlar' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={direction === tab.value}
              onClick={() => setDirection(tab.value)}
              className={cn(
                'rounded-[9px] px-4 py-2.5 font-semibold transition-colors',
                direction === tab.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus((v as QuizShareStatus | 'all') ?? 'all')}
          items={{
            all: 'Barcha holatlar',
            pending: 'Kutilmoqda',
            accepted: 'Qabul qilingan',
            rejected: 'Rad etilgan',
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Holati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="pending">Kutilmoqda</SelectItem>
            <SelectItem value="accepted">Qabul qilingan</SelectItem>
            <SelectItem value="rejected">Rad etilgan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            direction === 'incoming'
              ? 'Sizga hali test ulashilmagan'
              : 'Siz hali test ulashmagansiz'
          }
          description={
            direction === 'outgoing'
              ? 'Testlarim sahifasida mustaqil test yonidagi «Ulashish» tugmasini bosing'
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((share) => {
            const meta = STATUS_META[share.status];
            const StatusIcon = meta.icon;
            const accepting = acceptShare.isPending && acceptShare.variables === share._id;
            const rejecting = rejectShare.isPending && rejectShare.variables === share._id;
            const cloned =
              share.clonedQuiz && typeof share.clonedQuiz === 'object' ? share.clonedQuiz : null;
            return (
              <article
                key={share._id}
                className="flex flex-wrap items-center gap-3.5 rounded-[18px] border border-border bg-card px-4 py-4 sm:px-[18px]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-heading font-bold text-primary">
                  T
                </span>
                <div className="min-w-0 flex-[1_1_260px]">
                  <div className="font-bold wrap-break-word">{quizTitle(share)}</div>
                  <div className="text-sm text-muted-foreground">
                    {direction === 'incoming' ? 'Kimdan: ' : 'Kimga: '}
                    {teacherLabel(direction === 'incoming' ? share.fromTeacher : share.toTeacher)}
                    {share.createdAt && ` · ${shareDateTime(share.createdAt)}`}
                  </div>
                </div>
                {direction === 'incoming' && share.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-destructive/35 text-destructive hover:bg-destructive-soft hover:text-destructive"
                      onClick={() => rejectShare.mutate(share._id)}
                      disabled={accepting || rejecting}
                    >
                      {rejecting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <X className="size-4" />
                      )}
                      Rad etish
                    </Button>
                    <Button
                      className="bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => handleAccept(share._id)}
                      disabled={accepting || rejecting}
                    >
                      {accepting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Qabul qilish
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {direction === 'incoming' && cloned && (
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/teacher/quizzes/${cloned._id}`} />}
                      >
                        Testni ochish
                      </Button>
                    )}
                    <Badge className={cn('gap-1 px-3 py-1.5 text-[13px]', meta.className)}>
                      <StatusIcon className="size-3.5" /> {meta.label}
                    </Badge>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
