'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Heart, Loader2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useCreatePayment } from '@/hooks/use-payment';
import { formatNumber, toTiyin } from '@/lib/format';
import { cn } from '@/lib/utils';

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

const REASONS = [
  {
    icon: Users,
    title: 'Kurslarni arzon va ochiq saqlaymiz',
    description: "Homiyligingiz yordamida ko'plab kurslar bepul yoki juda qulay narxda qolaveradi.",
  },
  {
    icon: Sparkles,
    title: 'Yangi imkoniyatlar yaratamiz',
    description:
      "Yig'ilgan mablag' platformaning yangi interaktiv funksiyalari va ta'lim sifatini oshirishga sarflanadi.",
  },
  {
    icon: ShieldCheck,
    title: "O'qituvchilarni qo'llab-quvvatlaymiz",
    description:
      "Sifatli ta'lim kontenti yaratayotgan eng faol o'qituvchilarga rag'bat va mukofot sifatida ishlatiladi.",
  },
];

export default function DonatePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createPayment = useCreatePayment();
  const [amount, setAmount] = useState(25000);
  const [customAmount, setCustomAmount] = useState('');

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const isValid = finalAmount >= 1000;

  function handleDonate() {
    if (!user) {
      toast.info("Platformamizga homiylik qilish uchun avval tizimga kirishingiz kerak bo'ladi");
      router.push('/login?redirect=/donate');
      return;
    }
    if (!isValid) return;

    createPayment.mutate(
      {
        purpose: 'donation',
        amount: toTiyin(finalAmount),
        returnUrl: `${window.location.origin}/donate`,
      },
      {
        onSuccess: (invoice) => {
          if (invoice.checkoutUrl) {
            window.location.href = invoice.checkoutUrl;
          } else {
            router.push(`/payment/${invoice.invoiceId}`);
          }
        },
      }
    );
  }

  return (
    <div className="pb-16">
      <section className="bg-primary text-primary-foreground">
        <Container className="flex max-w-300 flex-col gap-4 py-12 sm:py-16">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
            <Heart className="size-7 fill-current" />
          </span>
          <h1 className="max-w-2xl font-heading text-3xl font-bold text-balance sm:text-[44px] sm:leading-tight">
            Platformamizni qo&apos;llab-quvvatlang
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/80">
            edu-platform.uz sifatli ta&apos;limni imkon qadar arzon va ochiq qilishga intiladi.
            Homiyligingiz buni yanada rivojlantirishga yordam beradi.
          </p>
        </Container>
      </section>

      <Container className="grid max-w-300 gap-6 py-10 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-bold">Nima uchun bu muhim?</h2>
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className="flex gap-4 rounded-[18px] border border-border bg-card p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <reason.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{reason.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-secondary-foreground">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex h-fit flex-col gap-5 rounded-[20px] border border-border bg-card p-6 lg:sticky lg:top-24">
          <div>
            <h3 className="font-heading text-lg font-bold">Homiylik miqdori</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              To&apos;lov Multicard orqali xavfsiz amalga oshiriladi
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_AMOUNTS.map((value) => {
              const selected = !customAmount && amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setAmount(value);
                    setCustomAmount('');
                  }}
                  className={cn(
                    'h-12 rounded-[14px] border-[1.5px] font-semibold transition-colors',
                    selected
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border bg-card hover:bg-muted'
                  )}
                >
                  {formatNumber(value)} so&apos;m
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="donate-amount" className="text-sm font-medium">
              Boshqa miqdor
            </label>
            <Input
              id="donate-amount"
              type="number"
              min={1000}
              step={1000}
              placeholder="Ixtiyoriy miqdor (so'm)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            {!isValid && <p className="text-sm text-destructive">Eng kam miqdor 1 000 so&apos;m</p>}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleDonate}
            disabled={createPayment.isPending || !isValid}
          >
            {createPayment.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Heart className="size-4 fill-current" />
            )}
            {formatNumber(finalAmount)} so&apos;m yuborish
          </Button>
        </div>
      </Container>
    </div>
  );
}
