'use client';

import { use } from 'react';
import { PaymentStatusView } from '@/components/payments/payment-status-view';

interface PageProps {
  params: Promise<{ invoiceId: string }>;
}

export default function StudentPaymentStatusPage({ params }: PageProps) {
  const { invoiceId } = use(params);
  return <PaymentStatusView invoiceId={invoiceId} homeHref="/student" />;
}
