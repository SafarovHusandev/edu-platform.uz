'use client';

import { TgProfile } from '@/components/tg/tg-profile';
import { useQuizShares } from '@/hooks/use-quizzes';
import { useTopTeachers } from '@/hooks/use-stats';

export default function TgTeacherProfilePage() {
  const shares = useQuizShares('incoming', 'pending');
  const top = useTopTeachers(1, 1);
  const newShares = shares.data?.length ?? 0;
  const rank = top.data?.me?.rank;

  return (
    <TgProfile
      showTarif
      links={[
        {
          href: '/tg/teacher/shares',
          label: 'Ulashilgan testlar',
          trailing: newShares > 0 ? `${newShares} yangi` : undefined,
        },
        { href: '/tg/teacher/books', label: 'Kitoblarim' },
        { href: '/tg/teacher/rank', label: 'Reyting', trailing: rank ? `${rank}-o'rin` : undefined },
      ]}
    />
  );
}
