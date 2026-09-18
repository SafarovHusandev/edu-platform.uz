'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronsUp,
  ClipboardList,
  Crown,
  GraduationCap,
  Library,
  LogIn,
  Medal,
  NotebookText,
  Presentation,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { useLeaderboard } from '@/hooks/use-users';
import { useTopTeachers } from '@/hooks/use-stats';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api-client';
import type { TeacherRanking, User } from '@/types';

const PODIUM_STYLES = [
  {
    order: 'sm:order-2',
    ring: 'ring-amber-400 dark:ring-amber-400',
    badge: 'bg-linear-to-r from-amber-400 to-amber-500 text-slate-950 font-bold',
    card: 'sm:-translate-y-5 bg-linear-to-b from-amber-500/15 via-card to-card border-2 border-amber-400/50 shadow-2xl shadow-amber-500/20 card-hover-glow',
    avatarSize: 'size-20 sm:size-24',
    icon: Crown,
    rankNum: '1',
  },
  {
    order: 'sm:order-1',
    ring: 'ring-slate-300 dark:ring-slate-400',
    badge: 'bg-linear-to-r from-slate-300 to-slate-400 text-slate-900 font-bold',
    card: 'bg-linear-to-b from-slate-400/15 via-card to-card border border-slate-300 dark:border-slate-700 shadow-xl shadow-slate-500/10 card-hover-glow',
    avatarSize: 'size-16 sm:size-18',
    icon: Medal,
    rankNum: '2',
  },
  {
    order: 'sm:order-3',
    ring: 'ring-orange-400 dark:ring-orange-500',
    badge: 'bg-linear-to-r from-orange-400 to-orange-600 text-white font-bold',
    card: 'bg-linear-to-b from-orange-500/15 via-card to-card border border-orange-400/40 dark:border-orange-500/30 shadow-xl shadow-orange-500/10 card-hover-glow',
    avatarSize: 'size-16 sm:size-18',
    icon: Medal,
    rankNum: '3',
  },
];

// O'qituvchilar reytingida ham 1-2-3 o'rin uchun bir xil rang tili (Crown/Medal,
// oltin/kumush/bronza) ishlatiladi, lekin metrikalar ko'pligi sababli (kurs,
// test, dars, kitob, reyting, o'quvchi) qatorlar podium-karta emas, bitta
// tekis ro'yxat sifatida ko'rsatiladi — shaffoflik uchun har bir ko'rsatkich
// bir xil darajada ko'rinib turishi kerak.
const TEACHER_RANK_BADGES: Record<number, { badge: string; icon: LucideIcon }> = {
  1: { badge: 'bg-linear-to-r from-amber-400 to-amber-500 text-slate-950', icon: Crown },
  2: { badge: 'bg-linear-to-r from-slate-300 to-slate-400 text-slate-900', icon: Medal },
  3: { badge: 'bg-linear-to-r from-orange-400 to-orange-600 text-white', icon: Medal },
};

function PodiumCard({ entry, rank }: { entry: User; rank: number }) {
  const style = PODIUM_STYLES[rank - 1];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2.5 rounded-3xl p-5 text-center transition-all duration-300',
        style.order,
        style.card
      )}
    >
      <div className="relative">
        <Avatar
          className={cn(
            style.avatarSize,
            'ring-4 ring-offset-2 ring-offset-background shadow-md',
            style.ring
          )}
        >
          <AvatarImage src={resolveAssetUrl(entry.avatar)} alt={entry.name} />
          <AvatarFallback className="text-xl font-bold">{initials(entry.name)}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute -bottom-2 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full shadow-lg',
            style.badge
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 w-full">
        <p className="line-clamp-1 text-sm sm:text-base font-extrabold text-foreground">
          {entry.name}
        </p>
        {entry.grade?.number && (
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            {entry.grade.number}-{entry.grade.letter} sinf
          </p>
        )}
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-extrabold text-amber-600 dark:text-amber-400 shadow-xs">
        <Image src="/diamond.png" alt="" width={32} height={32} className="size-4.5" />
        {formatNumber(entry.diamonds ?? 0)}
      </span>
    </div>
  );
}

function MetricChip({
  icon: Icon,
  value,
  label,
  className,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-background px-2 py-1 text-xs font-semibold text-muted-foreground shadow-xs ring-1 ring-border/60',
        className
      )}
    >
      <Icon className="size-3.5" /> {value}
    </span>
  );
}

function TeacherRow({ teacher, isMe }: { teacher: TeacherRanking; isMe: boolean }) {
  const rankStyle = TEACHER_RANK_BADGES[teacher.rank];
  const RankIcon = rankStyle?.icon;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4 shadow-xs transition-all duration-200 card-hover-glow sm:flex-row sm:items-center',
        isMe
          ? 'border-primary/50 bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/20'
          : 'border-border/80 bg-card hover:border-primary/30'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="size-12 border border-border">
            <AvatarImage src={resolveAssetUrl(teacher.avatar)} alt={teacher.name} />
            <AvatarFallback className="font-bold">{initials(teacher.name)}</AvatarFallback>
          </Avatar>
          {rankStyle && RankIcon ? (
            <span
              className={cn(
                'absolute -bottom-1 -right-1 flex size-5.5 items-center justify-center rounded-full shadow-sm ring-2 ring-background',
                rankStyle.badge
              )}
            >
              <RankIcon className="size-3" />
            </span>
          ) : (
            <span className="absolute -bottom-1 -right-1 flex size-5.5 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-extrabold text-muted-foreground ring-2 ring-background">
              {teacher.rank}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-bold text-foreground">
            <span className="truncate">{teacher.name}</span>
            {isMe && (
              <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                Siz
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">#{teacher.rank}-o&apos;rin</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/40 p-1.5 sm:ml-auto">
        <MetricChip icon={GraduationCap} value={teacher.coursesCount} label="Kurslar" />
        <MetricChip icon={ClipboardList} value={teacher.quizzesCount} label="Testlar" />
        <MetricChip icon={NotebookText} value={teacher.lessonsCount} label="Darslar" />
        <MetricChip icon={Library} value={teacher.booksCount} label="Kitoblar" />
        <MetricChip
          icon={Star}
          value={teacher.avgRating.toFixed(1)}
          label="O'rtacha reyting"
          className="bg-gold/15 text-gold-foreground ring-gold/30"
        />
        <MetricChip
          icon={Users}
          value={teacher.studentsCount}
          label="O'quvchilar"
          className="bg-primary/10 text-primary ring-primary/20"
        />
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user);
  const [studentPage] = useState(1);
  const { data, isLoading, error } = useLeaderboard(studentPage, 20);

  const [teacherPage, setTeacherPage] = useState(1);
  const { data: teachersData, isLoading: isTeachersLoading } = useTopTeachers(teacherPage, 10);
  // O'qituvchining o'z o'rnini topish uchun — alohida, kattaroq limitli so'rov
  // (backendda alohida "mening o'rnim" endpointi yo'q, shuning uchun ro'yxat
  // ichidan qidiramiz). Faqat teacher rolidagi foydalanuvchi uchun yuboriladi.
  const { data: myRankData } = useTopTeachers(1, 100, { enabled: user?.role === 'teacher' });
  const myTeacherEntry = user ? myRankData?.items.find((t) => t._id === user._id) : undefined;

  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const items = data?.items ?? [];
  const hasPodium = items.length >= 3;
  const podium = hasPodium ? items.slice(0, 3) : [];
  const rest = hasPodium ? items.slice(3) : items;

  return (
    <Container className="py-12 max-w-4xl">
      <div className="mx-auto mb-10 max-w-xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Sparkles className="size-3.5" />
          <span>Eng Faol Ishtirokchilar</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Reyting Jadvali
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Darslar va testlarni muvaffaqiyatli topshirib eng ko&apos;p olmos to&apos;plagan
          o&apos;quvchilar, hamda eng faol o&apos;qituvchilar
        </p>
      </div>

      {isUnauthorized && !user ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-border/80 p-8 sm:p-12 text-center bg-card/60">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LogIn className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">
              Reytingni ko&apos;rish uchun tizimga kiring
            </p>
            <p className="text-xs text-muted-foreground">
              O&apos;z o&apos;rningizni bilish va raqobatda qatnashish uchun kiring
            </p>
          </div>
          <Button
            render={<Link href="/login?redirect=/leaderboard" />}
            className="rounded-xl px-6 font-bold shadow-md shadow-primary/20"
          >
            Tizimga kirish
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="students" className="mx-auto max-w-2xl ">
          <TabsList className="mx-auto h-auto! flex gap-4 p-1">
            <TabsTrigger value="students" className={'p-2 cursor-pointer text-[15px]'}>
              <GraduationCap className="size-5" /> O&apos;quvchilar
            </TabsTrigger>
            <TabsTrigger value="teachers" className={'p-2 cursor-pointer text-[15px]'}>
              <Presentation className="size-5" /> O&apos;qituvchilar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                <div className="mb-6 grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-48 animate-pulse rounded-3xl bg-muted" />
                  ))}
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {hasPodium && (
                  <div className="mb-10 grid grid-cols-3 items-end gap-3 sm:gap-4">
                    {podium.map((entry, idx) => (
                      <PodiumCard key={entry._id} entry={entry} rank={idx + 1} />
                    ))}
                  </div>
                )}

                <div className="space-y-2.5">
                  {rest.map((entry, idx) => {
                    const rank = idx + (hasPodium ? 4 : 1);
                    const isMe = !!user && entry._id === user._id;
                    return (
                      <div
                        key={entry._id}
                        className={cn(
                          'flex items-center gap-4 rounded-2xl border p-4 shadow-xs transition-all duration-200 card-hover-glow',
                          isMe
                            ? 'border-primary/50 bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/20'
                            : 'border-border/80 bg-card hover:border-primary/30'
                        )}
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60 font-mono text-sm font-extrabold text-muted-foreground">
                          {rank}
                        </div>
                        <Avatar className="size-10 border border-border">
                          <AvatarImage src={resolveAssetUrl(entry.avatar)} alt={entry.name} />
                          <AvatarFallback className="font-bold">
                            {initials(entry.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="flex items-center gap-2 text-sm font-bold text-foreground truncate">
                            <span>{entry.name}</span>
                            {isMe && (
                              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                                Siz
                              </span>
                            )}
                          </p>
                          {entry.grade?.number && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {entry.grade.number}-{entry.grade.letter} sinf
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
                          <Image
                            src="/diamond.png"
                            alt=""
                            width={32}
                            height={32}
                            className="size-4.5"
                          />
                          {formatNumber(entry.diamonds ?? 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="teachers" className="mt-6">
            {user?.role === 'teacher' && myTeacherEntry && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <ChevronsUp className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Siz hozir #{myTeacherEntry.rank} o&apos;rinda turibsiz
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Faollik balingiz: {myTeacherEntry.activityScore}
                  </p>
                </div>
              </div>
            )}

            {isTeachersLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : !teachersData || teachersData.items.length === 0 ? (
              <EmptyState icon={Presentation} title="Hali o'qituvchilar reytingi mavjud emas" />
            ) : (
              <>
                <div className="space-y-2.5">
                  {teachersData.items.map((teacher) => (
                    <TeacherRow
                      key={teacher._id}
                      teacher={teacher}
                      isMe={!!user && teacher._id === user._id}
                    />
                  ))}
                </div>
                <PaginationBar
                  page={teacherPage}
                  totalPages={teachersData.totalPages}
                  total={teachersData.total}
                  itemLabel="o'qituvchi"
                  onPageChange={setTeacherPage}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Container>
  );
}
