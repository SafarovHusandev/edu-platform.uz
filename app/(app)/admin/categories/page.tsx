'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderTree, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import type { Category } from '@/types';
import { CategoryList } from '@/components/admin/category-list';

const categorySchema = z.object({
  name: z.string().min(2, { error: 'Kamida 2 ta belgi' }),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', description: '' });
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    form.reset({ name: category.name, description: category.description ?? '' });
    setDialogOpen(true);
  }

  function onSubmit(values: CategoryFormValues) {
    if (editing) {
      updateCategory.mutate(
        { id: editing._id, ...values },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createCategory.mutate(values, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Kategoriyalar"
        description="Kurs kategoriyalarini boshqaring"
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus className="size-4" /> Yangi kategoriya
          </Button>
        }
      />

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-[20px] bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !categories || categories.length === 0 ? (
        <EmptyState icon={FolderTree} title="Hali kategoriya qo'shilmagan" />
      ) : (
        <CategoryList
          items={categories}
          onEdit={openEdit}
          onDelete={(category) => deleteCategory.mutate(category._id)}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <span className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                <FolderTree className="size-4.5" />
              </span>
              {editing ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Kurslarni guruhlash uchun kategoriya nomi va tavsifini kiriting
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Kategoriya nomi</FormLabel>
                    <FormControl>
                      <Input className="h-11 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tavsif (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea className="rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full text-base sm:w-fit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                >
                  {(createCategory.isPending || updateCategory.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Saqlash
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
