'use client';

import { CreditCard, Loader2, RefreshCw, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatPrice, planKeyToLabel } from '@/lib/format';
import { getPaymentStatusConfig, PAYMENT_PURPOSE_ICONS, PAYMENT_PURPOSE_LABELS } from '@/lib/payment-status';
import { cn } from '@/lib/utils';
import type { PaymentRecord } from '@/types';

interface PaymentRowProps {
  payment: PaymentRecord;
  showUser?: boolean;
  onCheckStatus?: (invoiceId: string) => void;
  checking?: boolean;
}

export function PaymentRow({ payment, showUser, onCheckStatus, checking }: PaymentRowProps) {
  const PurposeIcon = PAYMENT_PURPOSE_ICONS[payment.purpose];
  const statusConfig = getPaymentStatusConfig(payment.status);
  const StatusIcon = statusConfig.icon;
  const needsCheck = payment.status !== 'success';

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex flex-wrap items-center gap-4 pt-2">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <PurposeIcon className="size-5" />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{PAYMENT_PURPOSE_LABELS[payment.purpose]}</p>
            {payment.plan && (
              <Badge variant="outline" className="rounded-full text-xs">
                {planKeyToLabel(payment.plan)}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{formatDateTime(payment.createdAt)}</span>
            {payment.cardPan && (
              <span className="flex items-center gap-1">
                <CreditCard className="size-3.5" /> {payment.cardPan}
              </span>
            )}
            {showUser && payment.user && (
              <span className="flex items-center gap-1">
                <User className="size-3.5" /> {payment.user.name} · {payment.user.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-base font-semibold">{formatPrice(payment.amount)}</span>
          <Badge className={cn('rounded-full text-xs', statusConfig.className)}>
            <StatusIcon className="size-3.5" /> {statusConfig.label}
          </Badge>
        </div>

        {needsCheck && onCheckStatus && (
          <Button
            variant="outline"
            size="sm"
            className="w-full shrink-0 rounded-md sm:w-fit"
            onClick={() => onCheckStatus(payment.invoiceId)}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Holatni tekshirish
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
