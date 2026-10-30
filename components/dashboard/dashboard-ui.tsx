import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dashboard'lardagi umumiy bloklar (edu-platform-dizayn: SdHome / TeacherDash / AdminDash)

export function DashboardGreeting({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-semibold sm:text-[26px]">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  href,
  tone = 'default',
  icon,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  tone?: 'default' | 'primary' | 'attention';
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  const className = cn(
    'flex min-w-0 flex-col rounded-[18px] p-[18px] transition-colors',
    tone === 'primary'
      ? 'bg-primary text-primary-foreground'
      : 'border border-border bg-card text-card-foreground',
    tone === 'attention' && 'border-gold/50 bg-gold-soft',
    href && tone !== 'primary' && 'hover:border-primary/40'
  );
  const content = (
    <>
      <span
        className={cn(
          'text-[13px] font-medium',
          tone === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
      <span className="mt-1.5 flex items-center gap-2 font-heading text-[28px] font-bold leading-tight tabular-nums">
        {icon}
        {loading ? (
          <span
            className={cn(
              'h-8 w-16 animate-pulse rounded-lg',
              tone === 'primary' ? 'bg-primary-foreground/20' : 'bg-muted'
            )}
          />
        ) : (
          value
        )}
        {href && tone === 'attention' && <ArrowRight className="size-5" />}
      </span>
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function StatGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]',
        className
      )}
      {...props}
    />
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  // Sarlavha ostida chiziq bilan ajratilgan, ichki paddingsiz (jadvallar uchun)
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        'min-w-0 overflow-hidden rounded-[20px] border border-border bg-card',
        className
      )}
    >
      {title && (
        <div
          className={cn(
            'flex items-center justify-between gap-3 px-5',
            flush ? 'border-b border-border py-4' : 'pt-[18px]'
          )}
        >
          <h2 className="text-lg font-bold">{title}</h2>
          {action}
        </div>
      )}
      <div className={cn(!flush && 'p-5', !flush && title && 'pt-3', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="shrink-0 text-sm font-semibold text-primary hover:underline">
      {children}
    </Link>
  );
}

const STATUS_PILL_TONES = {
  success: 'bg-success-soft text-success',
  warning: 'bg-gold-soft text-gold-foreground',
  danger: 'bg-destructive-soft text-destructive',
  neutral: 'bg-muted text-secondary-foreground',
  primary: 'bg-primary-soft text-primary',
} as const;

export type StatusPillTone = keyof typeof STATUS_PILL_TONES;

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusPillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
        STATUS_PILL_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// Kurs kartochkasi rasmi bo'lmaganda ishlatiladigan rangli fon (dizayndagi x², H₂O bloklari)
const COVER_TONES = [
  'bg-primary text-primary-foreground',
  'bg-success text-success-foreground',
  'bg-gold text-admin',
  'bg-chart-4 text-white',
] as const;

export function coverTone(index: number) {
  return COVER_TONES[index % COVER_TONES.length];
}
