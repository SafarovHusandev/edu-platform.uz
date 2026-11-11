import Link from 'next/link';
import { cn } from '@/lib/utils';

const DEFAULT_LABEL = 'Edu Platform';

// Brend logotipi (sidebar, header, mobil sarlavha).
// Yorug' fonda logo.png, qorong'i fonda logo-white.png ko'rsatiladi.
// Admin sidebar har doim qorong'i bo'lgani uchun u yerda faqat oq logo.
export function BrandMark({
  label = DEFAULT_LABEL,
  href = '/',
  variant = 'default',
  className,
}: {
  label?: string;
  href?: string;
  variant?: 'default' | 'admin';
  className?: string;
}) {
  const showRole = label !== DEFAULT_LABEL;

  return (
    <Link href={href} aria-label={`${DEFAULT_LABEL} — bosh sahifa`} className={cn('flex items-center gap-2.5', className)}>
      {variant === 'admin' ? (
        <img src="/logo-white.png" alt={DEFAULT_LABEL} className="h-9 w-auto shrink-0" />
      ) : (
        <>
          <img src="/logo.png" alt={DEFAULT_LABEL} className="block h-9 w-auto shrink-0 dark:hidden" />
          <img src="/logo-white.png" alt={DEFAULT_LABEL} className="hidden h-9 w-auto shrink-0 dark:block" />
        </>
      )}
      {showRole && (
        <span
          className={cn(
            'truncate rounded-full px-2 py-0.5 text-xs font-semibold',
            variant === 'admin' ? 'bg-gold text-admin' : 'bg-primary-soft text-primary'
          )}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
