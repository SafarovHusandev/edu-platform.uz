import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh flex flex-col justify-between overflow-hidden bg-background bg-grid-pattern">
      {/* Decorative ambient gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-linear-to-tr from-primary/20 via-primary/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 -z-10 h-[400px] w-[400px] rounded-full bg-linear-to-r from-gold/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -right-40 -z-10 h-[450px] w-[450px] rounded-full bg-linear-to-l from-primary/15 to-transparent blur-3xl" />

      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3.5">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-full px-3 py-1.5 hover:bg-muted"
            >
              <ArrowLeft className="size-4" />
              <span>Bosh sahifa</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12 z-10">
        {children}
      </main>

      {/* Footer minimal info */}
      <footer className="w-full border-t border-border/40 bg-background/40 py-4 text-center text-xs text-muted-foreground backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1">
            <Sparkles className="size-3 text-primary" /> Edu Platform — Zamonaviy bilimlar makoni
          </p>
          <p>© {new Date().getFullYear()} Barcha huquqlar himoyalangan</p>
        </div>
      </footer>
    </div>
  );
}

