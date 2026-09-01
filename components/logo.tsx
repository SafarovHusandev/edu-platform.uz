import Link from 'next/link';

import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center', className)}>
      {/* Light mode logo (qora yozuvli) */}
      <img src="/logo.png" alt="Edu Platform" className="w-25 block dark:hidden" />
      {/* Dark mode logo (oq yozuvli) */}
      <img src="/logo-white.png" alt="Edu Platform" className="w-25 hidden dark:block" />
    </Link>
  );
}

