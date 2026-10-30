'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Kechiktirilgan qidiruv maydoni. Tashqi qiymat (masalan URL'dagi ?search=)
// o'zgarganda komponentni `key={initial}` bilan qayta mount qiling — shunda
// effekt ichida state sinxronlash kerak bo'lmaydi.
export function DebouncedSearch({
  initial,
  onSearch,
  placeholder,
  label,
  delay = 350,
  className,
  inputClassName,
}: {
  initial: string;
  onSearch: (value: string) => void;
  placeholder: string;
  label: string;
  delay?: number;
  className?: string;
  inputClassName?: string;
}) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (value === initial) return;
    const timeout = setTimeout(() => onSearch(value.trim()), delay);
    return () => clearTimeout(timeout);
  }, [value, initial, onSearch, delay]);

  return (
    <div className={cn('relative min-w-0', className)}>
      <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn('h-[52px] rounded-[14px] pl-12 text-base', inputClassName)}
      />
    </div>
  );
}
