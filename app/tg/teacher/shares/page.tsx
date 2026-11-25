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
      <TgHeader title="Ulashilgan testlar" />
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
                className="flex flex-col gap-2 rounded-[18px] border border-primary/25 bg-card p-3.5"
              >
                <div className="font-bold wrap-break-word">{titleOf(share)}</div>
                <div className="text-[13px] text-muted-foreground">
                  Kimdan: {nameOf(share.fromTeacher)}
                  {share.createdAt && ` · ${formatTashkentDateTime(share.createdAt)}`}
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busyId === share._id}
                    onClick={() => {
                      setBusyId(share._id);
                      reject.mutate(share._id, { onSettled: () => setBusyId(null) });
                    }}
                    className="h-11 rounded-xl border border-border bg-background text-sm font-semibold disabled:opacity-50"
                  >
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
                          // Nusxa faol emas — darhol tahrirga o'tib sinfni tekshiradi
                          if (cloned?._id) router.push(`/tg/teacher/quizzes/${cloned._id}`);
                        },
                        onSettled: () => setBusyId(null),
                      });
                    }}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
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
            <div role="status" className="flex flex-col gap-1 rounded-2xl bg-primary-soft px-3.5 py-3 text-[13px]">
              <span className="font-bold text-primary">Qabul qilingandan keyin</span>
              <span className="text-secondary-foreground">
                Nusxa faol emas va asl sinflarga biriktirilgan bo&apos;ladi. Testni ochib, o&apos;z
                sinfingizni web versiyada tanlang va faollashtiring.
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
