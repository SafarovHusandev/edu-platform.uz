import type { Metadata, Viewport } from 'next';
import { TgShell } from '@/components/tg/tg-shell';

export const metadata: Metadata = {
  title: 'Mini ilova',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// Telegram Mini App — o'qituvchi va adminlar uchun (bot menyusidagi «Ilova» tugmasi /tg ni ochadi)
export default function TelegramMiniAppLayout({ children }: { children: React.ReactNode }) {
  return <TgShell>{children}</TgShell>;
}
