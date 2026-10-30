import Link from 'next/link';
import { cn } from '@/lib/utils';

export type AuthTab = 'login' | 'register' | 'telegram';

const TABS: { value: AuthTab; label: string; href: string }[] = [
  { value: 'login', label: 'Kirish', href: '/login' },
  { value: 'register', label: "Ro'yxatdan o'tish", href: '/register' },
  { value: 'telegram', label: 'Telegram', href: '/login?tab=telegram' },
];

// Kirish usuli tablari: har biri alohida yo'lga olib boradi (redirect saqlanadi)
export function AuthTabs({
  active,
  redirect,
  onSelect,
}: {
  active: AuthTab;
  redirect?: string | null;
  // Bir sahifa ichida (login: parol <-> telegram) almashtirish uchun
  onSelect?: (tab: AuthTab) => boolean | void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Kirish usuli"
      className="grid grid-cols-3 gap-1 rounded-[14px] bg-muted p-1"
    >
      {TABS.map((tab) => {
        const selected = tab.value === active;
        let href = tab.href;
        if (redirect)
          href += `${href.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(redirect)}`;
        return (
          <Link
            key={tab.value}
            href={href}
            role="tab"
            aria-selected={selected}
            onClick={(e) => {
              if (onSelect?.(tab.value)) e.preventDefault();
            }}
            className={cn(
              'rounded-[11px] px-2 py-2.5 text-center text-[15px] font-semibold transition-colors',
              selected
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
