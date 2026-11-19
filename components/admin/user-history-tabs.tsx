'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentsHistory } from '@/components/payments/payments-history';
import {
  ActivityPanel,
  AttemptsPanel,
  CertificatesPanel,
  DiamondsPanel,
  EnrollmentsPanel,
  RedemptionsPanel,
  SpinPanel,
} from '@/components/admin/user-history-panels';
import type { User } from '@/types';

type TabKey =
  | 'overview'
  | 'attempts'
  | 'diamonds'
  | 'courses'
  | 'certificates'
  | 'spin'
  | 'rewards'
  | 'payments'
  | 'activity';

const TABS: { key: TabKey; label: string; studentOnly?: boolean }[] = [
  { key: 'overview', label: 'Umumiy' },
  { key: 'attempts', label: 'Testlar', studentOnly: true },
  { key: 'diamonds', label: 'Olmoslar', studentOnly: true },
  { key: 'courses', label: 'Kurslar', studentOnly: true },
  { key: 'certificates', label: 'Sertifikatlar', studentOnly: true },
  { key: 'spin', label: 'Kunlik spin', studentOnly: true },
  { key: 'rewards', label: "Sovg'alar", studentOnly: true },
  { key: 'payments', label: "To'lovlar" },
  { key: 'activity', label: 'Faollik' },
];

// Tanlangan tab URL'da (?tab=...) saqlanadi: yangilanganda yoki havola ulashilganda
// shu tab ochiladi. Tab ochilgandagina uning so'rovi yuboriladi (panel faqat faol
// bo'lganda render qilinadi).
export function UserHistoryTabs({ user, overview }: { user: User; overview: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs = TABS.filter((t) => !t.studentOnly || user.role === 'student');
  const requested = searchParams.get('tab');
  const active: TabKey = tabs.find((t) => t.key === requested)?.key ?? 'overview';

  function selectTab(key: TabKey) {
    const next = new URLSearchParams(searchParams.toString());
    if (key === 'overview') next.delete('tab');
    else next.set('tab', key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function panel(key: TabKey) {
    switch (key) {
      case 'overview':
        return overview;
      case 'attempts':
        return <AttemptsPanel userId={user._id} />;
      case 'diamonds':
        return <DiamondsPanel userId={user._id} balance={user.diamonds ?? 0} />;
      case 'courses':
        return <EnrollmentsPanel userId={user._id} />;
      case 'certificates':
        return <CertificatesPanel userId={user._id} />;
      case 'spin':
        return <SpinPanel userId={user._id} />;
      case 'rewards':
        return <RedemptionsPanel user={user} />;
      case 'payments':
        return <PaymentsHistory scope="all" fixedUserId={user._id} />;
      case 'activity':
        return <ActivityPanel userId={user._id} />;
    }
  }

  return (
    <Tabs value={active} onValueChange={(value) => selectTab(value as TabKey)} className="gap-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList variant="line" className="h-auto! w-max gap-0.5 border-b border-border p-0">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="px-3 py-2.5 text-[15px] font-semibold"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value={active}>{panel(active)}</TabsContent>
    </Tabs>
  );
}
