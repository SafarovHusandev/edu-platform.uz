'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { coverTone } from '@/components/dashboard/dashboard-ui';
import { cn } from '@/lib/utils';

interface CategoryItem {
  _id: string;
  name: string;
  description?: string;
}

// Admin kategoriyalar ro'yxati (edu-platform-dizayn: AdminCategories)
export function CategoryList<T extends CategoryItem>({
  items,
  onEdit,
  onDelete,
}: {
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-border bg-card">
      {items.map((item, index) => (
        <div
          key={item._id}
          className="flex items-center gap-3 border-b border-muted px-5 py-3.5 last:border-0"
        >
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold',
              coverTone(index)
            )}
          >
            {item.name.slice(0, 2)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{item.name}</span>
            {item.description && (
              <span className="line-clamp-1 text-[13px] text-muted-foreground">
                {item.description}
              </span>
            )}
          </span>
          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
            <Pencil className="size-3.5" /> Tahrir
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}
            >
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kategoriyani o&apos;chirasizmi?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{item.name}&quot; o&apos;chiriladi. Bu amalni bekor qilib bo&apos;lmaydi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => onDelete(item)}>
                  O&apos;chirish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </section>
  );
}
