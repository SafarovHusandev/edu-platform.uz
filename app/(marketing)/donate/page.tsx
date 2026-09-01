'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Heart, Loader2, ShieldCheck, Sparkles, Users, ArrowRight } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useCreatePayment } from '@/hooks/use-payment';
import { formatNumber, toTiyin } from '@/lib/format';

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
      {/* Hero Header */}
      <div className="border-b border-border/80 bg-linear-to-b from-rose-500/10 via-primary/5 to-transparent py-14">
        <Container className="flex flex-col items-center gap-4 text-center max-w-3xl">
          <div className="inline-flex size-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-500 shadow-lg shadow-rose-500/20 animate-bounce">
            <Heart className="size-8 fill-current" />
          </div>
          <h1 className="text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Platformamizni qo&apos;llab-quvvatlang
          </h1>
          <p className="max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            edu-platform.uz ko&apos;plab o&apos;quvchi va o&apos;qituvchilar uchun sifatli
            ta&apos;limni imkon qadar arzon va ochiq qilishga intiladi. Sizning homiyligingiz buni
            yanada rivojlantirishga yordam beradi.
          </p>
        </Container>
      </div>

      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_380px] max-w-5xl">
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-foreground mb-2">Nima uchun bu muhim?</h2>
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className="flex gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 card-hover-glow"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
                <reason.icon className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{reason.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Donation Form Box */}
        <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-xl border border-border/80 h-fit space-y-6">
          <div className="space-y-1 pb-2 border-b border-border/60">
            <h3 className="text-lg font-extrabold text-foreground">Homiylik miqdori</h3>
            <p className="text-xs text-muted-foreground">
              To&apos;lov tizimi orqali xavfsiz amalga oshiriladi
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={!customAmount && amount === value ? 'default' : 'outline'}
                  className="h-12 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200"
                  onClick={() => {
                    setAmount(value);
                    setCustomAmount('');
                  }}
                >
                  {formatNumber(value)} so&apos;m
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Boshqa miqdor
              </label>
              <Input
                type="number"
                min={1000}
                step={1000}
                placeholder="Ixtiyoriy miqdor (so'm)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="h-12 rounded-xl text-base border-border/80 bg-background/70"
              />
            </div>

            <Button
              className="h-12 w-full rounded-xl bg-linear-to-r from-rose-500 via-rose-600 to-pink-600 font-bold text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:opacity-95 transition-all duration-200 cursor-pointer"
              onClick={handleDonate}
              disabled={createPayment.isPending || !isValid}
            >
              {createPayment.isPending ? (
                <Loader2 className="size-5 animate-spin mr-2" />
              ) : (
                <Heart className="size-5 mr-2 fill-current" />
              )}
              {formatNumber(finalAmount)} so&apos;m qo&apos;llab-quvvatlash
            </Button>
            {!isValid && (
              <p className="text-xs font-medium text-destructive text-center">
                Eng kam miqdor 1 000 so&apos;m
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
