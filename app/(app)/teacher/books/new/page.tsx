"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useBookCategories, useCreateBookCategory } from "@/hooks/use-book-categories"
import { useCreateBook } from "@/hooks/use-books"

const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1))

const schema = z.object({
  title: z.string().min(2, { error: "Kamida 2 ta belgi" }).max(150),
  author: z.string().min(2, { error: "Kamida 2 ta belgi" }).max(100),
  description: z.string().optional(),
  category: z.string().min(1, { error: "Kategoriyani tanlang" }),
  grade: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewBookPage() {
  const router = useRouter()
  const { data: categories } = useBookCategories()
  const createBook = useCreateBook()
  const createCategory = useCreateBookCategory()
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", author: "", description: "", category: "", grade: "" },
  })

  function onSubmit(values: FormValues) {
    createBook.mutate(
      {
        title: values.title,
        author: values.author,
        description: values.description,
        category: values.category,
        grade: values.grade && values.grade !== "all" ? Number(values.grade) : undefined,
      },
      {
        onSuccess: (book) => router.push(`/teacher/books/${book._id}`),
      }
    )
  }

  function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    createCategory.mutate(
      { name: newCategoryName.trim() },
      {
        onSuccess: (category) => {
          form.setValue("category", category._id)
          setNewCategoryName("")
          setCategoryDialogOpen(false)
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Yangi kitob qo&apos;shish</CardTitle>
          <CardDescription>
            Kitob ma&apos;lumotlarini kiriting, muqova va faylni keyingi bosqichda yuklaysiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kitob nomi</FormLabel>
                    <FormControl>
                      <Input placeholder="O'tkan kunlar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muallif</FormLabel>
                    <FormControl>
                      <Input placeholder="Abdulla Qodiriy" {...field} />
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
                      <Textarea placeholder="Kitob haqida qisqacha ma'lumot..." {...field} />
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
                            <DialogTitle>Yangi kitob kategoriyasi</DialogTitle>
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
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sinf (ixtiyoriy)</FormLabel>
                    <Select
                      value={field.value || "all"}
                      onValueChange={field.onChange}
                      items={[
                        { value: "all", label: "Barcha sinflar uchun" },
                        ...GRADE_NUMBERS.map((n) => ({ value: n, label: `${n}-sinf` })),
                      ]}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Barcha sinflar uchun" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Barcha sinflar uchun</SelectItem>
                        {GRADE_NUMBERS.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}-sinf
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createBook.isPending}>
                {createBook.isPending && <Loader2 className="size-4 animate-spin" />}
                Kitobni yaratish
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
