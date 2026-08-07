import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center', className)}>
      <img src="/logo.png" alt="Edu Platform" className="  w-25" />
    </Link>
  );
}
