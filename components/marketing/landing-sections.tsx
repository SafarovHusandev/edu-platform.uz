import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, Clock, Flame, Gift, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { CourseCard } from '@/components/courses/course-card';
import { BookCard } from '@/components/books/book-card';
import { CertificateVerifyForm } from '@/components/certificates/certificate-verify-form';
import { TELEGRAM_BOT_USERNAME, TELEGRAM_CHANNEL_URL, resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Book, Course, Reward } from '@/types';

// Bosh sahifa bo'limlari (edu-platform-dizayn: Main)

function SectionShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`mx-auto max-w-300 px-4 sm:px-6 ${className ?? ''}`}>{children}</section>
  );
}

function SectionHeading({
  title,
  subtitle,
  link,
}: {
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-heading text-2xl font-semibold sm:text-[28px]">{title}</h2>
        {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
      </div>
      {link && (
        <Link href={link.href} className="text-[15px] font-semibold text-primary hover:underline">
          {link.label} →
        </Link>
      )}
    </div>
  );
}

export function LandingHero() {
  return (
    <SectionShell className="flex flex-wrap items-center gap-10 pt-12 pb-12 sm:pt-[72px] sm:pb-14 lg:gap-14">
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
        <span className="self-start rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">
          1–11-sinf o&apos;quvchilari uchun
        </span>
        <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight sm:text-[52px]">
          O&apos;qing, test yeching, olmos to&apos;plang — mukofot oling
        </h1>
        <p className="max-w-[520px] text-lg leading-relaxed text-muted-foreground sm:text-[19px]">
          Kurslar, bepul kitoblar va sinfingizga moslangan testlar bir joyda. Har bir muvaffaqiyat
          olmos keltiradi, olmoslar esa haqiqiy mukofotlarga almashtiriladi.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="h-[52px] px-6 text-base" render={<Link href="/register" />}>
            Bepul boshlash
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-[52px] px-6 text-base"
            render={
              <a href={`https://t.me/${TELEGRAM_BOT_USERNAME}`} target="_blank" rel="noreferrer" />
            }
          >
            <Send className="size-4.5 text-[#229ED9]" /> Telegram orqali kirish
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Ro&apos;yxatdan o&apos;tgach, hisobingizni administrator tasdiqlaydi.
        </p>
      </div>

      {/* Dekorativ demo: test kartochkasi va hisob ko'rsatkichlari */}
      <div aria-hidden className="flex min-w-0 flex-[1_1_400px] flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Algebra · 8-sinf · 4/20 savol
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-primary-soft px-3 py-1.5 font-heading text-sm font-bold text-primary">
              <Clock className="size-4" /> 14:32
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-1.5 w-1/5 rounded-full bg-primary" />
          </div>
          <p className="text-xl leading-snug font-semibold">
            2x + 6 = 18 tenglamaning ildizi nechaga teng?
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {['A) 4', 'B) 6', 'C) 9', 'D) 12'].map((option, i) => (
              <div
                key={option}
                className={
                  i === 1
                    ? 'rounded-[14px] border-[1.5px] border-primary bg-primary-soft px-4 py-3.5 font-semibold text-primary'
                    : 'rounded-[14px] border-[1.5px] border-border px-4 py-3.5 font-medium'
                }
              >
                {option}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-[20px] bg-primary p-4 text-primary-foreground">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
              <DiamondIcon className="size-6" />
            </span>
            <div>
              <div className="text-[13px] text-primary-foreground/75">Olmos balansi</div>
              <div className="font-heading text-[22px] font-semibold">1 240</div>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-3 rounded-[20px] border border-border bg-card p-4">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gold-soft text-[#B45309]">
              <Flame className="size-6" />
            </span>
            <div>
              <div className="text-[13px] text-muted-foreground">Kunlik seriya</div>
              <div className="font-heading text-[22px] font-semibold">7 kun</div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

// Har bir qadam o'z rangi va ikonkasi bilan: o'qish → test → olmos → mukofot
const STEPS: {
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  // Ikonka foni va rangi
  tone: string;
  // "0N-qadam" yozuvi rangi — ikonka bilan bir xil
  label: string;
}[] = [
  {
    title: "Kurs va kitob o'qing",
    text: "Video va matnli darslar, bepul PDF kitoblar — sinfingiz bo'yicha saralangan.",
    icon: BookOpen,
    tone: 'bg-primary-soft text-primary',
    label: 'text-primary',
  },
  {
    title: 'Test yeching',
    text: "O'qituvchingiz tayyorlagan testlar — vaqt chegarasi va aniq natija bilan.",
    icon: ClipboardCheck,
    tone: 'bg-success-soft text-success',
    label: 'text-success',
  },
  {
    title: "Olmos to'plang",
    text: "Har kuni barabanni aylantiring, testlardan olmos oling, reytingda ko'tariling.",
    icon: DiamondIcon,
    tone: 'bg-primary-soft text-primary',
    label: 'text-primary',
  },
  {
    title: 'Mukofotga almashtiring',
    text: "Katalogdan sovg'a tanlang — admin tasdiqlab, sizga topshiradi.",
    icon: Gift,
    tone: 'bg-gold-soft text-gold-foreground',
    label: 'text-gold-foreground',
  },
];

export function LandingSteps() {
  return (
    <SectionShell className="pt-6 pb-14">
      <SectionHeading title="Qanday ishlaydi" />
      {/* Qadamlar ketma-ketligi: kartochkalar orasida o'q (desktop — o'ngga, telefon — pastga).
          Oxirgi qadam — maqsad (mukofot), oltin rang bilan ajratilgan. */}
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === STEPS.length - 1;
          return (
            <li
              key={step.title}
              className={cn(
                'group relative flex flex-col gap-3 rounded-[20px] border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
                isLast
                  ? 'border-gold/50 bg-gold-soft/40 hover:border-gold'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={cn('font-heading text-base font-semibold', step.label)}>
                  {String(i + 1).padStart(2, '0')}-qadam
                </span>
                <span
                  className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110',
                    step.tone
                  )}
                >
                  <Icon className="size-6" />
                </span>
              </div>
              <h3 className="text-[19px] font-bold">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          );
        })}
      </ol>
    </SectionShell>
  );
}

export function LandingCourses({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return null;
  return (
    <SectionShell className="pt-6 pb-14">
      <SectionHeading
        title="Mashhur kurslar"
        link={{ href: '/courses', label: 'Barcha kurslar' }}
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, i) => (
          <CourseCard key={course._id} course={course} index={i} />
        ))}
      </div>
    </SectionShell>
  );
}

export function LandingBooks({ books }: { books: Book[] }) {
  if (books.length === 0) return null;
  return (
    <SectionShell className="pt-6 pb-14">
      <SectionHeading
        title="Kitoblar kutubxonasi"
        subtitle="Barcha kitoblar bepul — PDF formatda yuklab oling."
        link={{ href: '/books', label: "Kutubxonaga o'tish" }}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {books.map((book, i) => (
          <BookCard key={book._id} book={book} index={i} />
        ))}
      </div>
    </SectionShell>
  );
}

export function LandingRewards({ rewards }: { rewards: Reward[] }) {
  if (rewards.length === 0) return null;
  return (
    <SectionShell className="pt-6 pb-14">
      <div className="flex flex-wrap items-center gap-8 rounded-[28px] bg-primary p-7 text-primary-foreground sm:p-10">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
          <span className="self-start rounded-full bg-gold px-3 py-1.5 text-[13px] font-bold text-admin">
            Mukofotlar katalogi
          </span>
          <h2 className="font-heading text-2xl font-semibold sm:text-[30px]">
            Olmoslaringiz haqiqiy sovg&apos;aga aylanadi
          </h2>
          <p className="text-primary-foreground/80">
            Katalogni kirmasdan ko&apos;rishingiz mumkin. Almashtirish uchun hisobga kiring.
          </p>
          <Link
            href="/rewards"
            className="mt-1.5 self-start rounded-[14px] bg-white px-5 py-3.5 font-semibold text-admin transition-opacity hover:opacity-90"
          >
            Katalogni ko&apos;rish
          </Link>
        </div>
        <div className="grid min-w-0 flex-[1_1_420px] grid-cols-3 gap-3">
          {rewards.slice(0, 3).map((reward) => {
            const image = resolveAssetUrl(reward.image);
            return (
              <div
                key={reward._id}
                className="flex flex-col gap-2.5 rounded-[18px] bg-white/12 p-3 sm:p-4"
              >
                <div className="aspect-square overflow-hidden rounded-xl bg-white/15">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="line-clamp-2 text-sm font-semibold">{reward.title}</div>
                <div className="flex items-center gap-1 font-heading text-sm text-gold">
                  <DiamondIcon className="size-3.5" /> {formatNumber(reward.cost)}
                  {reward.premiumOnly && (
                    <span className="font-sans text-primary-foreground/70"> · Premium</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

export function LandingTelegramChannel() {
  return (
    <SectionShell className="pt-6 pb-14">
      <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-[#229ED9]/30 bg-[#229ED9]/8 p-6 sm:p-8">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#229ED9] text-white">
          <Send className="size-7" />
        </span>
        <div className="min-w-0 flex-[1_1_280px]">
          <h2 className="font-heading text-2xl font-semibold">Rasmiy Telegram kanalimiz</h2>
          <p className="mt-1.5 text-muted-foreground">
            Yangi kurslar, testlar, jonli o&apos;yinlar va mukofotlar haqidagi e&apos;lonlarni
            birinchi bo&apos;lib biling.
          </p>
        </div>
        <Button
          size="lg"
          className="h-[52px] bg-[#229ED9] px-6 text-base text-white hover:bg-[#229ED9]/90"
          render={<a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noreferrer" />}
        >
          <Send className="size-4.5" /> Kanalga obuna bo&apos;lish
        </Button>
      </div>
    </SectionShell>
  );
}

export function LandingVerify() {
  return (
    <SectionShell className="pt-6 pb-16">
      <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="min-w-0 flex-[1_1_280px]">
          <h2 className="font-heading text-2xl font-semibold">Sertifikatni tekshirish</h2>
          <p className="mt-1.5 text-muted-foreground">
            Sertifikat raqamini kiriting — haqiqiyligini darhol tasdiqlaymiz.
          </p>
        </div>
        <CertificateVerifyForm className="min-w-0 flex-[1_1_420px]" />
      </div>
    </SectionShell>
  );
}
