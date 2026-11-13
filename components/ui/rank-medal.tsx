import { Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

const MEDAL_COLORS = ['text-[#E6A700]', 'text-[#9AA3B2]', 'text-[#C2743A]'] as const;
const MEDAL_LABELS = ["1-o'rin", "2-o'rin", "3-o'rin"] as const;

// 1–3-o'rin uchun medal (oltin, kumush, bronza). Boshqa o'rinlarda null.
export function RankMedal({ rank, className }: { rank: number; className?: string }) {
  if (rank < 1 || rank > 3) return null;
  return (
    <Medal
      className={cn('inline size-5 shrink-0', MEDAL_COLORS[rank - 1], className)}
      aria-label={MEDAL_LABELS[rank - 1]}
      role="img"
    />
  );
}
