'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/layout/status-page';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      title="Nimadir noto'g'ri ketdi"
      description="Birozdan so'ng qayta urinib ko'ring. Muammo takrorlansa, bosh sahifaga qayting."
      actions={
        <>
          <Button size="lg" onClick={() => unstable_retry()}>
            Qayta yuklash
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/" />}>
            Bosh sahifa
          </Button>
        </>
      }
    />
  );
}
