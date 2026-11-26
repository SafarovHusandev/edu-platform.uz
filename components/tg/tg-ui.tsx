'use client';

// Telegram Mini App (o'qituvchi/admin) uchun kichik UI bloklari.
// Dizayn: edu-platform-dizayn/TgTm*.html — 390px ekran, 20px chekka, 16-18px radius.

import Link from 'next/link';
import { ChevronRight, Inbox, Loader2, RotateCw } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/config';
import { initials } from '@/lib/format';
import { haptic } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';

export function TgPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-3.5 px-5 pt-5 pb-6', className)}>{children}</div>;
}

// Dizaynda ikki xil sarlavha: tab ildizlarida — Unbounded 22px ("Testlarim"),
// ichki sahifalarda — Onest 17-18px qalin, ustida kichik izoh ("Natijalar").
export function TgHeader({
  title,
  eyebrow,
  action,
  variant = eyebrow ? 'inner' : 'root',
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'root' | 'inner';
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="truncate text-[13px] text-muted-foreground">{eyebrow}</div>}
        <h1
          className={cn(
            'leading-tight wrap-break-word',
            variant === 'root'
              ? 'font-heading text-[22px] font-semibold'
              : cn('font-bold', eyebrow ? 'text-[17px]' : 'text-lg')
          )}
        >
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

// Sarlavha yonidagi "+ Test", "+ Kurs" tugmasi
export const tgHeaderActionClass =
  'inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-bold text-primary-foreground active:opacity-90';

export function TgSectionTitle({
  children,
  href,
  linkLabel = 'Barchasi',
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mt-1 flex items-center justify-between">
      <h2 className="text-base font-bold">{children}</h2>
      {href && (
        <Link href={href} className="text-sm font-semibold text-primary">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function TgCard({
  children,
  className,
  href,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const base = cn(
    'flex flex-col gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-3 text-card-foreground',
    (href || onClick) && 'transition-colors active:bg-muted',
    className
  );
  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, 'w-full text-left')}>
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

export type TgTone = 'success' | 'warning' | 'danger' | 'primary' | 'neutral';

const TONES: Record<TgTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-gold-soft text-gold-foreground',
  danger: 'bg-destructive-soft text-destructive',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-muted text-muted-foreground',
};

export function TgPill({
  tone,
  children,
  className,
}: {
  tone: TgTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function TgStatGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        'grid gap-2',
        cols === 2 && 'grid-cols-2',
        cols === 3 && 'grid-cols-3',
        cols === 4 && 'grid-cols-4'
      )}
    >
      {children}
    </div>
  );
}

export function TgStat({
  label,
  value,
  hint,
  hintTone,
  accent,
  loading,
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  hintTone?: 'success' | 'danger';
  accent?: boolean;
  loading?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <div
        className={cn('truncate text-[11px]', accent ? 'text-primary-foreground/80' : 'text-muted-foreground')}
      >
        {label}
      </div>
      {loading ? (
        <div
          className={cn(
            'mt-1.5 h-6 w-10 animate-pulse rounded-md',
            accent ? 'bg-primary-foreground/25' : 'bg-muted'
          )}
        />
      ) : (
        <div className="mt-1 truncate font-heading text-xl font-bold tabular-nums">{value}</div>
      )}
      {hint && (
        <div
          className={cn(
            'truncate text-[11px]',
            accent
              ? 'text-primary-foreground/80'
              : hintTone === 'success'
                ? 'text-success'
                : hintTone === 'danger'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
          )}
        >
          {hint}
        </div>
      )}
    </>
  );
  const className = cn(
    'block min-w-0 rounded-2xl p-3 transition-opacity',
    href && 'active:opacity-80',
    accent ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

// Dizayndagi sariq "Tekshirish kerak" va ko'k "Sizga test ulashildi" bannerlari
export function TgCallout({
  href,
  badge,
  title,
  description,
  tone = 'warning',
}: {
  href: string;
  badge: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  tone?: 'warning' | 'primary';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-[18px] px-4 py-3.5 text-foreground active:opacity-90',
        tone === 'warning' ? 'bg-gold-soft' : 'border border-primary/30 bg-card'
      )}
    >
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl font-heading font-bold',
          // Oltin fonda doim to'q matn: light'da foreground, dark'da background to'q
          tone === 'warning'
            ? 'bg-gold text-foreground dark:text-background'
            : 'bg-primary-soft text-primary'
        )}
      >
        {badge}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        {description && (
          <span
            className={cn(
              'block truncate text-[13px]',
              tone === 'warning' ? 'text-gold-foreground' : 'text-muted-foreground'
            )}
          >
            {description}
          </span>
        )}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function TgLinkRow({
  href,
  children,
  trailing,
}: {
  href: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border-t border-border px-4 py-3.5 font-semibold first:border-t-0 active:bg-muted"
    >
      <span className="min-w-0 truncate">{children}</span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground">
        {trailing}
        <ChevronRight className="size-4" />
      </span>
    </Link>
  );
}

export function TgAvatar({
  name,
  src,
  size = 44,
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const url = resolveAssetUrl(src);
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-bold text-primary',
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

// Filtr tugmalari (dizayndagi "Barchasi / 8-A / 8-B / Tekshirish kerak")
export function TgChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none]">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (!active) haptic('selection');
              onChange(option.value);
            }}
            className={cn(
              'shrink-0 rounded-full px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'border border-input bg-card text-foreground active:bg-muted'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Ikki bo'limli tablist ("Menga · 1 / Men ulashganlar")
export function TgSegment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div role="tablist" className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) haptic('selection');
              onChange(option.value);
            }}
            className={cn(
              'truncate rounded-[9px] px-1 py-2.5 font-semibold transition-colors',
              options.length > 2 ? 'text-[13px]' : 'text-sm',
              active ? 'bg-card text-foreground shadow-sm' : 'text-secondary-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function TgSkeletonList({ count = 4, height = 72 }: { count?: number; height?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-muted" style={{ height }} />
      ))}
    </div>
  );
}

export function TgEmpty({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div className="font-bold">{title}</div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function TgError({
  onRetry,
  title = "Ma'lumotni yuklab bo'lmadi",
}: {
  onRetry: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive-soft px-6 py-8 text-center"
    >
      <div className="font-bold text-destructive">{title}</div>
      <p className="-mt-1 text-[13px] text-secondary-foreground">
        Internet aloqasini tekshirib, qayta urinib ko&apos;ring.
      </p>
      <button
        type="button"
        onClick={() => {
          haptic('light');
          onRetry();
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold active:bg-muted"
      >
        <RotateCw className="size-4" /> Qayta urinish
      </button>
    </div>
  );
}

// Sahifalab yuklash tugmasi — ro'yxat oxirida
export function TgLoadMore({
  onClick,
  loading,
  shown,
  total,
}: {
  onClick: () => void;
  loading?: boolean;
  shown?: number;
  total?: number;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        haptic('light');
        onClick();
      }}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold active:bg-muted disabled:opacity-60"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      Yana yuklash
      {shown != null && total != null && (
        <span className="font-medium text-muted-foreground tabular-nums">
          {shown} / {total}
        </span>
      )}
    </button>
  );
}

// Test yaratish bosqichlari (TgTmBuilder): o'tilgan — yashil, joriy — ko'k
export function TgSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Bosqichlar" className="grid grid-cols-3 gap-1.5">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'current' : 'todo';
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex min-w-0 flex-col gap-1.5"
          >
            <span
              className={cn(
                'h-1.25 rounded-full',
                state === 'done' ? 'bg-success' : state === 'current' ? 'bg-primary' : 'bg-border'
              )}
            />
            <span
              className={cn(
                'truncate text-xs',
                state === 'done' && 'font-semibold text-success',
                state === 'current' && 'font-bold text-primary',
                state === 'todo' && 'font-semibold text-muted-foreground'
              )}
            >
              {n}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export const QUIZ_BUILDER_STEPS = ['Asosiy', 'Sinflar', 'Savollar'];

// Dizayndagi "Muqova va narxni kengroq tahrirlash uchun web versiyadan..." izohi
export function TgWebHint({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <p className="px-2 text-center text-[13px] leading-relaxed text-muted-foreground">
      {children}
      {href && (
        <>
          {' '}
          <Link href={href} className="font-semibold text-primary">
            Web versiyada ochish
          </Link>
        </>
      )}
    </p>
  );
}

export function gradeLabel(grade?: { number: number | null; letter: string | null } | null) {
  if (!grade?.number) return null;
  return `${grade.number}-${grade.letter ?? ''}`.replace(/-$/, '-sinf');
}
