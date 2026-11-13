import { cn } from '@/lib/utils';

// Variant ranglari va shakllari doskada ham, telefonda ham bir xil — o'quvchi
// doskaga qarab o'z tugmasini tez topadi. Rangni ajratmaydiganlar uchun shakl
// doim birga ko'rsatiladi. Ranglar oq matn bilan yirik shriftda kontrast beradi.
export const OPTION_STYLES = [
  { key: 'red', name: 'Qizil', shape: 'triangle', symbol: '▲', bg: 'bg-[#D01937]', text: 'text-[#D01937]', hex: '#D01937' },
  { key: 'blue', name: "Ko'k", shape: 'diamond', symbol: '◆', bg: 'bg-[#1368CE]', text: 'text-[#1368CE]', hex: '#1368CE' },
  { key: 'yellow', name: 'Sariq', shape: 'circle', symbol: '●', bg: 'bg-[#B07800]', text: 'text-[#B07800]', hex: '#B07800' },
  { key: 'green', name: 'Yashil', shape: 'square', symbol: '■', bg: 'bg-[#26890C]', text: 'text-[#26890C]', hex: '#26890C' },
] as const;

export type OptionStyle = (typeof OPTION_STYLES)[number];

export function optionStyle(index: number): OptionStyle {
  return OPTION_STYLES[index % OPTION_STYLES.length];
}

// Shakl SVG'da — shrift belgilariga (▲◆●■) qaraganda hamma qurilmada bir xil chiqadi
export function OptionShape({
  index,
  className,
  title,
}: {
  index: number;
  className?: string;
  title?: string;
}) {
  const style = optionStyle(index);
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6 shrink-0 fill-current', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {style.shape === 'triangle' && <path d="M12 2.5 22.5 21h-21z" />}
      {style.shape === 'diamond' && <path d="M12 1.5 22.5 12 12 22.5 1.5 12z" />}
      {style.shape === 'circle' && <circle cx="12" cy="12" r="10" />}
      {style.shape === 'square' && <rect x="2.5" y="2.5" width="19" height="19" rx="1.5" />}
    </svg>
  );
}

// Muharrirdagi variant yonida: rangli kvadrat ichida shakl
export function OptionBadge({ index, className }: { index: number; className?: string }) {
  const style = optionStyle(index);
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl text-white',
        style.bg,
        className
      )}
      title={`${style.name} ${style.symbol}`}
    >
      <OptionShape index={index} className="size-5" title={`${style.name} ${style.symbol}`} />
    </span>
  );
}
