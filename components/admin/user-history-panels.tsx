'use client';

import { useState, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  Activity,
  Award,
  BookOpen,
  ClipboardList,
  Construction,
  Gift,
  RotateCw,
  type LucideIcon,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { StatusPill, type StatusPillTone } from '@/components/dashboard/dashboard-ui';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import {
  isEndpointMissing,
  useUserHistory,
  useUserRedemptions,
  type DiamondSource,
  type UserActivityItem,
  type UserActivityType,
} from '@/hooks/use-user-history';
import { formatDate, formatDateTime, formatDuration, formatNumber } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/roles';
import { cn } from '@/lib/utils';
import type { AttemptStatus, Paginated, RedemptionStatus, Role, User } from '@/types';

// --- Umumiy qobiq: yuklanish / xato / endpoint yo'q / bo'sh / sahifalash ---

function HistoryPanel<T>({
  query,
  endpoint,
  icon,
  emptyTitle,
  itemLabel,
  page,
  onPageChange,
  header,
  children,
}: {
  query: UseQueryResult<Paginated<T>>;
  endpoint: string;
  icon: LucideIcon;
  emptyTitle: string;
  itemLabel: string;
  page: number;
  onPageChange: (page: number) => void;
  header?: ReactNode;
  children: (items: T[]) => ReactNode;
}) {
  const { data, isLoading, isError, error, refetch } = query;

  if (isLoading) return <div className="h-72 animate-pulse rounded-[20px] bg-muted" />;

  if (isError && isEndpointMissing(error)) {
    return (
      <EmptyState
        icon={Construction}
        title="Bu bo'lim tez orada ishga tushadi"
        description={`Backend'da ${endpoint} hali tayyor emas.`}
      />
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-3.5">
      {header}
      {!data || data.items.length === 0 ? (
        <EmptyState icon={icon} title={emptyTitle} />
      ) : (
        <>
          {children(data.items)}
          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel={itemLabel}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}

function HistoryTable({
  columns,
  minWidth = 640,
  children,
}: {
  columns: { label: string; align?: 'right' }[];
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[20px] border border-border bg-card">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="bg-muted/50 text-left text-[13px] text-muted-foreground">
            {columns.map((col, i) => (
              <th
                key={col.label}
                className={cn(
                  'py-3.5 font-semibold',
                  i === 0 || i === columns.length - 1 ? 'px-5' : 'px-3',
                  col.align === 'right' && 'text-right'
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-t [&>tr]:border-muted [&_td]:px-3 [&_td]:py-3 [&_td:first-child]:px-5 [&_td:last-child]:px-5">
          {children}
        </tbody>
      </table>
    </div>
  );
}

const muted = <span className="text-muted-foreground">—</span>;

function refTitle(ref: { title?: string } | null | undefined, fallback: string) {
  return ref?.title ?? <span className="text-muted-foreground">{fallback}</span>;
}

// --- Testlar ---

const ATTEMPT_PILL: Record<AttemptStatus, { label: string; tone: StatusPillTone }> = {
  in_progress: { label: 'Davom etmoqda', tone: 'primary' },
  submitted: { label: 'Tekshirilmoqda', tone: 'warning' },
  reviewed: { label: 'Baholangan', tone: 'success' },
  expired: { label: 'Vaqt tugagan', tone: 'danger' },
};

export function AttemptsPanel({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const query = useUserHistory(userId, 'attempts', { page });
  return (
    <HistoryPanel
      query={query}
      endpoint="GET /users/:id/attempts"
      icon={ClipboardList}
      emptyTitle="Test urinishlari yo'q"
      itemLabel="urinish"
      page={page}
      onPageChange={setPage}
    >
      {(items) => (
        <HistoryTable
          columns={[
            { label: 'Test' },
            { label: 'Natija' },
            { label: 'Olmos', align: 'right' },
            { label: 'Davomiyligi' },
            { label: 'Boshlangan' },
            { label: 'Holat' },
          ]}
          minWidth={760}
        >
          {items.map((a) => {
            const pill = ATTEMPT_PILL[a.status] ?? {
              label: a.status,
              tone: 'neutral',
            };
            return (
              <tr key={a._id}>
                <td className="font-semibold">
                  {refTitle(a.quiz, "O'chirilgan test")}
                  {a.attemptNumber != null && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      #{a.attemptNumber}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap tabular-nums">
                  {a.scorePercent != null ? (
                    <span className={cn('font-semibold', a.passed && 'text-success')}>
                      {Math.round(a.scorePercent)}%
                      {a.totalPoints != null && (
                        <span className="ml-1 font-normal text-muted-foreground">
                          ({a.earnedPoints ?? 0}/{a.totalPoints})
                        </span>
                      )}
                    </span>
                  ) : (
                    muted
                  )}
                </td>
                <td className="text-right tabular-nums">
                  {a.diamondsEarned ? (
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <DiamondIcon className="size-3.5" />+{formatNumber(a.diamondsEarned)}
                    </span>
                  ) : (
                    muted
                  )}
                </td>
                <td className="whitespace-nowrap">{formatDuration(a.durationSeconds) ?? muted}</td>
                <td className="whitespace-nowrap text-muted-foreground">
                  {a.startedAt ? formatDateTime(a.startedAt) : '—'}
                </td>
                <td>
                  <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                </td>
              </tr>
            );
          })}
        </HistoryTable>
      )}
    </HistoryPanel>
  );
}

// --- Olmoslar ---

const SOURCE_LABELS: Record<DiamondSource, string> = {
  quiz: 'Test',
  spin: 'Kunlik spin',
  live_quiz: 'Jonli test',
  reward: "Sovg'a",
  reward_refund: "Sovg'a qaytarildi",
  attempt_revoked: 'Urinish bekor qilindi',
  admin_adjust: "Admin o'zgartirdi",
};

export function DiamondsPanel({ userId, balance }: { userId: string; balance: number }) {
  const [page, setPage] = useState(1);
  const query = useUserHistory(userId, 'diamond-history', { page });
  const summary = query.data?.summary;
  const stats = [
    { label: 'Joriy balans', value: summary?.balance ?? balance },
    {
      label: 'Jami topilgan',
      value: summary?.totalEarned,
      tone: 'text-success',
    },
    {
      label: 'Jami sarflangan',
      value: summary?.totalSpent,
      tone: 'text-destructive',
    },
  ];

  return (
    <HistoryPanel
      query={query}
      endpoint="GET /users/:id/diamond-history"
      icon={Award}
      emptyTitle="Olmos harakati yo'q"
      itemLabel="yozuv"
      page={page}
      onPageChange={setPage}
      header={
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-[18px] border border-border bg-card px-4 py-3.5">
              <p className="text-[13px] text-muted-foreground">{s.label}</p>
              <p
                className={cn(
                  'mt-1 flex items-center gap-1.5 text-xl font-bold tabular-nums',
                  s.tone
                )}
              >
                <DiamondIcon className="size-5" />
                {s.value != null ? formatNumber(s.value) : '—'}
              </p>
            </div>
          ))}
        </div>
      }
    >
      {(items) => (
        <HistoryTable
          columns={[
            { label: 'Manba' },
            { label: 'Tafsilot' },
            { label: 'Miqdor', align: 'right' },
            { label: 'Balans', align: 'right' },
            { label: 'Sana' },
          ]}
        >
          {items.map((h) => {
            const earn = h.type === 'earn';
            return (
              <tr key={h._id}>
                <td className="font-semibold whitespace-nowrap">
                  {SOURCE_LABELS[h.source as DiamondSource] ?? h.source}
                </td>
                <td className="text-muted-foreground">
                  {[h.ref?.title, h.note, h.actor ? `· ${h.actor.name}` : null]
                    .filter(Boolean)
                    .join(' ') || '—'}
                </td>
                <td
                  className={cn(
                    'text-right font-bold whitespace-nowrap tabular-nums',
                    earn ? 'text-success' : 'text-destructive'
                  )}
                >
                  {earn ? '+' : '−'}
                  {formatNumber(h.amount)}
                </td>
                <td className="text-right whitespace-nowrap tabular-nums">
                  {h.balanceAfter != null ? formatNumber(h.balanceAfter) : '—'}
                </td>
                <td className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(h.createdAt)}
                </td>
              </tr>
            );
          })}
        </HistoryTable>
      )}
    </HistoryPanel>
  );
}

// --- Kurslar ---

export function EnrollmentsPanel({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const query = useUserHistory(userId, 'enrollments', { page });
  return (
    <HistoryPanel
      query={query}
      endpoint="GET /users/:id/enrollments"
      icon={BookOpen}
      emptyTitle="Kurslarga yozilmagan"
      itemLabel="kurs"
      page={page}
      onPageChange={setPage}
    >
      {(items) => (
        <HistoryTable
          columns={[
            { label: 'Kurs' },
            { label: 'Progress' },
            { label: 'Yozilgan' },
            { label: 'Holat' },
          ]}
        >
          {items.map((e) => {
            const progress = Math.max(0, Math.min(100, Math.round(e.progress ?? 0)));
            const completed = e.status === 'completed';
            return (
              <tr key={e._id}>
                <td className="font-semibold">{refTitle(e.course, "O'chirilgan kurs")}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          completed ? 'bg-success' : 'bg-primary'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="tabular-nums">{progress}%</span>
                    {e.totalLessons != null && (
                      <span className="text-xs text-muted-foreground">
                        {e.completedLessonsCount ?? 0}/{e.totalLessons} dars
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap text-muted-foreground">
                  {e.createdAt ? formatDate(e.createdAt) : '—'}
                </td>
                <td>
                  <StatusPill tone={completed ? 'success' : 'primary'}>
                    {completed
                      ? `Tugatilgan${e.completedAt ? ` · ${formatDate(e.completedAt)}` : ''}`
                      : "O'qimoqda"}
                  </StatusPill>
                </td>
              </tr>
            );
          })}
        </HistoryTable>
      )}
    </HistoryPanel>
  );
}

// --- Sertifikatlar ---

export function CertificatesPanel({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const query = useUserHistory(userId, 'certificates', { page });
  return (
    <HistoryPanel
      query={query}
      endpoint="GET /users/:id/certificates"
      icon={Award}
      emptyTitle="Sertifikatlar yo'q"
      itemLabel="sertifikat"
      page={page}
      onPageChange={setPage}
    >
      {(items) => (
        <HistoryTable
          columns={[{ label: 'Kurs' }, { label: 'Raqam' }, { label: 'Berilgan sana' }]}
          minWidth={520}
        >
          {items.map((c) => (
            <tr key={c._id}>
              <td className="font-semibold">{refTitle(c.course, "O'chirilgan kurs")}</td>
              <td className="font-mono text-[13px]">{c.certificateNumber}</td>
              <td className="whitespace-nowrap text-muted-foreground">{formatDate(c.issuedAt)}</td>
            </tr>
          ))}
        </HistoryTable>
      )}
    </HistoryPanel>
  );
}

// --- Kunlik spin ---

export function SpinPanel({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const query = useUserHistory(userId, 'spin-history', { page });
  return (
    <HistoryPanel
      query={query}
      endpoint="GET /users/:id/spin-history"
      icon={RotateCw}
      emptyTitle="Spin tarixi yo'q"
      itemLabel="spin"
      page={page}
      onPageChange={setPage}
    >
      {(items) => (
        <HistoryTable
          columns={[
            { label: 'Savol' },
            { label: 'Javob' },
            { label: 'Olmos', align: 'right' },
            { label: 'Sana' },
          ]}
        >
          {items.map((s) => (
            <tr key={s._id}>
              <td>{s.question?.text ?? <span className="text-muted-foreground">—</span>}</td>
              <td>
                {s.status === 'expired' ? (
                  <StatusPill tone="neutral">Vaqt tugadi</StatusPill>
                ) : s.answeredCorrectly ? (
                  <StatusPill tone="success">To&apos;g&apos;ri</StatusPill>
                ) : s.answeredCorrectly === false ? (
                  <StatusPill tone="danger">Noto&apos;g&apos;ri</StatusPill>
                ) : (
                  muted
                )}
              </td>
              <td className="text-right tabular-nums">
                {s.diamondsWon > 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-success">
                    <DiamondIcon className="size-3.5" />+{formatNumber(s.diamondsWon)}
                  </span>
                ) : (
                  muted
                )}
              </td>
              <td className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(s.createdAt)}
              </td>
            </tr>
          ))}
        </HistoryTable>
      )}
    </HistoryPanel>
  );
}

// --- Sovg'alar ---

const REDEMPTION_PILL: Record<RedemptionStatus, { label: string; tone: StatusPillTone }> = {
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  approved: { label: 'Tasdiqlandi', tone: 'primary' },
  delivered: { label: 'Topshirildi', tone: 'success' },
  rejected: { label: 'Rad etildi', tone: 'danger' },
};

export function RedemptionsPanel({ user }: { user: User }) {
  const [page, setPage] = useState(1);
  const query = useUserRedemptions(user._id, user.phone, page);
  return (
    <HistoryPanel
      query={query}
      endpoint="GET /rewards/redemptions"
      icon={Gift}
      emptyTitle="Sovg'a so'rovlari yo'q"
      itemLabel="so'rov"
      page={page}
      onPageChange={setPage}
    >
      {(all) => {
        // Backend userId filtrini e'tiborsiz qoldirsa, telefon qidiruvi o'xshash raqamli
        // boshqa o'quvchilarni ham qaytarishi mumkin — ularni chiqarib tashlaymiz
        const items = all.filter(
          (r) => typeof r.student !== 'object' || r.student._id === user._id
        );
        if (items.length === 0) return <EmptyState icon={Gift} title="Sovg'a so'rovlari yo'q" />;
        return (
          <HistoryTable
            columns={[
              { label: "Sovg'a" },
              { label: 'Olmos', align: 'right' },
              { label: 'Sana' },
              { label: 'Holat' },
            ]}
            minWidth={560}
          >
            {items.map((r) => {
              const pill = REDEMPTION_PILL[r.status] ?? {
                label: r.status,
                tone: 'neutral',
              };
              return (
                <tr key={r._id}>
                  <td className="font-semibold">
                    {typeof r.reward === 'object' ? r.reward.title : "Sovg'a"}
                    {r.status === 'rejected' && r.rejectReason && (
                      <div className="text-xs font-normal text-muted-foreground">
                        {r.rejectReason}
                      </div>
                    )}
                  </td>
                  <td className="text-right tabular-nums">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <DiamondIcon className="size-3.5" />
                      {formatNumber(r.diamondsSpent)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td>
                    <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                  </td>
                </tr>
              );
            })}
          </HistoryTable>
        );
      }}
    </HistoryPanel>
  );
}

// --- Faollik ---

const ACTIVITY_LABELS: Record<UserActivityType, string> = {
  login: 'Tizimga kirdi',
  register: "Ro'yxatdan o'tdi",
  verified: 'Tasdiqlandi',
  blocked: 'Bloklandi',
  unblocked: 'Blokdan chiqarildi',
  role_changed: "Rol o'zgardi",
  tarif_changed: "Tarif o'zgardi",
  grade_changed: "Sinf o'zgardi",
  password_reset: 'Parol tiklandi',
  avatar_removed: "Rasm o'chirildi",
  profile_updated: "Ma'lumotlar o'zgardi",
};

const FIELD_LABELS: Record<string, string> = { name: 'ism', phone: 'telefon' };

function activityDetail(item: UserActivityItem) {
  const meta = item.meta ?? {};
  const from = meta.from != null ? String(meta.from) : null;
  const to = meta.to != null ? String(meta.to) : null;
  if (item.type === 'role_changed' && from && to)
    return `${ROLE_LABELS[from as Role] ?? from} → ${ROLE_LABELS[to as Role] ?? to}`;
  if (item.type === 'tarif_changed' && to) {
    const until =
      typeof meta.expiresAt === 'string' ? ` (${formatDate(meta.expiresAt)} gacha)` : '';
    return `${from ?? '—'} → ${to}${until}`;
  }
  if (item.type === 'grade_changed') return `${from ?? '—'} → ${to ?? '—'}`;
  if (item.type === 'profile_updated' && Array.isArray(meta.fields))
    return meta.fields.map((f) => FIELD_LABELS[String(f)] ?? String(f)).join(', ');
  if (item.type === 'login' && typeof meta.userAgent === 'string') return meta.userAgent;
  return null;
}

export function ActivityPanel({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const query = useUserHistory(userId, 'activity', { page });
  return (
    <HistoryPanel
      query={query}
      endpoint="GET /users/:id/activity"
      icon={Activity}
      emptyTitle="Faollik qayd etilmagan"
      itemLabel="hodisa"
      page={page}
      onPageChange={setPage}
    >
      {(items) => (
        <HistoryTable
          columns={[
            { label: 'Hodisa' },
            { label: 'Tafsilot' },
            { label: 'Kim' },
            { label: 'Sana' },
          ]}
        >
          {items.map((a) => (
            <tr key={a._id}>
              <td className="font-semibold whitespace-nowrap">
                {ACTIVITY_LABELS[a.type as UserActivityType] ?? a.type}
              </td>
              <td
                className="max-w-80 truncate text-muted-foreground"
                title={activityDetail(a) ?? ''}
              >
                {activityDetail(a) ?? '—'}
              </td>
              <td className="whitespace-nowrap">
                {a.actor ? a.actor.name : <span className="text-muted-foreground">O&apos;zi</span>}
              </td>
              <td className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(a.createdAt)}
              </td>
            </tr>
          ))}
        </HistoryTable>
      )}
    </HistoryPanel>
  );
}
