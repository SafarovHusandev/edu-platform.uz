"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Pencil, Search, ShieldBan, ShieldCheck, Trash2, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonTable } from "@/components/ui/skeleton"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { useUsers, useToggleUserBlock, useUpdateUser, useDeleteUser } from "@/hooks/use-users"
import { useAuthStore } from "@/store/auth-store"
import { ROLE_LABELS } from "@/lib/roles"
import { resolveAssetUrl } from "@/lib/config"
import { formatDateTime, formatRelativeTime, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Role, Tarif, User } from "@/types"

const PAGE_SIZE = 15
const ROLES: Role[] = ["student", "teacher", "admin", "superadmin"]
const TARIFS: Tarif[] = ["standart", "premium"]
const TARIF_LABELS: Record<Tarif, string> = { standart: "Standart", premium: "Premium" }
const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1))
const GRADE_LETTERS = ["A", "B", "C", "D", "E", "F"]

const userEditSchema = z
  .object({
    name: z.string().min(2, { error: "Kamida 2 ta belgi" }),
    phone: z.string().min(5, { error: "Telefon raqamni kiriting" }),
    role: z.enum(ROLES as [Role, ...Role[]]),
    tarif: z.enum(TARIFS as [Tarif, ...Tarif[]]),
    gradeNumber: z.string().optional(),
    gradeLetter: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "student") {
      if (!data.gradeNumber) {
        ctx.addIssue({ code: "custom", path: ["gradeNumber"], message: "Sinfni tanlang" })
      }
      if (!data.gradeLetter) {
        ctx.addIssue({ code: "custom", path: ["gradeLetter"], message: "Sinfni tanlang" })
      }
    }
  })

type UserEditFormValues = z.infer<typeof userEditSchema>

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  })
  const toggleBlock = useToggleUserBlock()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const currentUser = useAuthStore((s) => s.user)
  const isSuperadmin = currentUser?.role === "superadmin"

  const [editing, setEditing] = useState<User | null>(null)

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: "",
      phone: "",
      role: "student",
      tarif: "standart",
      gradeNumber: "",
      gradeLetter: "",
    },
  })
  const role = form.watch("role")

  function openEdit(user: User) {
    setEditing(user)
    form.reset({
      name: user.name,
      phone: user.phone,
      role: user.role,
      tarif: user.tarif ?? "standart",
      gradeNumber: user.grade?.number ? String(user.grade.number) : "",
      gradeLetter: user.grade?.letter ?? "",
    })
  }

  function onSubmit(values: UserEditFormValues) {
    if (!editing) return

    updateUser.mutate(
      {
        id: editing._id,
        name: values.name.trim(),
        phone: values.phone.trim(),
        role: values.role,
        tarif: values.tarif,
        ...(values.role === "student"
          ? { grade: { number: Number(values.gradeNumber), letter: values.gradeLetter } }
          : {}),
      },
      { onSuccess: () => setEditing(null) }
    )
  }

  return (
    <div>
      <PageHeader title="Foydalanuvchilar" description="Barcha ro'yxatdan o'tgan foydalanuvchilar" />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          className="h-10 pl-9"
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Users} title="Foydalanuvchi topilmadi" />
      ) : (
        <>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Ro&apos;yxatdan o&apos;tgan</TableHead>
                  <TableHead>Oxirgi kirish</TableHead>
                  <TableHead className="text-right">Amal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const isSelf = item._id === currentUser?._id
                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            <AvatarImage src={resolveAssetUrl(item.avatar)} alt={item.name} />
                            <AvatarFallback>{initials(item.name)}</AvatarFallback>
                          </Avatar>
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ROLE_LABELS[item.role]}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.isBlocked ? (
                          <Badge variant="destructive">Bloklangan</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">Faol</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" title={item.createdAt ? formatDateTime(item.createdAt) : undefined}>
                        {item.createdAt ? formatRelativeTime(item.createdAt) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-sm",
                          item.lastLogin ? "text-muted-foreground" : "text-muted-foreground/60 italic"
                        )}
                        title={item.lastLogin ? formatDateTime(item.lastLogin) : undefined}
                      >
                        {item.lastLogin ? formatRelativeTime(item.lastLogin) : "Hech qachon"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {isSuperadmin && (
                            <Button variant="ghost" size="icon-sm" aria-label="Tahrirlash" onClick={() => openEdit(item)}>
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
                              {item.isBlocked ? (
                                <>
                                  <ShieldCheck className="size-4" /> Blokdan chiqarish
                                </>
                              ) : (
                                <>
                                  <ShieldBan className="size-4" /> Bloklash
                                </>
                              )}
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {item.isBlocked
                                    ? `${item.name}ni blokdan chiqarasizmi?`
                                    : `${item.name}ni bloklaysizmi?`}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {item.isBlocked
                                    ? "Foydalanuvchi tizimga qayta kira oladi."
                                    : "Foydalanuvchi tizimga kira olmay qoladi."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    toggleBlock.mutate({ id: item._id, isBlocked: !item.isBlocked })
                                  }
                                >
                                  Tasdiqlash
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {isSuperadmin && !isSelf && (
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {item.name}ni butunlay o&apos;chirmoqchimisiz?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu amalni orqaga qaytarib bo&apos;lmaydi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser.mutate(item._id)}>
                                    O&apos;chirish
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="foydalanuvchi"
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foydalanuvchini tahrirlash</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ism</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="998901234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
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
                  name="tarif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={TARIFS.map((t) => ({ value: t, label: TARIF_LABELS[t] }))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TARIFS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {TARIF_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {role === "student" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="gradeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sinf</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          items={GRADE_NUMBERS.map((n) => ({ value: n, label: n }))}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Raqam" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADE_NUMBERS.map((n) => (
                              <SelectItem key={n} value={n}>
                                {n}
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
                    name="gradeLetter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guruh</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          items={GRADE_LETTERS.map((l) => ({ value: l, label: l }))}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Harf" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADE_LETTERS.map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending && <Loader2 className="size-4 animate-spin" />}
                  Saqlash
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
