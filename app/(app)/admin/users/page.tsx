'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  Pencil,
  Search,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { SkeletonTable } from '@/components/ui/skeleton';
import { PaginationBar } from '@/components/ui/pagination-bar';
import {
  useUsers,
  useToggleUserBlock,
  useVerifyUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/use-users';
import { useAuthStore } from '@/store/auth-store';
import { ROLE_LABELS } from '@/lib/roles';
import { resolveAssetUrl } from '@/lib/config';
import { formatDateTime, formatRelativeTime, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Role, Tarif, User } from '@/types';

const PAGE_SIZE = 15;
const ROLES: Role[] = ['student', 'teacher', 'admin', 'superadmin'];
const TARIFS: Tarif[] = ['standart', 'premium'];
const TARIF_LABELS: Record<Tarif, string> = { standart: 'Standart', premium: 'Premium' };
const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1));
const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROLE_BADGE_STYLES: Record<Role, string> = {
  student: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  teacher: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  admin: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  superadmin: 'bg-primary/10 text-primary',
};

const userEditSchema = z
  .object({
    name: z.string().min(2, { error: 'Kamida 2 ta belgi' }),
    phone: z.string().min(5, { error: 'Telefon raqamni kiriting' }),
    role: z.enum(ROLES as [Role, ...Role[]]),
    tarif: z.enum(TARIFS as [Tarif, ...Tarif[]]),
    gradeNumber: z.string().optional(),
    gradeLetter: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'student') {
      if (!data.gradeNumber) {
        ctx.addIssue({ code: 'custom', path: ['gradeNumber'], message: 'Sinfni tanlang' });
      }
      if (!data.gradeLetter) {
        ctx.addIssue({ code: 'custom', path: ['gradeLetter'], message: 'Sinfni tanlang' });
      }
    }
  });

type UserEditFormValues = z.infer<typeof userEditSchema>;

const userCreateSchema = z
  .object({
    name: z
      .string()
      .min(2, { error: 'Kamida 2 ta belgi' })
      .max(50, { error: "Ko'pi bilan 50 ta belgi" }),
    phone: z.string().min(5, { error: 'Telefon raqamni kiriting' }),
    password: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
    role: z.enum(ROLES as [Role, ...Role[]]),
    tarif: z.enum(TARIFS as [Tarif, ...Tarif[]]),
    gradeNumber: z.string().optional(),
    gradeLetter: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'student') {
      if (!data.gradeNumber) {
        ctx.addIssue({ code: 'custom', path: ['gradeNumber'], message: 'Sinfni tanlang' });
      }
      if (!data.gradeLetter) {
        ctx.addIssue({ code: 'custom', path: ['gradeLetter'], message: 'Sinfni tanlang' });
      }
    }
  });

type UserCreateFormValues = z.infer<typeof userCreateSchema>;

type VerifiedTab = 'all' | 'unverified' | 'verified';

function isVerifiedTab(value: string | null): value is VerifiedTab {
  return value === 'all' || value === 'unverified' || value === 'verified';
}

function AdminUsersPageContent() {
  const searchParams = useSearchParams();
  // Bildirishnomadan "/admin/users?tab=unverified" kabi to'g'ridan-to'g'ri
  // havola bilan kelinganda tegishli tab ochilishi uchun.
  const initialTab = searchParams.get('tab');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [verifiedTab, setVerifiedTab] = useState<VerifiedTab>(
    isVerifiedTab(initialTab) ? initialTab : 'unverified'
  );
  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    isVerified: verifiedTab === 'all' ? undefined : verifiedTab === 'verified',
  });
  const toggleBlock = useToggleUserBlock();
  const verifyUser = useVerifyUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperadmin = currentUser?.role === 'superadmin';

  const [editing, setEditing] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const createForm = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      role: 'student',
      tarif: 'standart',
      gradeNumber: '',
      gradeLetter: '',
    },
  });
  const createRole = createForm.watch('role');

  function openCreate() {
    createForm.reset({
      name: '',
      phone: '',
      password: '',
      role: 'student',
      tarif: 'standart',
      gradeNumber: '',
      gradeLetter: '',
    });
    setCreateOpen(true);
  }

  function onCreateSubmit(values: UserCreateFormValues) {
    createUser.mutate(
      {
        name: values.name.trim(),
        phone: values.phone.trim(),
        password: values.password,
        role: values.role,
        tarif: values.tarif,
        ...(values.role === 'student'
          ? { grade: { number: Number(values.gradeNumber), letter: values.gradeLetter ?? null } }
          : {}),
      },
      { onSuccess: () => setCreateOpen(false) }
    );
  }

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: '',
      phone: '',
      role: 'student',
      tarif: 'standart',
      gradeNumber: '',
      gradeLetter: '',
    },
  });
  const role = form.watch('role');

  function openEdit(user: User) {
    setEditing(user);
    form.reset({
      name: user.name,
      phone: user.phone,
      role: user.role,
      tarif: user.tarif ?? 'standart',
      gradeNumber: user.grade?.number ? String(user.grade.number) : '',
      gradeLetter: user.grade?.letter ?? '',
    });
  }

  function onSubmit(values: UserEditFormValues) {
    if (!editing) return;

    updateUser.mutate(
      {
        id: editing._id,
        name: values.name.trim(),
        phone: values.phone.trim(),
        role: values.role,
        tarif: values.tarif,
        ...(values.role === 'student'
          ? { grade: { number: Number(values.gradeNumber), letter: values.gradeLetter ?? null } }
          : {}),
      },
      { onSuccess: () => setEditing(null) }
    );
  }

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        description="Barcha ro'yxatdan o'tgan foydalanuvchilar"
        actions={
          isSuperadmin && (
            <Button onClick={openCreate} className="py-[18px]">
              <UserPlus className="size-4" /> Foydalanuvchi qo&apos;shish
            </Button>
          )
        }
      />

      <Tabs
        value={verifiedTab}
        onValueChange={(value) => {
          setVerifiedTab(value as 'all' | 'unverified' | 'verified');
          setPage(1);
        }}
        className="mb-5"
      >
        <TabsList>
          <TabsTrigger value="all">Barchasi</TabsTrigger>
          <TabsTrigger value="verified">Tasdiqlangan</TabsTrigger>
          <TabsTrigger value="unverified">Tasdiqlanmagan</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          className="h-11 rounded-md pl-10 text-base"
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
          <Card className="gap-0 overflow-hidden rounded-md py-0 shadow-sm ring-1 ring-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Foydalanuvchi
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Telefon
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rol
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Holat
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ro&apos;yxatdan o&apos;tgan
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Oxirgi kirish
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const isSelf = item._id === currentUser?._id;
                  return (
                    <TableRow key={item._id} className="hover:bg-muted/30">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="shadow-sm ring-2 ring-background">
                            <AvatarImage src={resolveAssetUrl(item.avatar)} alt={item.name} />
                            <AvatarFallback>{initials(item.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {item.phone}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={cn('rounded-full px-2.5 py-1', ROLE_BADGE_STYLES[item.role])}
                        >
                          {ROLE_LABELS[item.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {!item.isVerified && (
                            <Badge className="gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-400">
                              <span className="size-1.5 rounded-full bg-amber-500" /> Tasdiqlanmagan
                            </Badge>
                          )}
                          {item.isBlocked ? (
                            <Badge
                              variant="destructive"
                              className="gap-1.5 rounded-full px-2.5 py-1"
                            >
                              <span className="size-1.5 rounded-full bg-destructive" /> Bloklangan
                            </Badge>
                          ) : (
                            <Badge className="gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-success">
                              <span className="size-1.5 rounded-full bg-success" /> Faol
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className="px-4 py-3 text-sm text-muted-foreground"
                        title={item.createdAt ? formatDateTime(item.createdAt) : undefined}
                      >
                        {item.createdAt ? formatRelativeTime(item.createdAt) : '—'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'px-4 py-3 text-sm',
                          item.lastLogin
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground/60 italic'
                        )}
                        title={item.lastLogin ? formatDateTime(item.lastLogin) : undefined}
                      >
                        {item.lastLogin ? formatRelativeTime(item.lastLogin) : 'Hech qachon'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {!item.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                              disabled={verifyUser.isPending}
                              onClick={() => verifyUser.mutate(item._id)}
                            >
                              <UserCheck className="size-4" /> Tasdiqlash
                            </Button>
                          )}
                          {isSuperadmin && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-lg"
                              aria-label="Tahrirlash"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={<Button variant="outline" size="sm" className="rounded-lg" />}
                            >
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
                                    ? 'Foydalanuvchi tizimga qayta kira oladi.'
                                    : 'Foydalanuvchi tizimga kira olmay qoladi.'}
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
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="rounded-lg"
                                    aria-label="O'chirish"
                                  />
                                }
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
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="mt-4">
            <PaginationBar
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              itemLabel="foydalanuvchi"
              onPageChange={setPage}
            />
          </div>
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
              {role === 'student' && (
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <UserPlus className="size-4.5" />
              </span>
              Yangi foydalanuvchi qo&apos;shish
            </DialogTitle>
            <DialogDescription className="text-sm">
              Tizimga yangi foydalanuvchi qo&apos;shing va unga rol tayinlang
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Ism</FormLabel>
                    <FormControl>
                      <Input className="h-11 rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Telefon</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11 rounded-md text-base"
                        placeholder="998901234567"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Parol</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-11 rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Rol</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-md text-base">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r} className="py-2 text-base">
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
                  control={createForm.control}
                  name="tarif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tarif</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={TARIFS.map((t) => ({ value: t, label: TARIF_LABELS[t] }))}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-md text-base">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TARIFS.map((t) => (
                            <SelectItem key={t} value={t} className="py-2 text-base">
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
              {createRole === 'student' && (
                <div className="grid grid-cols-1 gap-3 rounded-md bg-muted/50 p-3 sm:grid-cols-2">
                  <FormField
                    control={createForm.control}
                    name="gradeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Sinf</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          items={GRADE_NUMBERS.map((n) => ({ value: n, label: n }))}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 w-full rounded-md bg-background text-base">
                              <SelectValue placeholder="Raqam" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADE_NUMBERS.map((n) => (
                              <SelectItem key={n} value={n} className="py-2 text-base">
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
                    control={createForm.control}
                    name="gradeLetter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Guruh</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          items={GRADE_LETTERS.map((l) => ({ value: l, label: l }))}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 w-full rounded-md bg-background text-base">
                              <SelectValue placeholder="Harf" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADE_LETTERS.map((l) => (
                              <SelectItem key={l} value={l} className="py-2 text-base">
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
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full rounded-md text-base sm:w-fit"
                  disabled={createUser.isPending}
                >
                  {createUser.isPending && <Loader2 className="size-4 animate-spin" />}
                  Yaratish
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
      <AdminUsersPageContent />
    </Suspense>
  );
}
