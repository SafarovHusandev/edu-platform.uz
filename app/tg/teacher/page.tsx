'use client';

import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import {
  TgAvatar,
  TgCallout,
  TgCard,
  TgEmpty,
  TgPage,
  TgPill,
  TgSectionTitle,
  TgSkeletonList,
  TgStat,
  TgStatGrid,
} from '@/components/tg/tg-ui';
import { quizGradesLabel, quizStatus } from '@/components/tg/tg-quiz-utils';
import { usePendingReviewsCount, useQuizShares, useQuizzesMy } from '@/hooks/use-quizzes';
import { useTeacherStats, useTopTeachers } from '@/hooks/use-stats';
import { useAuthStore } from '@/store/auth-store';
import { formatNumber } from '@/lib/format';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Xayrli tun,';
  if (hour < 11) return 'Xayrli tong,';
  if (hour < 18) return 'Xayrli kun,';
  return 'Xayrli kech,';
}

export default function TgTeacherHomePage() {
  const user = useAuthStore((s) => s.user);
  const stats = useTeacherStats();
  const top = useTopTeachers(1, 1);
  const pending = usePendingReviewsCount();
  const shares = useQuizShares('incoming', 'pending');
  const quizzes = useQuizzesMy({ page: 1, limit: 3 });

  const s = stats.data;
  const pendingCount = pending.data ?? 0;
  const firstShare = shares.data?.[0];
  const shareFrom =
    firstShare?.fromTeacher && typeof firstShare.fromTeacher === 'object'
      ? firstShare.fromTeacher.name
      : null;
  const shareTitle =
    firstShare?.quiz && typeof firstShare.quiz === 'object' ? firstShare.quiz.title : null;
  const myRank = top.data?.me?.rank;

  return (
    <TgPage>
      <div className="flex items-center gap-3">
        <TgAvatar name={user?.name} src={user?.avatar} className="bg-success text-white" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-muted-foreground">{greeting()}</div>
          <div className="truncate text-[17px] font-bold">{user?.name}</div>
        </div>
        {user?.tarif === 'premium' && (
          <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-foreground">
            PREMIUM
          </span>
        )}
      </div>

      <TgStatGrid>
        <TgStat
          accent
          label="Kurslar"
          value={s?.courses.total ?? 0}
          hint={`${s?.courses.published ?? 0} nashrda`}
          loading={stats.isLoading}
          href="/tg/teacher/courses"
        />
        <TgStat
          label="O'rtacha ball"
          value={s ? Math.round(s.quizzes.avgScore) : 0}
          hint={s ? `${Math.round(s.quizzes.passRate)}% o'tdi` : undefined}
          hintTone="success"
          loading={stats.isLoading}
        />
        <TgStat
          label="Reyting"
          value={s?.rating.avg ? `★ ${s.rating.avg.toFixed(1)}` : '—'}
          hint={myRank ? `${myRank}-o'rin` : undefined}
          loading={stats.isLoading}
          href="/tg/teacher/rank"
        />
      </TgStatGrid>

      {pendingCount > 0 && (
        <TgCallout
          href="/tg/teacher/grading"
          badge={pendingCount > 99 ? '99+' : pendingCount}
          title="Tekshirish kerak"
          description="Ochiq savollarga ball qo'ying"
        />
      )}

      {firstShare && (
        <TgCallout
          tone="primary"
          href="/tg/teacher/shares"
          badge="T"
          title={
            (shares.data?.length ?? 0) > 1
              ? `Sizga ${shares.data?.length} ta test ulashildi`
              : 'Sizga test ulashildi'
          }
          description={[shareFrom, shareTitle && `«${shareTitle}»`].filter(Boolean).join(' · ')}
        />
      )}

      <TgSectionTitle href="/tg/teacher/quizzes">Testlarim</TgSectionTitle>
      {quizzes.isLoading ? (
        <TgSkeletonList count={2} height={64} />
      ) : (quizzes.data?.items.length ?? 0) === 0 ? (
        <TgEmpty
          icon={ClipboardList}
          title="Hali test yaratmagansiz"
          action={
            <Link
              href="/tg/teacher/quizzes/new"
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="size-4" /> Test yaratish
            </Link>
          }
        />
      ) : (
        quizzes.data?.items.map((quiz) => {
          const status = quizStatus(quiz);
          const st = quiz.stats;
          return (
            <TgCard key={quiz._id} href={`/tg/teacher/quizzes/${quiz._id}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 font-bold wrap-break-word">{quiz.title}</span>
                <TgPill tone={status.tone}>{status.label}</TgPill>
              </div>
              <span className="text-[13px] text-muted-foreground">
                {[
                  quizGradesLabel(quiz),
                  st && st.attemptsCount > 0
                    ? `${formatNumber(st.attemptsCount)} urinish`
                    : `${quiz.questionsCount ?? 0} savol`,
                  st?.avgScorePercent != null ? `o'rtacha ${Math.round(st.avgScorePercent)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </TgCard>
          );
        })
      )}
    </TgPage>
  );
}
