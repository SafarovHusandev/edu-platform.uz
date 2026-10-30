import Link from 'next/link';
import { Hourglass, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPendingPage() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-gold-soft text-gold">
        <Hourglass className="size-8" />
      </span>
      <div>
        <h2 className="font-heading text-[26px] font-bold">Tasdiqlash kutilmoqda</h2>
        <p className="mt-2 text-secondary-foreground">
          Ro&apos;yxatdan muvaffaqiyatli o&apos;tdingiz. Administrator hisobingizni tasdiqlagach
          tizimga kira olasiz.
        </p>
      </div>
      <div className="w-full rounded-[18px] border border-border bg-card p-4 text-left text-[15px]">
        <div className="font-semibold">Kutishni xohlamaysizmi?</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Telegram bot orqali kirsangiz, hisob darhol faollashadi.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2.5">
        <Button size="lg" className="w-full" render={<Link href="/login" />}>
          Kirish sahifasiga qaytish
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          render={<Link href="/login?tab=telegram" />}
        >
          <Send className="size-4" /> Telegram orqali kirish
        </Button>
      </div>
    </div>
  );
}
