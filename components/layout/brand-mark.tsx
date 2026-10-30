import Link from 'next/link';
import { cn } from '@/lib/utils';

// Dizayndagi "E" belgisi + nom (sidebar, header, mobil sarlavha)
export function BrandMark({
  label = 'Edu Platform',
  href = '/',
  variant = 'default',
  className,
}: {
  label?: string;
  href?: string;
  variant?: 'default' | 'admin';
  className?: string;
}) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-[10px] font-heading font-bold',
          variant === 'admin' ? 'bg-gold text-admin' : 'bg-primary text-primary-foreground'
        )}
      >
        E
      </span>
      <span className="truncate font-heading font-semibold">{label}</span>
    </Link>
  );
}
