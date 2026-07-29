'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCategories, useCreateCategory } from '@/hooks/use-categories';
import { useCreateCourse } from '@/hooks/use-courses';
import { toTiyin } from '@/lib/format';

const schema = z.object({
  title: z.string().min(3, { error: 'Kamida 3 ta belgi' }),
  description: z.string().min(10, { error: 'Kamida 10 ta belgi' }),
  category: z.string().min(1, { error: 'Kategoriyani tanlang' }),
  price: z.coerce.number().min(0, { error: "Narx manfiy bo'lmasin" }),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const createCourse = useCreateCourse();
  const createCategory = useCreateCategory();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', category: '', price: 0 },
  });

  function onSubmit(values: FormValues) {
    createCourse.mutate(
      { ...values, price: toTiyin(values.price) },
      {
        onSuccess: (course) => {
          router.push(`/teacher/courses/${course._id}`);
        },
      }
    );
  }

  function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    createCategory.mutate(
      { name: newCategoryName.trim() },
      {
        onSuccess: (category) => {
          form.setValue('category', category._id);
          setNewCategoryName('');
          setCategoryDialogOpen(false);
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Yangi kurs yaratish</CardTitle>
          <CardDescription>Kurs ma&apos;lumotlarini kiriting</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kurs nomi</FormLabel>
                    <FormControl>
                      <Input placeholder="JavaScript asoslari" {...field} />
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
                    <FormLabel>Tavsif</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Kurs haqida qisqacha ma'lumot..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Kategoriya</FormLabel>
                      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                        <DialogTrigger render={<Button type="button" variant="ghost" size="sm" />}>
                          <Plus className="size-3.5" /> Yangi
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Yangi kategoriya</DialogTitle>
                          </DialogHeader>
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Kategoriya nomi"
                          />
                          <DialogFooter>
                            <Button
                              onClick={handleCreateCategory}
                              disabled={createCategory.isPending}
                            >
                              {createCategory.isPending && (
                                <Loader2 className="size-4 animate-spin" />
                              )}
                              Yaratish
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={categories?.map((cat) => ({ value: cat._id, label: cat.name })) ?? []}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Kategoriyani tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narx (so&apos;m, 0 = bepul)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        {...field}
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createCourse.isPending}>
                {createCourse.isPending && <Loader2 className="size-4 animate-spin" />}
                Kursni yaratish
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
