'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollText, Search, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function CertificateVerifyTeaser() {
  const router = useRouter();
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      router.push('/certificates/verify');
      return;
    }
    router.push(`/certificates/verify/${encodeURIComponent(value.trim())}`);
  }

  return (
    <div className="border-b border-border/60 py-20">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-border/70 bg-linear-to-b from-muted/40 to-transparent p-8 text-center sm:p-12">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ScrollText className="size-7" />
          </span>
          <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Har bir sertifikat tasdiqlanadi
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Kursni yakunlagan har bir o&apos;quvchiga avtomatik sertifikat beriladi.
            Ishonchliligini istalgan vaqtda tekshirib ko&apos;ring.
          </p>
          <form onSubmit={handleSubmit} className="mt-7 flex w-full max-w-sm gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Sertifikat raqamini kiriting"
              className="h-11"
            />
            <Button type="submit" size="lg" className="h-11 shrink-0">
              <Search className="size-4" />
              Tekshirish
            </Button>
          </form>
          <span className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" />
            Har bir natija ma&apos;lumotlar bazasidan tasdiqlanadi
          </span>
        </div>
      </Container>
    </div>
  );
}
