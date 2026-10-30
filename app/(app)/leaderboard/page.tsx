'use client';

import { useState } from 'react';
import { Presentation, Star, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { PageHeader } from '@/components/ui/page-header';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useLeaderboard } from '@/hooks/use-users';
import { useTopTeachers } from '@/hooks/use-stats';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TeacherRanking, User } from '@/types';

const STUDENT_WINDOW = 50;

type Tab = 'students' | 'teachers';

function gradeLabel(user: User) {
  return user.grade?.number ? `${user.grade.number}-${user.grade.letter ?? ''}` : null;
}

// Podium tartibi: 2 · 1 · 3 (dizayndagidek o'rtada birinchi o'rin)
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_STYLES = [
  {
    avatar: 'size-[76px] bg-white text-primary text-xl',
    column: 'h-[140px] bg-gold text-admin',
    rank: 'text-3xl',
    diamonds: 'text-gold-foreground',
  },
  {
    avatar: 'size-16 bg-admin-muted text-admin text-lg',
    column: 'h-[100px] bg-white/15',
    rank: 'text-2xl',
    diamonds: 'text-gold',
  },
  {
    avatar: 'size-16 bg-[#B45309] text-white text-lg',
    column: 'h-[76px] bg-white/15',
    rank: 'text-[22px]',
    diamonds: 'text-gold',
  },
];

function Podium({ entries }: { entries: User[] }) {
  return (
    <section className="grid grid-cols-3 items-end gap-2 rounded-3xl bg-primary px-3 pt-6 text-primary-foreground sm:gap-4 sm:px-7 sm:pt-7">
      {PODIUM_ORDER.map((index) => {
        const entry = entries[index];
        if (!entry) return <div key={index} />;
        const style = PODIUM_STYLES[index];
        return (
          <div key={entry._id} className="flex min-w-0 flex-col items-center gap-2 text-center">
            <Avatar className={cn('font-bold', style.avatar)}>
              <AvatarImage src={resolveAssetUrl(entry.avatar)} alt={entry.name} />
              <AvatarFallback className={cn('font-bold', style.avatar)}>
                {initials(entry.name)}
              </AvatarFallback>
            </Avatar>
            <span className="w-full truncate text-sm font-bold sm:text-base">{entry.name}</span>
            {gradeLabel(entry) && (
              <span className="text-[13px] text-primary-foreground/75">{gradeLabel(entry)}</span>
            )}
            <div
              className={cn(
                'flex w-full flex-col items-center justify-center rounded-t-2xl',
                style.column
              )}
            >
              <span className={cn('font-heading font-bold', style.rank)}>{index + 1}</span>
              <span className={cn('flex items-center gap-1 text-sm font-bold', style.diamonds)}>
                <DiamondIcon className="size-4" /> {formatNumber(entry.diamonds ?? 0)}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function StudentRow({ rank, entry, isMe }: { rank: string; entry: User; isMe: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-muted px-4 py-3.5 last:border-0 sm:px-5',
        isMe && 'bg-primary-soft'
      )}
    >
      <span className="w-9 shrink-0 font-heading font-semibold text-muted-foreground">{rank}</span>
      <span className="min-w-0 flex-1 truncate font-semibold">
        {entry.name}
        {isMe && ' (siz)'}
        {gradeLabel(entry) && (
          <span className="text-sm font-medium text-muted-foreground"> · {gradeLabel(entry)}</span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1 font-heading font-semibold text-gold-foreground">
        <DiamondIcon className="size-4" /> {formatNumber(entry.diamonds ?? 0)}
      </span>
    </div>
  );
}

function StudentsRanking() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useLeaderboard(1, STUDENT_WINDOW);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        <div className="h-80 animate-pulse rounded-[20px] bg-muted" />
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const items = data?.items ?? [];
  if (items.length === 0) return <EmptyState icon={Trophy} title="Hali reyting mavjud emas" />;

  const hasPodium = items.length >= 3;
  const rest = hasPodium ? items.slice(3) : items;
  const meInList = items.some((entry) => entry._id === user?._id);
  const showMe = user?.role === 'student' && !meInList;

  return (
    <div className="flex flex-col gap-5">
      {hasPodium && <Podium entries={items.slice(0, 3)} />}
      {(rest.length > 0 || showMe) && (
        <section className="overflow-hidden rounded-[20px] border border-border bg-card">
          {rest.map((entry, idx) => (
            <StudentRow
              key={entry._id}
              rank={String(idx + (hasPodium ? 4 : 1))}
              entry={entry}
              isMe={entry._id === user?._id}
            />
          ))}
          {showMe && user && (
            <StudentRow
              rank={data?.me ? String(data.me.rank) : `${STUDENT_WINDOW}+`}
              entry={{ ...user, diamonds: data?.me?.diamonds ?? user.diamonds }}
              isMe
            />
          )}
        </section>
      )}
    </div>
  );
}

function TeachersRanking() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useTopTeachers(page, 10);
  // Backend "me" ni o'rin va ball bilan qaytaradi; kurs/test soni faqat
  // o'qituvchi joriy sahifada bo'lsa ma'lum
  const me = data?.me ?? null;
  const meDetails = user ? data?.items.find((t) => t._id === user._id) : undefined;

  return (
    <div className="flex flex-col gap-5">
      {me && (
        <section className="flex flex-wrap items-center gap-5 rounded-[20px] bg-primary px-6 py-5 text-primary-foreground">
          <span className="font-heading text-[44px] font-bold leading-none">{me.rank}</span>
          <div className="min-w-0 flex-[1_1_220px]">
            <p className="text-lg font-bold">Siz · {user?.name}</p>
            <p className="text-sm text-primary-foreground/75">
              Faollik balingiz: {formatNumber(me.activityScore)}
            </p>
          </div>
          {meDetails && (
            <div className="flex gap-6">
              {[
                { value: meDetails.coursesCount, label: 'kurs' },
                { value: meDetails.quizzesCount, label: 'test' },
                { value: meDetails.avgRating.toFixed(1), label: 'reyting' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-heading text-xl font-bold">{stat.value}</div>
                  <div className="text-[13px] text-primary-foreground/75">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-[20px] bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Presentation} title="Hali o'qituvchilar reytingi mavjud emas" />
      ) : (
        <>
          <section className="overflow-hidden rounded-[20px] border border-border bg-card">
            {data.items.map((teacher) => (
              <TeacherRow key={teacher._id} teacher={teacher} isMe={teacher._id === user?._id} />
            ))}
          </section>
          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="o'qituvchi"
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function TeacherRow({ teacher, isMe }: { teacher: TeacherRanking; isMe: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-muted px-4 py-3.5 last:border-0 sm:px-5',
        isMe && 'bg-primary-soft'
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-[10px] font-heading text-sm font-bold',
          teacher.rank === 1
            ? 'bg-gold text-admin'
            : teacher.rank <= 3
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
        )}
      >
        {teacher.rank}
      </span>
      <Avatar>
        <AvatarImage src={resolveAssetUrl(teacher.avatar)} alt={teacher.name} />
        <AvatarFallback className="text-[13px] font-bold">{initials(teacher.name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-[1_1_160px]">
        <span className="block truncate font-bold">
          {teacher.name}
          {isMe && ' (siz)'}
        </span>
        <span className="block text-[13px] text-muted-foreground">
          {formatNumber(teacher.studentsCount)} o&apos;quvchi · {formatNumber(teacher.lessonsCount)}{' '}
          dars · {formatNumber(teacher.booksCount)} kitob
        </span>
      </span>
      <span className="w-20 text-sm text-secondary-foreground">{teacher.coursesCount} kurs</span>
      <span className="w-20 text-sm text-secondary-foreground">{teacher.quizzesCount} test</span>
      <span className="flex w-16 items-center justify-end gap-1 font-bold">
        <Star className="size-4 fill-gold text-gold" /> {teacher.avgRating.toFixed(1)}
      </span>
    </div>
  );
}

export default function LeaderboardPage() {
  const role = useAuthStore((s) => s.user?.role);
  // O'qituvchilar reytingi o'quvchilardan yashirilgan
  const canSeeTeachers = role !== 'student';
  const [tab, setTab] = useState<Tab>(role === 'teacher' ? 'teachers' : 'students');
  const activeTab = canSeeTeachers ? tab : 'students';

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={activeTab === 'students' ? "Eng ko'p olmos to'plaganlar" : "Eng faol o'qituvchilar"}
        actions={
          canSeeTeachers && (
            <FilterPills
              value={activeTab}
              onChange={setTab}
              options={[
                { value: 'students', label: "O'quvchilar" },
                { value: 'teachers', label: "O'qituvchilar" },
              ]}
            />
          )
        }
      />
      {activeTab === 'students' ? <StudentsRanking /> : <TeachersRanking />}
    </div>
  );
}
