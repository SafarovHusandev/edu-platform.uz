'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2, ShieldCheck, Sparkles, Users } from 'lucide-react';
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
    description: "Homiyligingiz yordamida ko'plab kurslar bepul yoki qulay narxda qolaveradi.",
  },
  {
    icon: Sparkles,
    title: 'Yangi imkoniyatlar yaratamiz',
    description:
      "Yig'ilgan mablag' platformaning yangi funksiyalari va sifatini oshirishga sarflanadi.",
  },
  {
    icon: ShieldCheck,
    title: "O'qituvchilarni qo'llab-quvvatlaymiz",
    description:
      "Sifatli ta'lim kontenti yaratayotgan o'qituvchilarga rag'bat sifatida ishlatiladi.",
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
      <div className="border-b border-border/60 bg-muted/30">
        <Container className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Heart className="size-7 fill-current" />
          </span>
          <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Platformamizni qo&apos;llab-quvvatlang
          </h1>
          <p className="max-w-xl text-muted-foreground">
            edu-platform.uz ko&apos;plab o&apos;quvchi va o&apos;qituvchilar uchun sifatli
            ta&apos;limni imkon qadar arzon va ochiq qilishga intiladi. Sizning homiyligingiz buni
            davom ettirishga yordam beradi.
          </p>
        </Container>
      </div>

      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {REASONS.map((reason) => (
            <div key={reason.title} className="flex gap-4 rounded-xl border border-border p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <reason.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-medium">{reason.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Homiylik miqdorini tanlang</CardTitle>
            <CardDescription>
              To&apos;lov Multicard orqali xavfsiz amalga oshiriladi
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={!customAmount && amount === value ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => {
                    setAmount(value);
                    setCustomAmount('');
                  }}
                >
                  {formatNumber(value)}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              min={1000}
              step={1000}
              placeholder="Boshqa miqdor (so'm)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="text-lg"
            />
            <Button
              size="lg"
              className="h-11"
              onClick={handleDonate}
              disabled={createPayment.isPending || !isValid}
            >
              {createPayment.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Heart className="size-4" />
              )}
              {formatNumber(finalAmount)} so&apos;m homiylik qilish
            </Button>
            {!isValid && <p className="text-xs text-destructive">Eng kam miqdor 1 000 so&apos;m</p>}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
