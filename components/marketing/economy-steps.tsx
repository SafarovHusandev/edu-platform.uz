import Image from 'next/image';
import { ArrowRight, CheckCircle2, Gift, RotateCw } from 'lucide-react';
import { Container } from '@/components/layout/container';

const STEPS = [
  {
    icon: CheckCircle2,
    title: 'Darsni tugating',
    description: "Kursdagi darsni yakunlang yoki testdan o'ting — natijangizga qarab baholanadi.",
  },
  {
    icon: 'diamond' as const,
    title: 'Olmos ishlab toping',
    description:
      "Har bir tugallangan dars va test uchun avtomatik olmos hisobingizga qo'shiladi.",
  },
  {
    icon: RotateCw,
    title: 'Kunlik barabonni aylantiring',
    description: "Bundan tashqari, har kuni bepul aylantirib qo'shimcha olmos yutib oling.",
  },
  {
    icon: Gift,
    title: "Sovg'aga almashtiring",
    description: "To'plagan olmoslaringizni mukofotlar do'konidagi haqiqiy sovg'alarga yeching.",
  },
];

export function EconomySteps() {
  return (
    <div className="border-b border-border/60 bg-linear-to-b from-gold/8 via-gold/3 to-transparent py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-widest text-gold-foreground uppercase">
            Olmos iqtisodiyoti
          </p>
          <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            O&apos;rganish — bu shunchaki baho emas, o&apos;yin
          </h2>
          <p className="mt-3 text-muted-foreground">
            Har bir harakatingiz mukofotlanadi. Mana qanday ishlaydi:
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 md:grid-cols-4">
          {STEPS.map((step, idx) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              {idx < STEPS.length - 1 && (
                <ArrowRight className="absolute top-7 -right-3 hidden size-5 text-gold/40 md:-right-5 md:block" />
              )}
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-gold-foreground shadow-sm ring-1 ring-gold/20">
                <span className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground shadow-sm">
                  {idx + 1}
                </span>
                {step.icon === 'diamond' ? (
                  <Image src="/diamond.png" alt="" width={40} height={40} className="size-6" />
                ) : (
                  <step.icon className="size-6" />
                )}
              </span>
              <h3 className="mt-4 font-heading text-base font-semibold">{step.title}</h3>
              <p className="mt-1.5 max-w-52 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
