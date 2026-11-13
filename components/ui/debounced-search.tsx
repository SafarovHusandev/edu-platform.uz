'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Kechiktirilgan qidiruv maydoni. `onSearch` ga har doim trim qilingan qiymat
// beriladi (bo'sh/faqat probel — ''). Tashqi qiymat (masalan URL'dagi ?search=)
// o'zgarsa, maydon o'zi sinxronlanadi — `key` bilan qayta mount qilish shart emas
// (qayta mount yozish paytida fokusni yo'qotadi).
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initial);
  // Oxirgi marta tashqariga yuborilgan (yoki tashqaridan kelgan) qiymat
  const [committed, setCommitted] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);

  // Tashqi qiymat o'zgardi (masalan "Qidiruvni tozalash" tugmasi yoki orqaga
  // qaytish). O'zimiz yuborgan qiymat qaytib kelganda yozilayotgan matnni buzmaymiz.
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    if (initial !== committed) {
      setValue(initial);
      setCommitted(initial);
    }
  }

  useEffect(() => {
    const next = value.trim();
    if (next === committed) return;
    const timeout = setTimeout(() => {
      setCommitted(next);
      onSearch(next);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, committed, onSearch, delay]);

  function clear() {
    setValue('');
    inputRef.current?.focus();
    if (committed !== '') {
      setCommitted('');
      onSearch('');
    }
  }

  return (
    <div className={cn('relative min-w-0', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            clear();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        className={cn('h-[52px] rounded-[14px] pl-12 pr-11 text-base', inputClassName)}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Qidiruvni tozalash"
          className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
