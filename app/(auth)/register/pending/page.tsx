import Link from 'next/link';
import { Hourglass } from 'lucide-react';
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
      <Button size="lg" className="w-full" render={<Link href="/login" />}>
        Kirish sahifasiga qaytish
      </Button>
    </div>
  );
}
