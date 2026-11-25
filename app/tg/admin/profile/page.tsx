'use client';

import { TgProfile } from '@/components/tg/tg-profile';
import { useAdminStats } from '@/hooks/use-stats';

export default function TgAdminProfilePage() {
  const stats = useAdminStats();
  const pendingUsers = stats.data?.pendingUsers ?? 0;
  const pendingRequests = stats.data?.pendingRedemptions ?? 0;

  return (
    <TgProfile
      links={[
        {
          href: '/tg/admin/users?tab=pending',
          label: 'Tasdiqlash navbati',
          trailing: pendingUsers > 0 ? `${pendingUsers} ta` : undefined,
        },
        {
          href: '/tg/admin/requests',
          label: "Mukofot so'rovlari",
          trailing: pendingRequests > 0 ? `${pendingRequests} ta` : undefined,
        },
        { href: '/admin', label: "To'liq admin panel (web)" },
      ]}
    />
  );
}
