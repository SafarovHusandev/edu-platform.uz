import Link from 'next/link';
import { TELEGRAM_BOT_USERNAME } from '@/lib/config';

const LINKS = [
  { label: 'Kurslar', href: '/courses' },
  { label: 'Kitoblar', href: '/books' },
  { label: 'Homiylik', href: '/donate' },
  { label: 'Ommaviy oferta', href: '/oferta' },
  { label: 'Maxfiylik siyosati', href: '/maxfiylik-siyosati' },
];

// Ochiq sahifalar footeri (edu-platform-dizayn: Main)
export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-300 flex-col gap-4 px-4 py-7 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <span>
          © {new Date().getFullYear()} Edu Platform UZ · Barcha vaqtlar Toshkent vaqti bo&apos;yicha
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
          <a
            href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Telegram bot
          </a>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
