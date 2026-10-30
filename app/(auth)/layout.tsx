import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-mark';
import { ThemeToggle } from '@/components/theme-toggle';

// Kirish / ro'yxatdan o'tish (edu-platform-dizayn: Auth)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <aside className="hidden flex-col justify-between gap-10 bg-primary p-12 text-primary-foreground lg:flex lg:w-[44%] lg:max-w-[620px]">
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white font-heading font-bold text-primary">
            E
          </span>
          <span className="font-heading text-lg font-semibold">Edu Platform</span>
        </Link>
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-4xl leading-tight font-bold xl:text-[44px]">
            Har bir dars — yangi olmos
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-primary-foreground/80">
            Kurslar, testlar va mukofotlar. Telegram&apos;ni ulasangiz natija va bildirishnomalar
            botga ham keladi.
          </p>
        </div>
        <ul className="flex flex-col gap-3 text-[15px]">
          <li className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-gold" />
            Telefon orqali ro&apos;yxatdan o&apos;tganlar admin tasdiqini kutadi
          </li>
          <li className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-[#4ADE80]" />
            Telegram bot orqali — darhol faol hisob
          </li>
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-3.5 sm:px-6">
          <BrandMark className="lg:invisible" />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Bosh sahifa
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
