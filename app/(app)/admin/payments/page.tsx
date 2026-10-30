'use client';

import { PageHeader } from '@/components/ui/page-header';
import { PaymentsHistory } from '@/components/payments/payments-history';

export default function AdminPaymentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title="To'lovlar" description="Platformadagi barcha to'lovlar" />
      <PaymentsHistory scope="all" />
    </div>
  );
}
