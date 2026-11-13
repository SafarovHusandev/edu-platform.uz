import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SUPER_TEACHER_MODULES, type SuperTeacherModule } from '@/components/super-teacher/modules';
import { cn } from '@/lib/utils';

function ModuleCardBody({ module }: { module: SuperTeacherModule }) {
  const ready = module.status === 'ready';
  return (
    <>
      <span
        className={cn(
          'flex size-16 shrink-0 items-center justify-center rounded-2xl',
          ready ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        <module.icon className="size-8" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-xl font-semibold">{module.title}</span>
          {!ready && (
            <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold text-gold-foreground">
              Tez kunda
            </span>
          )}
        </span>
        <span className="text-[15px] leading-snug text-muted-foreground">{module.description}</span>
      </span>
      {ready && <ArrowRight className="size-6 shrink-0 text-primary" />}
    </>
  );
}

// Modullar SUPER_TEACHER_MODULES config'idan chiqadi — yangi modul uchun bu
// komponentni o'zgartirish shart emas.
export function SuperTeacherHub() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageHeader
        title="Super-ustoz"
        description="Interaktiv doskada dars o'tish uchun asboblar"
        className="mb-0"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {SUPER_TEACHER_MODULES.map((module) => {
          const className =
            'flex min-h-32 items-center gap-5 rounded-[22px] border border-border bg-card p-6 text-left';
          if (module.status === 'ready' && module.path) {
            return (
              <Link
                key={module.key}
                href={module.path}
                className={cn(
                  className,
                  'transition-[border-color,box-shadow,transform] hover:border-primary/40 hover:shadow-md active:scale-[0.99]'
                )}
              >
                <ModuleCardBody module={module} />
              </Link>
            );
          }
          return (
            <div
              key={module.key}
              aria-disabled="true"
              className={cn(className, 'cursor-not-allowed opacity-60')}
            >
              <ModuleCardBody module={module} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
