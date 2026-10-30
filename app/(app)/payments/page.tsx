'use client';

import { PageHeader } from '@/components/ui/page-header';
import { PaymentsHistory } from '@/components/payments/payments-history';

export default function PaymentsHistoryPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="To'lovlar tarixi" description="Barcha to'lovlaringiz shu yerda" />
      <PaymentsHistory />
    </div>
  );
}
