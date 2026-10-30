'use client';

import { use } from 'react';
import { PaymentStatusView } from '@/components/payments/payment-status-view';
import { useAuthStore } from '@/store/auth-store';
import { ROLE_HOME } from '@/lib/roles';

interface PageProps {
  params: Promise<{ invoiceId: string }>;
}

export default function PaymentStatusPage({ params }: PageProps) {
  const { invoiceId } = use(params);
  const user = useAuthStore((s) => s.user);
  return (
    <PaymentStatusView
      invoiceId={invoiceId}
      homeHref={user ? ROLE_HOME[user.role] : '/'}
      purposeLinks={user?.role === 'student'}
    />
  );
}
