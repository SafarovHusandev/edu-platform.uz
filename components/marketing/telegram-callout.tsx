import { Bell, CreditCard, Flame, Send, Trophy } from 'lucide-react';
import { Container } from '@/components/layout/container';

const NOTIFICATIONS = [
  { icon: CreditCard, text: "To'lov muvaffaqiyatli o'tdi" },
  { icon: Trophy, text: 'Test natijasi: 92% — tabriklaymiz!' },
  { icon: Flame, text: "7 kunlik seriyangizni yo'qotmang — bugun aylantiring" },
];

export function TelegramCallout() {
  return (
    <div className="border-b border-border/60 py-20">
      <Container>
        <div className="grid items-center gap-10 rounded-3xl border border-border/70 bg-linear-to-br from-sky-500/8 to-transparent p-8 sm:p-10 lg:grid-cols-2 lg:p-14">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-sky-600 uppercase dark:text-sky-400">
              <Send className="size-3.5" /> Telegram integratsiyasi
            </p>
            <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Telegram orqali kiring, hech narsani qo&apos;ldan boy bermang
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Botimiz orqali bir zumda tizimga kiring va to&apos;lov, test natijasi, mukofot
              holati va kunlik seriya haqida onlayn bildirishnoma oling.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/70 bg-background px-4 py-3 shadow-xs">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Send className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">@edu_platform_uz_bot</p>
                <p className="text-xs text-muted-foreground">Telegram orqali ulanish</p>
              </div>
              <span className="shrink-0 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                Ulash
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {NOTIFICATIONS.map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-4 py-3 shadow-sm"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <item.icon className="size-4" />
                </span>
                <p className="text-sm">{item.text}</p>
                <Bell className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
