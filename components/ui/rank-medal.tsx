import { cn } from '@/lib/utils';

const MEDAL_COLORS = ['text-[#E6A700]', 'text-[#9AA3B2]', 'text-[#C2743A]'] as const;
const MEDAL_LABELS = ["1-o'rin", "2-o'rin", "3-o'rin"] as const;

// 1–3-o'rin uchun medal (oltin, kumush, bronza), ichida o'rin raqami. Boshqa o'rinlarda null.
// Shakli lucide `Medal` bilan bir xil, faqat undagi qotirilgan "1" o'rniga haqiqiy o'rin yoziladi.
export function RankMedal({ rank, className }: { rank: number; className?: string }) {
  if (rank < 1 || rank > 3) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('inline size-5 shrink-0', MEDAL_COLORS[rank - 1], className)}
      aria-label={MEDAL_LABELS[rank - 1]}
      role="img"
    >
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <path d="M8 7h8" />
      <circle cx="12" cy="17" r="5" />
      <text
        x="12"
        y="17"
        dy="0.36em"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="6.5"
        fontWeight="800"
        fontFamily="inherit"
      >
        {rank}
      </text>
    </svg>
  );
}
