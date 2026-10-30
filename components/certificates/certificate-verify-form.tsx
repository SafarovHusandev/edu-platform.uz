'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Sertifikat raqami bo'yicha tekshirish (bosh sahifa va /certificates/verify)
export function CertificateVerifyForm({
  defaultValue = '',
  className,
}: {
  defaultValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const number = value.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (number) router.push(`/certificates/verify/${encodeURIComponent(number)}`);
      }}
      className={cn('flex flex-col gap-2', className)}
    >
      <label htmlFor="cert-number" className="text-sm font-semibold">
        Sertifikat raqami
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Input
          id="cert-number"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="Masalan: EDU-2026-000123"
          className="h-[52px] flex-1 font-heading text-base"
          autoComplete="off"
        />
        <Button type="submit" size="lg" className="h-[52px] px-6 text-base" disabled={!number}>
          Tekshirish
        </Button>
      </div>
    </form>
  );
}
