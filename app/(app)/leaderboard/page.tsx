'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Crown, Presentation, Sparkles, Star, TrendingUp, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { PageHeader } from '@/components/ui/page-header';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { Confetti, type ConfettiHandle } from '@/components/board-lesson/confetti';
import { useCountUp } from '@/hooks/use-count-up';
import { useLeaderboard } from '@/hooks/use-users';
import { useTopTeachers } from '@/hooks/use-stats';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TeacherRanking, User } from '@/types';

const STUDENT_WINDOW = 50;

type Tab = 'students' | 'teachers';
type RankedUser = User & { rank?: number };

const isPremium = (user: User) => user.tarif === 'premium';

function gradeLabel(user: User) {
  return user.grade?.number ? `${user.grade.number}-${user.grade.letter ?? ''}` : null;
}

function delay(ms: number): CSSProperties {
  return { animationDelay: `${ms}ms` };
}

function Diamonds({ value, delayMs = 0 }: { value: number; delayMs?: number }) {
  const current = useCountUp(value, 1200, delayMs);
  // O'lcham va rang ota pill'dan meros olinadi (podium/qator/"natijangiz" har xil fonda)
  return <span className="tabular-nums">{formatNumber(Math.round(current * 10) / 10)}</span>;
}

// Premium belgisi (olmos belgisi ball uchun band, shuning uchun toj)
function PremiumBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="Premium foydalanuvchi"
      className={cn(
        'lb-shine inline-flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-gold to-[#F59E0B] font-bold text-admin shadow-sm shadow-gold/40',
        compact ? 'size-6 justify-center ring-2 ring-white' : 'px-2 py-0.5 text-[11px] leading-4'
      )}
    >
      <Crown className={compact ? 'size-3.5' : 'size-3'} />
      {!compact && 'Premium'}
    </span>
  );
}

// Avatar halqasi: premiumda aylanib turadigan oltin, aks holda medal rangi
function RingedAvatar({
  user,
  ringClass,
  avatarClass,
  fallbackClass,
  thick = false,
}: {
  user: User;
  ringClass?: string;
  avatarClass: string;
  fallbackClass?: string;
  thick?: boolean;
}) {
  const premium = isPremium(user);
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full',
        thick ? 'p-1' : 'p-[2px]',
        !premium && ringClass
      )}
    >
      {premium && (
        <span
          aria-hidden
          className="lb-spin absolute inset-[-50%] bg-[conic-gradient(var(--gold),#FFF3B0,var(--gold),#F59E0B,var(--gold))]"
        />
      )}
      <Avatar className={cn('relative font-bold', avatarClass)}>
        <AvatarImage src={resolveAssetUrl(user.avatar)} alt={user.name} />
        <AvatarFallback className={cn('font-bold', fallbackClass)}>
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

// Podium tartibi: 2 · 1 · 3 (o'rtada birinchi o'rin). Ustunlar 3 → 2 → 1 ketma-ket ko'tariladi
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_STYLES = [
  {
    ring: 'bg-linear-to-br from-[#FFF3B0] via-[#FFD45C] to-[#F59E0B]',
    avatar: 'size-20 sm:size-24 text-2xl',
    fallback: 'bg-white text-primary',
    // Yorqin oltin metall
    column:
      'h-[178px] sm:h-[204px] bg-linear-to-b from-[#FFE89A] via-[#FFC93D] to-[#E8930C] shadow-[0_-12px_48px_-6px_rgb(255_201_61/0.75)]',
    rank: 'text-6xl sm:text-7xl text-[#7A3E00] [text-shadow:0_2px_0_rgb(255_255_255/0.55),0_5px_12px_rgb(122_62_0/0.35)]',
    diamonds: 'bg-white/60 text-[#7A3E00] shadow-sm',
    chip: 'bg-[#FFD45C] text-[#7A3E00]',
    label: 'Oltin',
    medal: 'from-[#FFF3B0] via-[#FFD45C] to-[#D97706] text-[#7A3E00]',
    stars: 3,
    starClass: 'fill-white text-white',
    delay: 400,
  },
  {
    ring: 'bg-linear-to-br from-white via-[#DCE4F7] to-[#94A3C8]',
    avatar: 'size-16 sm:size-[72px] text-lg',
    fallback: 'bg-slate-100 text-admin',
    // Kumush metall (sovuq ko'kish)
    column:
      'h-[148px] sm:h-[166px] bg-linear-to-b from-[#F4F7FF] via-[#C8D3F0] to-[#8796C4] shadow-[0_-10px_36px_-8px_rgb(200_211_240/0.6)]',
    rank: 'text-5xl text-[#3A4672] [text-shadow:0_2px_0_rgb(255_255_255/0.7),0_5px_12px_rgb(58_70_114/0.3)]',
    diamonds: 'bg-white/65 text-[#3A4672] shadow-sm',
    chip: 'bg-[#DCE4F7] text-[#3A4672]',
    label: 'Kumush',
    medal: 'from-white via-slate-200 to-slate-400 text-[#3A4672]',
    stars: 2,
    starClass: 'fill-white text-white',
    delay: 200,
  },
  {
    ring: 'bg-linear-to-br from-[#FFD2AE] via-[#E8894F] to-[#A9521F]',
    avatar: 'size-16 sm:size-[72px] text-lg',
    fallback: 'bg-[#B45309] text-white',
    // Bronza metall (iliq to'q sariq)
    column:
      'h-[128px] sm:h-[142px] bg-linear-to-b from-[#FFC9A0] via-[#E8894F] to-[#A9521F] shadow-[0_-10px_36px_-8px_rgb(232_137_79/0.6)]',
    rank: 'text-[40px] text-white [text-shadow:0_2px_0_rgb(122_50_10/0.45),0_5px_12px_rgb(122_50_10/0.35)]',
    diamonds: 'bg-[#6B2E0B]/30 text-white shadow-sm',
    chip: 'bg-[#E8894F] text-white',
    label: 'Bronza',
    medal: 'from-[#FBD3AE] via-[#E39B5F] to-[#9A4A1C] text-white',
    stars: 1,
    starClass: 'fill-[#FFF3B0] text-[#FFF3B0]',
    delay: 0,
  },
];

// Fon bezaklari (qiymatlar qat'iy — SSR va brauzerda bir xil)
const SPARKLES = [
  { className: 'top-6 left-[8%] size-4', delay: 0 },
  { className: 'top-16 left-[22%] size-3', delay: 900 },
  { className: 'top-5 right-[12%] size-5', delay: 400 },
  { className: 'top-24 right-[26%] size-3', delay: 1500 },
  { className: 'top-1/2 left-[4%] size-3', delay: 2000 },
  { className: 'top-1/2 right-[5%] size-4', delay: 1200 },
];
const STAR_DOTS = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 41 + 9) % 97}%`,
  top: `${(i * 23 + 6) % 60}%`,
  size: i % 4 === 0 ? 3 : 2,
  delay: (i * 370) % 2600,
}));
// Pastdan yuqoriga sekin suzib chiqadigan olmoschalar
const FLOAT_DIAMONDS = [
  { left: '6%', size: 'size-4', duration: 9, delay: 0 },
  { left: '18%', size: 'size-3', duration: 12, delay: 3 },
  { left: '31%', size: 'size-5', duration: 10, delay: 6 },
  { left: '69%', size: 'size-3', duration: 11, delay: 1.5 },
  { left: '82%', size: 'size-5', duration: 9.5, delay: 4.5 },
  { left: '93%', size: 'size-4', duration: 12.5, delay: 7.5 },
];
// 1-o'rin toji atrofidagi uchqunlar
const CROWN_SPARKS = [
  { className: '-top-12 -left-7 size-3.5', delay: 0 },
  { className: '-top-14 -right-6 size-3', delay: 700 },
  { className: '-top-4 -right-9 size-2.5', delay: 1300 },
];

const CONFETTI_SESSION_KEY = 'lb-confetti-shown';

function Podium({ entries }: { entries: RankedUser[] }) {
  const confetti = useRef<ConfettiHandle>(null);
  const championRef = useRef<HTMLDivElement>(null);

  // Ochilganda 1-o'rin avatari yonidan konfetti — sessiyada bir marta (har kirishda bezovta qilmasin)
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(CONFETTI_SESSION_KEY)) return;
      window.sessionStorage.setItem(CONFETTI_SESSION_KEY, '1');
    } catch {
      // sessionStorage yopiq — baribir ko'rsatamiz
    }
    const t = window.setTimeout(() => {
      const rect = championRef.current?.getBoundingClientRect();
      if (!rect) return;
      confetti.current?.burst({
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
        count: 160,
      });
      confetti.current?.rain(1400);
    }, 1300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-linear-to-b from-[#3A4BF2] via-[#3B2FCB] to-[#1C1A86] px-3 pt-16 text-primary-foreground shadow-2xl shadow-primary/30 sm:px-7">
      {/* Aurora: sekin suzuvchi rangli dog'lar */}
      <span
        aria-hidden
        className="lb-aurora absolute -top-28 -left-20 size-80 rounded-full bg-[#F472B6]/35 blur-3xl"
      />
      <span
        aria-hidden
        className="lb-aurora absolute -top-24 -right-16 size-72 rounded-full bg-[#22D3EE]/30 blur-3xl [animation-delay:-6s]"
      />
      <span
        aria-hidden
        className="animate-pulse-slow absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-gold/40 blur-3xl"
      />
      <span
        aria-hidden
        className="lb-aurora absolute -bottom-28 left-1/4 size-72 rounded-full bg-[#A78BFA]/30 blur-3xl [animation-delay:-11s]"
      />

      {SPARKLES.map((s) => (
        <Sparkles
          key={s.className}
          aria-hidden
          className={cn('lb-twinkle absolute text-white/80', s.className)}
          style={delay(s.delay)}
        />
      ))}
      {STAR_DOTS.map((d, i) => (
        <span
          key={i}
          aria-hidden
          className="lb-twinkle absolute rounded-full bg-white"
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, ...delay(d.delay) }}
        />
      ))}
      {FLOAT_DIAMONDS.map((d) => (
        <span
          key={d.left}
          aria-hidden
          className="lb-float-up absolute bottom-0"
          style={{ left: d.left, animationDuration: `${d.duration}s`, animationDelay: `${d.delay}s` }}
        >
          <DiamondIcon className={d.size} />
        </span>
      ))}

      {/* 1-o'ringa tushayotgan projektor nuri */}
      <span
        aria-hidden
        className="lb-spotlight pointer-events-none absolute top-0 left-1/2 h-[80%] w-[48%] -translate-x-1/2 bg-linear-to-b from-[#FFE58A]/35 via-[#FFE58A]/10 to-transparent [clip-path:polygon(40%_0,60%_0,100%_100%,0_100%)]"
      />
      {/* Sahna poli: yorug' chiziq va soya */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/60 to-transparent"
      />
      <span aria-hidden className="absolute inset-x-6 -bottom-3 h-8 rounded-[50%] bg-black/30 blur-xl" />
      <Confetti ref={confetti} />

      <div className="relative grid grid-cols-3 items-end gap-2 sm:gap-4">
        {PODIUM_ORDER.map((index) => {
          const entry = entries[index];
          if (!entry) return <div key={index} />;
          const style = PODIUM_STYLES[index];
          const first = index === 0;
          const rank = entry.rank ?? index + 1;
          return (
            <div key={entry._id} className="flex min-w-0 flex-col items-center text-center">
              <div
                ref={first ? championRef : undefined}
                className="lb-pop relative"
                style={delay(style.delay + 450)}
              >
                {first && (
                  <>
                    {/* Aylanadigan quyosh nurlari: manfiy inset avatar atrofida markazlaydi, ichki qatlam aylanadi */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-[90px] sm:-inset-[150px]"
                    >
                      <span className="lb-rays absolute inset-0 rounded-full bg-[repeating-conic-gradient(rgb(255_229_138/0.24)_0deg_7deg,transparent_7deg_22deg)] [mask-image:radial-gradient(circle,black_16%,transparent_64%)]" />
                    </span>
                    <span
                      aria-hidden
                      className="animate-pulse-slow absolute -inset-5 rounded-full bg-gold/55 blur-xl"
                    />
                    <Crown className="lb-crown absolute -top-11 left-1/2 size-10 -translate-x-1/2 fill-gold text-[#FFE58A] drop-shadow-[0_2px_12px_var(--gold)]" />
                    {CROWN_SPARKS.map((s) => (
                      <Sparkles
                        key={s.className}
                        aria-hidden
                        className={cn('lb-twinkle absolute text-[#FFE58A]', s.className)}
                        style={delay(s.delay)}
                      />
                    ))}
                  </>
                )}
                <RingedAvatar
                  user={entry}
                  ringClass={style.ring}
                  avatarClass={cn(style.avatar, 'shadow-[0_6px_18px_rgb(0_0_0/0.35)]')}
                  fallbackClass={style.fallback}
                  thick
                />
                {isPremium(entry) && (
                  <span className="absolute -top-1 -right-1">
                    <PremiumBadge compact />
                  </span>
                )}
                {/* Medal */}
                <span
                  className={cn(
                    'absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-linear-to-br font-heading font-bold shadow-[0_3px_8px_rgb(0_0_0/0.35)] ring-2 ring-white',
                    first ? 'size-8 text-base' : 'size-7 text-sm',
                    style.medal
                  )}
                >
                  {rank}
                </span>
              </div>

              <div className="lb-fade-up mt-4 w-full" style={delay(style.delay + 650)}>
                <span
                  className="line-clamp-2 px-1 text-sm leading-tight font-bold wrap-break-word drop-shadow-[0_1px_2px_rgb(0_0_0/0.3)] sm:text-base"
                  title={entry.name}
                >
                  {entry.name}
                </span>
                <span
                  className={cn(
                    'mt-1 inline-block rounded-full px-2.5 text-[11px] leading-5 font-bold tracking-wide uppercase shadow-sm',
                    style.chip
                  )}
                >
                  {gradeLabel(entry) ?? style.label}
                </span>
              </div>

              <div
                className={cn(
                  'lb-rise lb-shine relative mt-3 flex w-full flex-col items-center rounded-t-2xl pt-4',
                  style.column
                )}
                style={delay(style.delay)}
              >
                {/* 3D zinapoya: yuqori yorug' qirra, chap yaltiroq aks, o'ng soya */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-3 rounded-t-2xl bg-linear-to-b from-white/70 to-transparent"
                />
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/4 rounded-tl-2xl bg-linear-to-r from-white/35 to-transparent"
                />
                <span
                  aria-hidden
                  className="absolute inset-y-0 right-0 w-1/5 rounded-tr-2xl bg-linear-to-l from-black/15 to-transparent"
                />
                <div
                  className="lb-fade-up relative flex flex-col items-center gap-1.5"
                  style={delay(style.delay + 600)}
                >
                  <span className="flex gap-0.5">
                    {Array.from({ length: style.stars }, (_, i) => (
                      <Star
                        key={i}
                        aria-hidden
                        className={cn('lb-pop size-3.5 drop-shadow-sm sm:size-4', style.starClass)}
                        style={delay(style.delay + 800 + i * 120)}
                      />
                    ))}
                  </span>
                  <span className={cn('font-heading leading-none font-black', style.rank)}>{rank}</span>
                  <span
                    className={cn(
                      'mt-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-extrabold backdrop-blur-sm sm:px-3.5 sm:text-lg',
                      style.diamonds
                    )}
                  >
                    <DiamondIcon className="size-5" />
                    <Diamonds value={entry.diamonds ?? 0} delayMs={style.delay + 600} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// O'quvchining o'z natijasi: o'rni, olmoslari va keyingi o'ringacha qolgan farq
function MyStanding({
  user,
  rank,
  diamonds,
  above,
}: {
  user: User;
  rank: number;
  diamonds: number;
  above: User | undefined;
}) {
  const gap = above ? Math.max(Math.round(((above.diamonds ?? 0) - diamonds) * 10) / 10, 0.1) : 0;
  return (
    <section className="lb-fade-up relative flex flex-wrap items-center gap-4 overflow-hidden rounded-[20px] border border-primary/20 bg-linear-to-r from-primary-soft via-card to-card px-5 py-4">
      <span
        aria-hidden
        className="animate-pulse-slow absolute -top-12 -left-10 size-40 rounded-full bg-primary/15 blur-2xl"
      />
      <div className="relative flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
        <span className="text-[10px] leading-none font-semibold uppercase opacity-80">
          o&apos;rin
        </span>
        <span className="font-heading text-xl leading-tight font-bold">{rank}</span>
      </div>
      <div className="relative min-w-0 flex-[1_1_180px]">
        <p className="flex items-center gap-2 font-bold">
          <span className="truncate">Sizning natijangiz</span>
          {isPremium(user) && <PremiumBadge />}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          {rank === 1 ? (
            <>
              <Trophy className="size-4 text-gold" /> Siz birinchi o&apos;rindasiz — shunday davom
              eting!
            </>
          ) : above ? (
            <>
              <TrendingUp className="size-4 shrink-0 text-success" />
              <span className="truncate">
                {rank - 1}-o&apos;ringa chiqish uchun yana{' '}
                <b className="text-foreground">{formatNumber(gap)}</b> olmos kerak
              </span>
            </>
          ) : (
            "Darslarni tugatib, testlarni yechib olmos to'plang"
          )}
        </p>
      </div>
      <span className="relative flex items-center gap-1.5 rounded-full bg-gold-soft px-3.5 py-1.5 font-heading text-lg font-bold text-gold-foreground">
        <DiamondIcon className="size-5" />
        <Diamonds value={diamonds} />
      </span>
    </section>
  );
}

function StudentRow({
  rank,
  entry,
  isMe,
  index,
}: {
  rank: string;
  entry: User;
  isMe: boolean;
  index: number;
}) {
  const premium = isPremium(entry);
  const startMs = Math.min(index * 45, 900);
  // Tashqi blok — kirish animatsiyasi, ichki — hover (animatsiya transform'ni band qiladi)
  return (
    <div className="lb-fade-up" style={delay(startMs)}>
      <div
        className={cn(
          'group flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:px-4',
          isMe
            ? 'border-primary/40 bg-primary-soft ring-2 ring-primary/15'
            : premium
              ? 'border-gold/50 bg-linear-to-r from-gold-soft via-card to-card hover:shadow-gold/20'
              : 'border-border hover:border-primary/25'
        )}
      >
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold transition-colors',
            isMe
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground group-hover:bg-primary-soft group-hover:text-primary'
          )}
        >
          {rank}
        </span>
        <div className="transition-transform duration-300 group-hover:scale-110">
          <RingedAvatar
            user={entry}
            ringClass="bg-border"
            avatarClass="size-10 text-[13px]"
            fallbackClass="bg-primary-soft text-primary"
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 truncate font-semibold">
            {entry.name}
            {isMe && ' (siz)'}
            {gradeLabel(entry) && (
              <span className="text-sm font-medium text-muted-foreground">
                {' '}
                · {gradeLabel(entry)}
              </span>
            )}
          </span>
          {premium && <PremiumBadge />}
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold-soft px-3 py-1 font-heading text-sm font-semibold text-gold-foreground sm:text-base">
          <DiamondIcon className="size-4 transition-transform duration-300 group-hover:rotate-12" />
          <Diamonds value={entry.diamonds ?? 0} delayMs={startMs} />
        </span>
      </div>
    </div>
  );
}

function StudentsRanking() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useLeaderboard(1, STUDENT_WINDOW);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-80 animate-pulse rounded-3xl bg-muted" />
        <div className="h-80 animate-pulse rounded-[20px] bg-muted" />
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const items: RankedUser[] = data?.items ?? [];
  if (items.length === 0) return <EmptyState icon={Trophy} title="Hali reyting mavjud emas" />;

  const rankOf = (entry: RankedUser, idx: number) => entry.rank ?? idx + 1;
  const hasPodium = items.length >= 3;
  const rest = hasPodium ? items.slice(3) : items;

  // O'quvchining o'rni: ro'yxatda bo'lsa o'sha yerdan, aks holda backend "me"
  const myIndex = items.findIndex((entry) => entry._id === user?._id);
  const myRank = myIndex >= 0 ? rankOf(items[myIndex], myIndex) : data?.me?.rank;
  const myDiamonds =
    myIndex >= 0 ? (items[myIndex].diamonds ?? 0) : (data?.me?.diamonds ?? user?.diamonds ?? 0);
  const above =
    myRank && myRank > 1 ? items.find((e, i) => rankOf(e, i) === myRank - 1) : undefined;
  const showStanding = user?.role === 'student' && !!myRank;

  return (
    <div className="flex flex-col gap-5">
      {hasPodium && <Podium entries={items.slice(0, 3)} />}
      {showStanding && user && myRank && (
        <MyStanding user={user} rank={myRank} diamonds={myDiamonds} above={above} />
      )}
      {rest.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="font-heading text-base font-bold">Barcha ishtirokchilar</h2>
            {data?.total ? (
              <span className="text-sm text-muted-foreground">{formatNumber(data.total)} ta</span>
            ) : null}
          </div>
          {rest.map((entry, idx) => (
            <StudentRow
              key={entry._id}
              rank={String(rankOf(entry, idx + (hasPodium ? 3 : 0)))}
              entry={entry}
              isMe={entry._id === user?._id}
              index={idx}
            />
          ))}
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
        <section className="lb-fade-up relative flex flex-wrap items-center gap-5 overflow-hidden rounded-[20px] bg-linear-to-br from-primary to-[oklch(0.36_0.2_268)] px-6 py-5 text-primary-foreground">
          <span
            aria-hidden
            className="animate-pulse-slow absolute -top-16 -right-10 size-48 rounded-full bg-gold/30 blur-3xl"
          />
          <span className="relative font-heading text-[44px] leading-none font-bold">
            {me.rank}
          </span>
          <div className="relative min-w-0 flex-[1_1_220px]">
            <p className="text-lg font-bold">Siz · {user?.name}</p>
            <p className="text-sm text-primary-foreground/75">
              Faollik balingiz: {formatNumber(me.activityScore)}
            </p>
          </div>
          {meDetails && (
            <div className="relative flex gap-6">
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
            {data.items.map((teacher, idx) => (
              <TeacherRow
                key={teacher._id}
                teacher={teacher}
                isMe={teacher._id === user?._id}
                index={idx}
              />
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

function TeacherRow({
  teacher,
  isMe,
  index,
}: {
  teacher: TeacherRanking;
  isMe: boolean;
  index: number;
}) {
  return (
    <div
      className={cn(
        'lb-fade-up group flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-muted px-4 py-3.5 transition-colors last:border-0 hover:bg-muted/50 sm:px-5',
        isMe && 'bg-primary-soft shadow-[inset_3px_0_0_var(--primary)]'
      )}
      style={delay(index * 50)}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-[10px] font-heading text-sm font-bold',
          teacher.rank === 1
            ? 'lb-shine bg-gold text-admin'
            : teacher.rank <= 3
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
        )}
      >
        {teacher.rank}
      </span>
      <Avatar className="transition-transform duration-300 group-hover:scale-110">
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
      {/* key: tab almashganda animatsiyalar qaytadan o'ynaydi */}
      <div key={activeTab}>
        {activeTab === 'students' ? <StudentsRanking /> : <TeachersRanking />}
      </div>
    </div>
  );
}
