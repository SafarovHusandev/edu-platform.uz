import { BrandMark } from '@/components/layout/brand-mark';
import { DiamondIcon } from '@/components/icons/diamond-icon';

// 404 / 500 holat sahifalari (edu-platform-dizayn: NotFound)
export function StatusPage({
  code,
  title,
  description,
  actions,
}: {
  code: string;
  title: string;
  description: string;
  actions: React.ReactNode;
}) {
  const [first, ...rest] = code.split('');
  const last = rest.pop();
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-300 px-4 py-3.5 sm:px-6">
          <BrandMark className="w-fit [&>span:last-child]:text-lg" />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-300 flex-1 flex-wrap items-center justify-center gap-10 px-4 py-16 sm:px-6 lg:gap-16">
        <div
          aria-hidden
          className="flex items-center font-heading text-[96px] leading-none font-bold text-primary sm:text-[140px]"
        >
          {first}
          <span className="mx-1 flex size-20 items-center justify-center rounded-full bg-gold-soft sm:size-28">
            <DiamondIcon className="size-12 sm:size-16" />
          </span>
          {rest.join('')}
          {last}
        </div>
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{description}</p>
          <div className="flex flex-wrap gap-2.5 pt-1">{actions}</div>
        </div>
      </main>
    </div>
  );
}
