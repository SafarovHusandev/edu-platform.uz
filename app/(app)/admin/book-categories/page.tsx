'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Library, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
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
  useBookCategories,
  useCreateBookCategory,
  useUpdateBookCategory,
  useDeleteBookCategory,
} from '@/hooks/use-book-categories';
import type { BookCategory } from '@/types';
import { CategoryList } from '@/components/admin/category-list';

const bookCategorySchema = z.object({
  name: z.string().min(2, { error: 'Kamida 2 ta belgi' }),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type BookCategoryFormValues = z.infer<typeof bookCategorySchema>;

export default function AdminBookCategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useBookCategories();
  const createCategory = useCreateBookCategory();
  const updateCategory = useUpdateBookCategory();
  const deleteCategory = useDeleteBookCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BookCategory | null>(null);

  const form = useForm<BookCategoryFormValues>({
    resolver: zodResolver(bookCategorySchema),
    defaultValues: { name: '', description: '', icon: '' },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', description: '', icon: '' });
    setDialogOpen(true);
  }

  function openEdit(category: BookCategory) {
    setEditing(category);
    form.reset({
      name: category.name,
      description: category.description ?? '',
      icon: category.icon ?? '',
    });
    setDialogOpen(true);
  }

  function onSubmit(values: BookCategoryFormValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      icon: values.icon || undefined,
    };
    if (editing) {
      updateCategory.mutate(
        { id: editing._id, ...payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createCategory.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Kitob kategoriyalari"
        description="Kutubxona kategoriyalarini boshqaring"
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
        <EmptyState icon={Library} title="Hali kategoriya qo'shilmagan" />
      ) : (
        <CategoryList
          items={categories}
          onEdit={openEdit}
          onDelete={(category) => deleteCategory.mutate(category._id)}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategoriya nomi</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Tavsif (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon URL (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
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
