'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  Activity,
  Award,
  BookOpen,
  ClipboardList,
  Gift,
  RotateCw,
  TimerOff,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { StatusPill, type StatusPillTone } from '@/components/dashboard/dashboard-ui';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import {
  useUserHistory,
  useUserRedemptions,
  type DiamondHistoryItem,
  type DiamondSource,
  type EnrollmentStatus,
  type UserActivityItem,
  type UserActivityType,
} from '@/hooks/use-user-history';
import { ApiError, validationMessages } from '@/lib/api-client';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/roles';
import { cn } from '@/lib/utils';
import type { AttemptStatus, Paginated, RedemptionStatus, Role } from '@/types';

const ALL = 'all';

// --- Filtrlar: sana oralig'i + har bir tabga xos select'lar ---

// <input type="date"> qiymatini Toshkent kun chegarasiga aylantiradi
function dayBoundary(value: string, end: boolean) {
  return value ? `${value}T${end ? '23:59:59.999' : '00:00:00.000'}+05:00` : undefined;
}

// Sahifa, sana oralig'i va qo'shimcha filtrlar. Har qanday filtr o'zgarsa sahifa 1 ga qaytadi.
// 'all' qiymatli filtr so'rovga umuman qo'shilmaydi.
function useHistoryFilters<K extends string>(initial: Record<K, string>) {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selects, setSelects] = useState(initial);

  const params: { page: number } & Record<string, string | number | undefined> = {
    page,
    from: dayBoundary(from, false),
    to: dayBoundary(to, true),
  };
  for (const [key, value] of Object.entries(selects) as [K, string][]) {
    params[key] = value === ALL ? undefined : value;
  }

  return {
    page,
    setPage,
    params,
    dates: {
      from,
      to,
      setFrom: (v: string) => {
        setFrom(v);
        setPage(1);
      },
      setTo: (v: string) => {
        setTo(v);
        setPage(1);
      },
    },
    select: (key: K) => ({
      value: selects[key],
      onChange: (v: string) => {
        setSelects((prev) => ({ ...prev, [key]: v }));
        setPage(1);
      },
    }),
  };
}

type FilterSelect = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
};

function FilterBar({
  dates,
  selects = [],
}: {
  dates: ReturnType<typeof useHistoryFilters>['dates'];
  selects?: FilterSelect[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {selects.map((s) => {
        const items = { [ALL]: s.label, ...s.options };
        return (
          <Select
            key={s.label}
            value={s.value}
            onValueChange={(v) => s.onChange(v ?? ALL)}
            items={items}
          >
            <SelectTrigger
              aria-label={s.label}
              className={cn(
                'w-48',
                s.value !== ALL && 'border-primary/50 bg-primary-soft font-semibold text-primary'
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(items).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={dates.from}
          max={dates.to || undefined}
          onChange={(e) => dates.setFrom(e.target.value)}
          aria-label="Boshlanish sanasi"
          className="w-40"
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="date"
          value={dates.to}
          min={dates.from || undefined}
          onChange={(e) => dates.setTo(e.target.value)}
          aria-label="Tugash sanasi"
          className="w-40"
        />
      </div>
    </div>
  );
}

// --- Umumiy qobiq: yuklanish / xato / bo'sh / sahifalash ---

function HistoryPanel<T>({
  query,
  icon,
  emptyTitle,
  emptyDescription,
  itemLabel,
  page,
  onPageChange,
  summary,
  filters,
  children,
}: {
  query: UseQueryResult<Paginated<T>>;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  itemLabel: string;
  page: number;
  onPageChange: (page: number) => void;
  summary?: ReactNode;
  filters?: ReactNode;
  children: (items: T[]) => ReactNode;
}) {
  const { data, isLoading, isError, error, refetch } = query;

  if (isLoading) return <div className="h-72 animate-pulse rounded-[20px] bg-muted" />;

  // Bu endpointlarda 404 — foydalanuvchi topilmadi
  if (isError && error instanceof ApiError && error.status === 404) {
    return <EmptyState icon={UserX} title="Foydalanuvchi topilmadi" />;
  }

  let body: ReactNode;
  if (isError && error instanceof ApiError && error.status === 422) {
    body = (
      <EmptyState
        icon={icon}
        title="Filtr qiymati noto'g'ri"
        description={validationMessages(error).join(' ')}
      />
    );
  } else if (isError) {
    body = <ErrorState onRetry={() => refetch()} />;
  } else if (!data || data.items.length === 0) {
    body = <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />;
  } else {
    body = (
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
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {summary}
      {filters}
      {body}
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

function Note({ children }: { children: ReactNode }) {
  return <div className="mt-0.5 text-xs font-normal text-muted-foreground">{children}</div>;
}

function refTitle(ref: { title?: string } | null | undefined, fallback: string) {
  return ref?.title ?? <span className="text-muted-foreground">{fallback}</span>;
}

const linkClass = 'underline-offset-2 hover:text-primary hover:underline';

// 691 -> "11 daq 31 s"
function shortDuration(seconds: number | null | undefined) {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m} daq ${s} s` : `${s} s`;
}

function attemptResultHref(quizId: string, attemptId: string) {
  return `/teacher/quizzes/${quizId}/results/${attemptId}`;
}

// --- Testlar ---

const ATTEMPT_PILL: Record<AttemptStatus, { label: string; tone: StatusPillTone }> = {
  in_progress: { label: 'Davom etmoqda', tone: 'primary' },
  submitted: { label: 'Tekshirilmoqda', tone: 'warning' },
  reviewed: { label: 'Baholangan', tone: 'success' },
  expired: { label: 'Vaqt tugagan', tone: 'danger' },
};

export function AttemptsPanel({ userId }: { userId: string }) {
  const f = useHistoryFilters({ status: ALL });
  const query = useUserHistory(userId, 'attempts', f.params);
  return (
    <HistoryPanel
      query={query}
      icon={ClipboardList}
      emptyTitle="Test urinishlari yo'q"
      itemLabel="urinish"
      page={f.page}
      onPageChange={f.setPage}
      filters={
        <FilterBar
          dates={f.dates}
          selects={[
            {
              label: 'Barcha holatlar',
              ...f.select('status'),
              options: Object.fromEntries(
                Object.entries(ATTEMPT_PILL).map(([k, v]) => [k, v.label])
              ),
            },
          ]}
        />
      }
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
            const pill = ATTEMPT_PILL[a.status] ?? { label: a.status, tone: 'neutral' };
            return (
              <tr key={a._id}>
                <td className="font-semibold">
                  {a.quiz ? (
                    <Link href={attemptResultHref(a.quiz._id, a._id)} className={linkClass}>
                      {a.quiz.title ?? 'Test'}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">O&apos;chirilgan test</span>
                  )}
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
                    <span className="inline-flex items-center gap-1 font-semibold text-success">
                      <DiamondIcon className="size-3.5" />+{formatNumber(a.diamondsEarned)}
                    </span>
                  ) : (
                    muted
                  )}
                </td>
                <td className="whitespace-nowrap">{shortDuration(a.durationSeconds) ?? muted}</td>
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
  lesson: 'Dars tugatildi',
  spin: 'Kunlik spin',
  live_quiz: 'Jonli test',
  reward: "Sovg'a",
  reward_refund: "Sovg'a qaytarildi",
  attempt_revoked: 'Urinish bekor qilindi',
  admin_adjust: "Admin o'zgartirdi",
};

const TYPE_LABELS = { earn: 'Kirim', spend: 'Chiqim' };

// Manba nomi: yozuv paytidagi ref.title; havola faqat ochib bo'ladigan manbalar uchun
function DiamondRefTitle({ item }: { item: DiamondHistoryItem }) {
  const ref = item.ref;
  if (!ref) return muted;
  const title = ref.title ?? '—';
  if (ref.kind === 'attempt' && item.source !== 'attempt_revoked') {
    return (
      <Link href={`/admin/attempts/${ref._id}`} className={linkClass}>
        {title}
      </Link>
    );
  }
  if (ref.kind === 'redemption') {
    return (
      <Link href="?tab=rewards" scroll={false} className={linkClass}>
        {title}
      </Link>
    );
  }
  return <>{title}</>;
}

export function DiamondsPanel({ userId, balance }: { userId: string; balance: number }) {
  const f = useHistoryFilters({ type: ALL, source: ALL });
  const query = useUserHistory(userId, 'diamond-history', f.params);
  // summary butun tarix bo'yicha keladi — filtr o'zgarganda ham o'zgarmaydi
  const summary = query.data?.summary;
  const stats = [
    { label: 'Joriy balans', value: summary?.balance ?? balance },
    { label: 'Jami topilgan', value: summary?.totalEarned, tone: 'text-success' },
    { label: 'Jami sarflangan', value: summary?.totalSpent, tone: 'text-destructive' },
  ];

  return (
    <HistoryPanel
      query={query}
      icon={Award}
      emptyTitle="Olmos harakati yo'q"
      emptyDescription="Eski foydalanuvchilarda tarix migratsiyadan keyin to'liq ko'rinadi."
      itemLabel="yozuv"
      page={f.page}
      onPageChange={f.setPage}
      summary={
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
      filters={
        <FilterBar
          dates={f.dates}
          selects={[
            { label: 'Kirim va chiqim', ...f.select('type'), options: TYPE_LABELS },
            { label: 'Barcha manbalar', ...f.select('source'), options: SOURCE_LABELS },
          ]}
        />
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
          minWidth={720}
        >
          {items.map((h) => {
            const earn = h.type === 'earn';
            return (
              <tr key={h._id}>
                <td className="font-semibold whitespace-nowrap">
                  {SOURCE_LABELS[h.source as DiamondSource] ?? 'Boshqa'}
                </td>
                <td>
                  <DiamondRefTitle item={h} />
                  {h.note && <Note>{h.note}</Note>}
                  {h.actor && <Note>{h.actor.name}</Note>}
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

const ENROLLMENT_PILL: Record<EnrollmentStatus, { label: string; tone: StatusPillTone }> = {
  active: { label: "O'qimoqda", tone: 'primary' },
  completed: { label: 'Tugatilgan', tone: 'success' },
  cancelled: { label: 'Bekor qilingan', tone: 'neutral' },
};

export function EnrollmentsPanel({ userId }: { userId: string }) {
  const f = useHistoryFilters({ status: ALL });
  const query = useUserHistory(userId, 'enrollments', f.params);
  return (
    <HistoryPanel
      query={query}
      icon={BookOpen}
      emptyTitle="Kurslarga yozilmagan"
      itemLabel="kurs"
      page={f.page}
      onPageChange={f.setPage}
      filters={
        <FilterBar
          dates={f.dates}
          selects={[
            {
              label: 'Barcha holatlar',
              ...f.select('status'),
              // cancelled filtri backend'da yo'q (422) — faqat shu ikkitasi
              options: { active: "O'qimoqda", completed: 'Tugatilgan' },
            },
          ]}
        />
      }
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
            const status = (e.status ?? 'active') as EnrollmentStatus;
            const pill = ENROLLMENT_PILL[status] ?? { label: String(e.status), tone: 'neutral' };
            return (
              <tr key={e._id}>
                <td className="font-semibold">{refTitle(e.course, "O'chirilgan kurs")}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          status === 'completed' ? 'bg-success' : 'bg-primary'
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
                  <StatusPill tone={pill.tone}>
                    {pill.label}
                    {status === 'completed' && e.completedAt
                      ? ` · ${formatDate(e.completedAt)}`
                      : ''}
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
  const f = useHistoryFilters({});
  const query = useUserHistory(userId, 'certificates', f.params);
  return (
    <HistoryPanel
      query={query}
      icon={Award}
      emptyTitle="Sertifikatlar yo'q"
      itemLabel="sertifikat"
      page={f.page}
      onPageChange={f.setPage}
      filters={<FilterBar dates={f.dates} />}
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
  const f = useHistoryFilters({});
  const query = useUserHistory(userId, 'spin-history', f.params);
  return (
    <HistoryPanel
      query={query}
      icon={RotateCw}
      emptyTitle="Spin tarixi yo'q"
      itemLabel="spin"
      page={f.page}
      onPageChange={f.setPage}
      filters={<FilterBar dates={f.dates} />}
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
              <td>
                {s.question?.text ?? (
                  <span className="text-muted-foreground italic">Savol saqlanmagan</span>
                )}
              </td>
              <td className="whitespace-nowrap">
                {s.status === 'expired' ? (
                  <StatusPill tone="warning">
                    <TimerOff className="size-3.5" /> Vaqtida javob berilmadi
                  </StatusPill>
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

export function RedemptionsPanel({ userId }: { userId: string }) {
  const f = useHistoryFilters({ status: ALL });
  const query = useUserRedemptions(userId, f.params);
  return (
    <HistoryPanel
      query={query}
      icon={Gift}
      emptyTitle="Sovg'a so'rovlari yo'q"
      itemLabel="so'rov"
      page={f.page}
      onPageChange={f.setPage}
      filters={
        <FilterBar
          dates={f.dates}
          selects={[
            {
              label: 'Barcha holatlar',
              ...f.select('status'),
              options: Object.fromEntries(
                Object.entries(REDEMPTION_PILL).map(([k, v]) => [k, v.label])
              ),
            },
          ]}
        />
      }
    >
      {(items) => (
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
            const pill = REDEMPTION_PILL[r.status] ?? { label: r.status, tone: 'neutral' };
            return (
              <tr key={r._id}>
                <td className="font-semibold">
                  {/* Sovg'a o'chirilgan bo'lsa reward: null keladi (typeof null === 'object') */}
                  {r.reward && typeof r.reward === 'object' ? (
                    r.reward.title
                  ) : (
                    <span className="text-muted-foreground">O&apos;chirilgan sovg&apos;a</span>
                  )}
                  {r.status === 'rejected' && r.rejectReason && <Note>{r.rejectReason}</Note>}
                  {r.adminNote && <Note>{r.adminNote}</Note>}
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
      )}
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

const LOGIN_METHODS: Record<string, string> = {
  password: 'Parol bilan',
  telegram_otp: 'Telegram kodi bilan',
  telegram_webapp: 'Telegram ilovasi orqali',
};

const REGISTER_VIA: Record<string, string> = {
  web: 'Sayt orqali',
  telegram_bot: 'Telegram bot orqali',
  admin: 'Admin yaratdi',
};

const TARIF_NAMES: Record<string, string> = { standart: 'Standart', premium: 'Premium' };
const FIELD_LABELS: Record<string, string> = { name: 'ism', phone: 'telefon' };

function str(value: unknown) {
  return typeof value === 'string' && value !== '' ? value : null;
}

function activityDetail(item: UserActivityItem): { main: string | null; extra?: string | null } {
  const meta = item.meta ?? {};
  const from = str(meta.from);
  const to = str(meta.to);
  switch (item.type) {
    case 'login':
      return {
        main: LOGIN_METHODS[str(meta.method) ?? ''] ?? null,
        extra: str(meta.ip) ? `IP ${meta.ip}` : null,
      };
    case 'register':
      return { main: REGISTER_VIA[str(meta.via) ?? ''] ?? null };
    case 'role_changed':
      return {
        main:
          from && to
            ? `${ROLE_LABELS[from as Role] ?? from} → ${ROLE_LABELS[to as Role] ?? to}`
            : null,
      };
    case 'tarif_changed': {
      const change = `${TARIF_NAMES[from ?? ''] ?? from ?? '—'} → ${TARIF_NAMES[to ?? ''] ?? to ?? '—'}`;
      if (meta.reason === 'expired') {
        const at = str(meta.expiredAt);
        return { main: change, extra: `Muddati tugadi${at ? ` · ${formatDate(at)}` : ''}` };
      }
      const until = str(meta.expiresAt);
      return {
        main: `${change}${until ? ` (${formatDate(until)} gacha)` : ''}`,
        extra: meta.paymentId ? "To'lov orqali" : null,
      };
    }
    case 'grade_changed':
      return { main: `${from ?? '—'} → ${to ?? '—'}` };
    case 'profile_updated':
      return {
        main: Array.isArray(meta.fields)
          ? meta.fields.map((f) => FIELD_LABELS[String(f)] ?? String(f)).join(', ')
          : null,
      };
    default:
      return { main: null };
  }
}

// actor: null — tizim hodisasi (premium muddati tugashi) yoki foydalanuvchining o'zi
function activityActor(item: UserActivityItem) {
  if (item.actor) return item.actor.name;
  return item.meta?.reason === 'expired' ? 'Tizim' : "O'zi";
}

export function ActivityPanel({ userId }: { userId: string }) {
  const f = useHistoryFilters({ type: ALL });
  const query = useUserHistory(userId, 'activity', f.params);
  return (
    <HistoryPanel
      query={query}
      icon={Activity}
      emptyTitle="Faollik qayd etilmagan"
      emptyDescription="Faollik jurnali 20-noyabr 2026 dan yuritiladi."
      itemLabel="hodisa"
      page={f.page}
      onPageChange={f.setPage}
      filters={
        <FilterBar
          dates={f.dates}
          selects={[{ label: 'Barcha hodisalar', ...f.select('type'), options: ACTIVITY_LABELS }]}
        />
      }
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
          {items.map((a) => {
            const detail = activityDetail(a);
            const userAgent = a.type === 'login' ? str(a.meta?.userAgent) : null;
            return (
              <tr key={a._id}>
                <td className="font-semibold whitespace-nowrap">
                  {ACTIVITY_LABELS[a.type as UserActivityType] ?? 'Boshqa hodisa'}
                </td>
                <td className="max-w-96" title={userAgent ?? undefined}>
                  {detail.main ?? (detail.extra ? null : muted)}
                  {detail.extra && <Note>{detail.extra}</Note>}
                </td>
                <td className="whitespace-nowrap">
                  {a.actor ? (
                    a.actor.name
                  ) : (
                    <span className="text-muted-foreground">{activityActor(a)}</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(a.createdAt)}
                </td>
              </tr>
            );
          })}
        </HistoryTable>
      )}
    </HistoryPanel>
  );
}
