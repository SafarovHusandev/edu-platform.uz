import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/layout/status-page';

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Bu sahifa topilmadi"
      description="Havola eskirgan yoki sahifa o'chirilgan bo'lishi mumkin. Bosh sahifaga qayting yoki kurslardan qidiring."
      actions={
        <>
          <Button size="lg" render={<Link href="/" />}>
            Bosh sahifa
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/courses" />}>
            Kurslar
          </Button>
        </>
      }
    />
  );
}
