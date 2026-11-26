'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox, Loader2 } from 'lucide-react';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgPage,
  TgPill,
  TgSegment,
  TgSkeletonList,
  type TgTone,
} from '@/components/tg/tg-ui';
import { useAcceptQuizShare, useQuizShares, useRejectQuizShare } from '@/hooks/use-quizzes';
import { formatTashkentDateTime } from '@/lib/format';
import { haptic } from '@/lib/telegram-webapp';
import type { QuizShare, QuizShareStatus } from '@/types';

const STATUS: Record<QuizShareStatus, { label: string; tone: TgTone }> = {
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  accepted: { label: 'Qabul qilindi', tone: 'success' },
  rejected: { label: 'Rad etildi', tone: 'danger' },
};

function titleOf(share: QuizShare) {
  return share.quiz && typeof share.quiz === 'object' ? share.quiz.title : 'Test';
}

function nameOf(person: QuizShare['fromTeacher']) {
  return person && typeof person === 'object' ? person.name : '—';
}

export default function TgQuizSharesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const shares = useQuizShares(tab);
  const pendingIncoming = useQuizShares('incoming', 'pending');
  const accept = useAcceptQuizShare();
  const reject = useRejectQuizShare();
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = shares.data ?? [];
  const pending = list.filter((s) => s.status === 'pending');
  const done = list.filter((s) => s.status !== 'pending');
  const newCount = pendingIncoming.data?.length ?? 0;

  return (
    <TgPage>
      <TgHeader variant="inner" title="Ulashilgan testlar" />
      <TgSegment
        value={tab}
        onChange={setTab}
        options={[
          { value: 'incoming', label: newCount > 0 ? `Menga · ${newCount}` : 'Menga' },
          { value: 'outgoing', label: 'Men ulashganlar' },
        ]}
      />

      {shares.isLoading ? (
        <TgSkeletonList count={3} height={84} />
      ) : shares.isError ? (
        <TgError onRetry={() => shares.refetch()} />
      ) : list.length === 0 ? (
        <TgEmpty
          icon={Inbox}
          title={tab === 'incoming' ? 'Sizga hali test ulashilmagan' : 'Hali test ulashmagansiz'}
          description={
            tab === 'outgoing'
              ? "Testlarim bo'limida mustaqil test yonidagi «Ulashish» tugmasini bosing"
              : undefined
          }
        />
      ) : (
        <>
          {tab === 'incoming' &&
            pending.map((share) => (
              <article
                key={share._id}
                className="flex flex-col gap-2.5 rounded-2xl border-[1.5px] border-primary/45 bg-card p-3.5"
              >
                <div className="font-bold wrap-break-word">{titleOf(share)}</div>
                <div className="text-[13px] text-secondary-foreground">
                  Kimdan: {nameOf(share.fromTeacher)}
                  {share.createdAt && ` · ${formatTashkentDateTime(share.createdAt)}`}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busyId === share._id}
                    onClick={() => {
                      setBusyId(share._id);
                      reject.mutate(share._id, {
                        onSuccess: () => haptic('success'),
                        onSettled: () => setBusyId(null),
                      });
                    }}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-destructive/35 bg-card text-sm font-semibold text-destructive disabled:opacity-50"
                  >
                    {busyId === share._id && reject.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Rad etish
                  </button>
                  <button
                    type="button"
                    disabled={busyId === share._id}
                    onClick={() => {
                      setBusyId(share._id);
                      accept.mutate(share._id, {
                        onSuccess: (cloned) => {
                          haptic('success');
                          // Nusxa faol emas — darhol tahrirga o'tib sinfni tanlaydi
                          if (cloned?._id) router.push(`/tg/teacher/quizzes/${cloned._id}`);
                        },
                        onError: () => haptic('error'),
                        onSettled: () => setBusyId(null),
                      });
                    }}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] bg-success text-sm font-bold text-success-foreground disabled:opacity-50"
                  >
                    {busyId === share._id && accept.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Qabul qilish
                  </button>
                </div>
              </article>
            ))}

          {tab === 'incoming' && pending.length > 0 && (
            <div
              role="status"
              className="flex flex-col gap-1 rounded-[14px] border border-success/30 bg-success-soft px-3.5 py-3 text-[13px]"
            >
              <span className="font-bold text-success">Qabul qilingandan keyin</span>
              <span className="leading-normal text-secondary-foreground">
                Nusxa faol emas va hali asl sinflarga biriktirilgan. Qabul qilgach test tahririga
                o&apos;tasiz — u yerda «Sinflar» bo&apos;limidan o&apos;z sinfingizni tanlab,
                faollashtirasiz.
              </span>
            </div>
          )}

          {(tab === 'incoming' ? done : list).map((share) => {
            const status = STATUS[share.status];
            return (
              <article
                key={share._id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{titleOf(share)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {tab === 'incoming' ? nameOf(share.fromTeacher) : `→ ${nameOf(share.toTeacher)}`}
                    {share.createdAt && ` · ${formatTashkentDateTime(share.createdAt)}`}
                  </span>
                </span>
                <TgPill tone={status.tone}>{status.label}</TgPill>
              </article>
            );
          })}
        </>
      )}
    </TgPage>
  );
}
