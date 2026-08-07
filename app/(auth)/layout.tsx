import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Bosh sahifaga qaytish
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">{children}</main>
    </div>
  );
}
