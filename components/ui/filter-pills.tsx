'use client';

import { cn } from '@/lib/utils';

// Dizayndagi yumaloq filtr tugmalari (Barchasi / Kurs / Dars ...). Mobil
// ekranda gorizontal aylantiriladi.
export function FilterPills<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div
      role="group"
      className={cn('-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'border border-input bg-card text-foreground hover:bg-muted'
            )}
          >
            {option.label}
            {option.count != null && option.count > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs font-bold tabular-nums',
                  active ? 'bg-primary-foreground/20' : 'bg-muted'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
