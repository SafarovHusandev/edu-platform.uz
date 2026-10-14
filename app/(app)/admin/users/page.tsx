'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  GraduationCap,
  Loader2,
  Search,
  ShieldBan,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  useResetUserPassword,
  useAdminUploadAvatar,
  useAdminDeleteAvatar,
} from '@/hooks/use-users';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api-client';
import { ROLE_LABELS } from '@/lib/roles';
import { resolveAssetUrl } from '@/lib/config';
import { formatDate, formatNumber, formatRelativeTime, initials } from '@/lib/format';
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

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function AdminUsersPageContent() {
  const searchParams = useSearchParams();
  // Bildirishnomadan "/admin/users?tab=unverified" kabi to'g'ridan-to'g'ri
  // havola bilan kelinganda tegishli filtr avtomatik yoqilishi uchun.
  const initialTab = searchParams.get('tab');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [tarifFilter, setTarifFilter] = useState<'all' | Tarif>('all');
  const [onlyUnverified, setOnlyUnverified] = useState(initialTab === 'unverified');
  const [nameSort, setNameSort] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    isVerified: onlyUnverified ? false : undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    tarif: tarifFilter === 'all' ? undefined : tarifFilter,
  });

  // Statistika kartalari butun bazadagi hisobni ko'rsatadi (joriy sahifa/filtrdan
  // qat'i nazar) — shuning uchun bir martalik, limit:1 so'rovlar orqali faqat
  // `.total`ni o'qiymiz. Har qanday mutatsiyadan keyin ['admin-users'] invalidate
  // qilingani uchun bular ham avtomatik yangilanadi.
  const { data: allStats } = useUsers({ limit: 1 });
  const { data: studentStats } = useUsers({ limit: 1, role: 'student' });
  const { data: teacherStats } = useUsers({ limit: 1, role: 'teacher' });
  const { data: unverifiedStats } = useUsers({ limit: 1, isVerified: false });

  const toggleBlock = useToggleUserBlock();
  const verifyUser = useVerifyUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();
  const uploadAvatar = useAdminUploadAvatar();
  const deleteAvatar = useAdminDeleteAvatar();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperadmin = currentUser?.role === 'superadmin';

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [blockTarget, setBlockTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState(false);
  const [editingGrade, setEditingGrade] = useState(false);
  const [tempGradeNumber, setTempGradeNumber] = useState('1');
  const [tempGradeLetter, setTempGradeLetter] = useState('A');
  const [bulkGradeOpen, setBulkGradeOpen] = useState(false);
  const [bulkGradeNumber, setBulkGradeNumber] = useState('1');
  const [bulkGradeLetter, setBulkGradeLetter] = useState('A');
  const [bulkPending, setBulkPending] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const detailUser = data?.items.find((u) => u._id === detailUserId) ?? null;

  function openDetail(id: string) {
    setEditingRole(false);
    setEditingGrade(false);
    setDetailUserId(id);
  }

  function closeDetail() {
    setDetailUserId(null);
    setEditingRole(false);
    setEditingGrade(false);
  }

  const sortedItems = useMemo(() => {
    const items = data?.items ?? [];
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'uz'));
    return nameSort === 'asc' ? sorted : sorted.reverse();
  }, [data?.items, nameSort]);

  const pageIds = useMemo(() => sortedItems.map((u) => u._id), [sortedItems]);
  const allSelectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  function toggleSelectAllOnPage(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleBulkVerify() {
    const targets = (data?.items ?? []).filter((u) => selectedIds.has(u._id) && !u.isVerified);
    if (targets.length === 0) {
      toast.error("Tanlanganlar orasida tasdiqlanmagan foydalanuvchi yo'q");
      return;
    }
    setBulkPending(true);
    try {
      await Promise.all(targets.map((u) => api.patch(`/users/${u._id}/verify`)));
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${targets.length} ta foydalanuvchi tasdiqlandi`);
      setSelectedIds(new Set());
    } catch {
      toast.error("Ba'zi foydalanuvchilarni tasdiqlashda xatolik yuz berdi");
    } finally {
      setBulkPending(false);
    }
  }

  async function handleBulkBlock() {
    const targets = (data?.items ?? []).filter(
      (u) => selectedIds.has(u._id) && u._id !== currentUser?._id && !u.isBlocked
    );
    if (targets.length === 0) {
      toast.error("Tanlanganlar orasida bloklash mumkin bo'lgan foydalanuvchi yo'q");
      return;
    }
    setBulkPending(true);
    try {
      await Promise.all(
        targets.map((u) => api.patch(`/users/${u._id}/block`, { isBlocked: true }))
      );
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${targets.length} ta foydalanuvchi bloklandi`);
      setSelectedIds(new Set());
    } catch {
      toast.error("Ba'zi foydalanuvchilarni bloklashda xatolik yuz berdi");
    } finally {
      setBulkPending(false);
    }
  }

  async function handleBulkGradeChange() {
    const targets = (data?.items ?? []).filter(
      (u) => selectedIds.has(u._id) && u.role === 'student'
    );
    if (targets.length === 0) {
      toast.error("Tanlanganlar orasida o'quvchi yo'q");
      return;
    }
    setBulkPending(true);
    try {
      await Promise.all(
        targets.map((u) =>
          api.patch(`/users/${u._id}`, {
            grade: { number: Number(bulkGradeNumber), letter: bulkGradeLetter },
          })
        )
      );
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${targets.length} ta o'quvchining sinfi o'zgartirildi`);
      setSelectedIds(new Set());
      setBulkGradeOpen(false);
    } catch {
      toast.error("Sinfni o'zgartirishda xatolik yuz berdi");
    } finally {
      setBulkPending(false);
    }
  }

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  function openReset(user: User) {
    resetForm.reset({ newPassword: '' });
    setResetTarget(user);
  }

  function onResetSubmit(values: ResetPasswordFormValues) {
    if (!resetTarget) return;
    resetPassword.mutate(
      { id: resetTarget._id, newPassword: values.newPassword },
      { onSuccess: () => setResetTarget(null) }
    );
  }

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

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        actions={
          isSuperadmin && (
            <Button onClick={openCreate} className="rounded-md p-5 text-md">
              <UserPlus className="size-4" /> Qo&apos;shish
            </Button>
          )
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setRoleFilter('all');
            setOnlyUnverified(false);
            setPage(1);
          }}
          className={cn(
            'rounded-2xl border p-4 text-left transition-colors',
            roleFilter === 'all' && !onlyUnverified
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/70 bg-card hover:border-primary/40'
          )}
        >
          <p
            className={cn(
              'text-sm font-medium',
              roleFilter === 'all' && !onlyUnverified
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'
            )}
          >
            Barchasi
          </p>
          <p className="mt-1 text-3xl font-bold">{formatNumber(allStats?.total ?? 0)}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter('student');
            setOnlyUnverified(false);
            setPage(1);
          }}
          className={cn(
            'rounded-2xl border p-4 text-left transition-colors',
            roleFilter === 'student' && !onlyUnverified
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/70 bg-card hover:border-primary/40'
          )}
        >
          <p
            className={cn(
              'text-sm font-medium',
              roleFilter === 'student' && !onlyUnverified
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'
            )}
          >
            O&apos;quvchilar
          </p>
          <p className="mt-1 text-3xl font-bold">{formatNumber(studentStats?.total ?? 0)}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter('teacher');
            setOnlyUnverified(false);
            setPage(1);
          }}
          className={cn(
            'rounded-2xl border p-4 text-left transition-colors',
            roleFilter === 'teacher' && !onlyUnverified
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/70 bg-card hover:border-primary/40'
          )}
        >
          <p
            className={cn(
              'text-sm font-medium',
              roleFilter === 'teacher' && !onlyUnverified
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'
            )}
          >
            O&apos;qituvchilar
          </p>
          <p className="mt-1 text-3xl font-bold">{formatNumber(teacherStats?.total ?? 0)}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setOnlyUnverified(true);
            setPage(1);
          }}
          className={cn(
            'rounded-2xl border p-4 text-left transition-colors',
            onlyUnverified
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60'
          )}
        >
          <p
            className={cn(
              'text-sm font-medium',
              onlyUnverified ? 'text-white/80' : 'text-amber-700 dark:text-amber-400'
            )}
          >
            Tasdiqlanmagan
          </p>
          <p
            className={cn(
              'mt-1 text-3xl font-bold',
              onlyUnverified ? 'text-white' : 'text-amber-700 dark:text-amber-400'
            )}
          >
            {formatNumber(unverifiedStats?.total ?? 0)}
          </p>
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Ism, telefon (998...) yoki sinf"
            className="h-11 rounded-xl pl-10 text-base md:text-base"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter((v as 'all' | Role) ?? 'all');
            setPage(1);
          }}
          items={{ all: 'Barcha rollar', ...ROLE_LABELS }}
        >
          <SelectTrigger className="h-11 w-full rounded-xl text-base sm:w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha rollar</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={tarifFilter}
          onValueChange={(v) => {
            setTarifFilter((v as 'all' | Tarif) ?? 'all');
            setPage(1);
          }}
          items={{ all: 'Barcha tariflar', ...TARIF_LABELS }}
        >
          <SelectTrigger className="h-11 w-full rounded-xl text-base sm:w-40">
            <SelectValue placeholder="Tarif" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha tariflar</SelectItem>
            {TARIFS.map((t) => (
              <SelectItem key={t} value={t}>
                {TARIF_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-base font-semibold text-foreground">
            {selectedIds.size} ta tanlandi
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <Button
            variant="ghost"
            size="sm"
            className="text-base"
            onClick={handleBulkVerify}
            disabled={bulkPending}
          >
            <UserCheck className="size-4" /> Tasdiqlash
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-base"
            onClick={() => setBulkGradeOpen(true)}
            disabled={bulkPending}
          >
            <GraduationCap className="size-4" /> Sinfni o&apos;zgartirish
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-base text-destructive hover:text-destructive"
            onClick={handleBulkBlock}
            disabled={bulkPending}
          >
            <ShieldBan className="size-4" /> Bloklash
          </Button>
          {bulkPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-base text-muted-foreground"
            onClick={() => setSelectedIds(new Set())}
          >
            Bekor qilish
          </Button>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Users} title="Foydalanuvchi topilmadi" />
      ) : (
        <>
          <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-xs">
            <Table className="text-base">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 px-4">
                    <Checkbox
                      checked={allSelectedOnPage}
                      onCheckedChange={(c) => toggleSelectAllOnPage(c === true)}
                      aria-label="Barchasini tanlash"
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none px-4"
                    onClick={() => setNameSort((s) => (s === 'asc' ? 'desc' : 'asc'))}
                  >
                    <span className="inline-flex items-center gap-1">
                      Foydalanuvchi
                      {nameSort === 'asc' ? (
                        <ArrowUp className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ArrowDown className="size-3.5 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="px-4">Rol</TableHead>
                  <TableHead className="px-4">Sinf</TableHead>
                  <TableHead className="px-4">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => {
                  const status = !item.isVerified
                    ? 'unverified'
                    : item.isBlocked
                      ? 'blocked'
                      : item.tarif === 'premium'
                        ? 'premium'
                        : 'active';
                  return (
                    <TableRow
                      key={item._id}
                      onClick={() => openDetail(item._id)}
                      className="cursor-pointer hover:bg-muted/30"
                    >
                      <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(item._id)}
                          onCheckedChange={(c) => toggleSelect(item._id, c === true)}
                          aria-label={`${item.name}ni tanlash`}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="shadow-sm ring-2 ring-background">
                            <AvatarImage src={resolveAssetUrl(item.avatar)} alt={item.name} />
                            <AvatarFallback>{initials(item.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{item.name}</p>
                            <p className="truncate text-sm text-muted-foreground">{item.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          className={cn('rounded-full px-2.5 py-1', ROLE_BADGE_STYLES[item.role])}
                        >
                          {ROLE_LABELS[item.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {item.role === 'student' && item.grade?.number ? (
                          <span className="inline-flex items-center gap-1.5">
                            {item.grade.number}-{item.grade.letter ?? ''}
                            <span className="inline-flex items-center gap-0.5 text-sm">
                              <Image
                                src="/diamond.png"
                                alt=""
                                width={32}
                                height={32}
                                className="size-3.5"
                              />
                              {formatNumber(item.diamonds ?? 0)}
                            </span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {status === 'unverified' && (
                          <Badge className="gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-400">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Tasdiqlanmagan
                          </Badge>
                        )}
                        {status === 'blocked' && (
                          <Badge variant="destructive" className="gap-1.5 rounded-full px-2.5 py-1">
                            <span className="size-1.5 rounded-full bg-destructive" /> Bloklangan
                          </Badge>
                        )}
                        {status === 'premium' && (
                          <Badge className="gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-gold-foreground">
                            <span className="size-1.5 rounded-full bg-gold" /> Premium
                          </Badge>
                        )}
                        {status === 'active' && (
                          <Badge className="gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-success">
                            <span className="size-1.5 rounded-full bg-success" /> Faol
                          </Badge>
                        )}
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

      <Sheet open={!!detailUser} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tafsilot
            </SheetTitle>
          </SheetHeader>
          {detailUser && (
            <div className="flex flex-col gap-5 px-4 pb-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="relative">
                  <Avatar className="size-20 shadow-sm ring-2 ring-background">
                    <AvatarImage src={resolveAssetUrl(detailUser.avatar)} alt={detailUser.name} />
                    <AvatarFallback className="text-xl">{initials(detailUser.name)}</AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                    aria-label="Rasmni almashtirish"
                    className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background"
                  >
                    {uploadAvatar.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Camera className="size-3.5" />
                    )}
                  </button>
                </div>
                {detailUser.avatar && (
                  <button
                    type="button"
                    onClick={() => deleteAvatar.mutate(detailUser._id)}
                    disabled={deleteAvatar.isPending}
                    className="text-base text-muted-foreground hover:text-destructive"
                  >
                    Rasmni o&apos;chirish
                  </button>
                )}
                <div>
                  <p className="text-xl font-semibold text-foreground">{detailUser.name}</p>
                  <p className="text-base text-muted-foreground">{detailUser.phone}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {!detailUser.isVerified && (
                    <Badge className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      Tasdiqlanmagan
                    </Badge>
                  )}
                  {detailUser.isBlocked ? (
                    <Badge variant="destructive" className="rounded-full">
                      Bloklangan
                    </Badge>
                  ) : (
                    <Badge className="rounded-full bg-success/10 text-success">Faol</Badge>
                  )}
                  <Badge className="rounded-full bg-muted text-muted-foreground">
                    {TARIF_LABELS[detailUser.tarif ?? 'standart']}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {!detailUser.isVerified && (
                  <Button
                    onClick={() => verifyUser.mutate(detailUser._id)}
                    disabled={verifyUser.isPending}
                    className="col-span-2"
                  >
                    {verifyUser.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserCheck className="size-4" />
                    )}
                    Tasdiqlash
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={cn(detailUser.isVerified && 'col-span-2')}
                  onClick={() => setBlockTarget(detailUser)}
                  disabled={toggleBlock.isPending}
                >
                  {detailUser.isBlocked ? (
                    <>
                      <ShieldCheck className="size-4 text-success" /> Blokdan chiqarish
                    </>
                  ) : (
                    <>
                      <ShieldBan className="size-4 text-destructive" /> Bloklash
                    </>
                  )}
                </Button>
              </div>

              <div className="divide-y divide-border/70 rounded-xl border border-border/70">
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-base text-muted-foreground">Rol</span>
                  {editingRole ? (
                    <Select
                      value={detailUser.role}
                      onValueChange={(v) =>
                        updateUser.mutate(
                          { id: detailUser._id, role: v as Role },
                          { onSuccess: () => setEditingRole(false) }
                        )
                      }
                      items={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                    >
                      <SelectTrigger className="h-9 w-36 rounded-lg text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="flex items-center gap-2 text-base font-medium text-foreground">
                      {ROLE_LABELS[detailUser.role]}
                      {isSuperadmin && (
                        <button
                          type="button"
                          onClick={() => setEditingRole(true)}
                          className="text-base font-medium text-primary hover:underline"
                        >
                          o&apos;zgartirish
                        </button>
                      )}
                    </span>
                  )}
                </div>

                {detailUser.role === 'student' && (
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-base text-muted-foreground">Sinf</span>
                    {editingGrade ? (
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={tempGradeNumber}
                          onValueChange={(v) => setTempGradeNumber(v ?? '1')}
                          items={GRADE_NUMBERS.map((n) => ({ value: n, label: n }))}
                        >
                          <SelectTrigger className="h-9 w-16 rounded-lg text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_NUMBERS.map((n) => (
                              <SelectItem key={n} value={n}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={tempGradeLetter}
                          onValueChange={(v) => setTempGradeLetter(v ?? 'A')}
                          items={GRADE_LETTERS.map((l) => ({ value: l, label: l }))}
                        >
                          <SelectTrigger className="h-9 w-16 rounded-lg text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_LETTERS.map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={updateUser.isPending}
                          onClick={() =>
                            updateUser.mutate(
                              {
                                id: detailUser._id,
                                grade: {
                                  number: Number(tempGradeNumber),
                                  letter: tempGradeLetter,
                                },
                              },
                              { onSuccess: () => setEditingGrade(false) }
                            )
                          }
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setEditingGrade(false)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2 text-base font-medium text-foreground">
                        {detailUser.grade?.number
                          ? `${detailUser.grade.number}-${detailUser.grade.letter ?? ''}`
                          : '—'}
                        {isSuperadmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setTempGradeNumber(
                                detailUser.grade?.number ? String(detailUser.grade.number) : '1'
                              );
                              setTempGradeLetter(detailUser.grade?.letter ?? 'A');
                              setEditingGrade(true);
                            }}
                            className="text-base font-medium text-primary hover:underline"
                          >
                            o&apos;zgartirish
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-base text-muted-foreground">Olmos</span>
                  <span className="flex items-center gap-1 text-base font-medium text-foreground">
                    <Image src="/diamond.png" alt="" width={32} height={32} className="size-3.5" />
                    {formatNumber(detailUser.diamonds ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-base text-muted-foreground">Tarif</span>
                  <span className="text-base font-medium text-foreground">
                    {TARIF_LABELS[detailUser.tarif ?? 'standart']}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-base text-muted-foreground">
                    Ro&apos;yxatdan o&apos;tgan
                  </span>
                  <span className="text-base font-medium text-foreground">
                    {detailUser.createdAt ? formatDate(detailUser.createdAt) : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-base text-muted-foreground">Oxirgi kirish</span>
                  <span className="text-base font-medium text-foreground">
                    {detailUser.lastLogin
                      ? formatRelativeTime(detailUser.lastLogin)
                      : 'Hech qachon'}
                  </span>
                </div>
              </div>

              {isSuperadmin && (
                <div className="space-y-2 border-t border-border/70 pt-4 text-base">
                  <button
                    type="button"
                    onClick={() => openReset(detailUser)}
                    className="block font-medium text-primary hover:underline"
                  >
                    Parolni tiklash
                  </button>
                  {detailUser._id !== currentUser?._id && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(detailUser)}
                      className="block font-medium text-destructive hover:underline"
                    >
                      Hisobni o&apos;chirish · superadmin
                    </button>
                  )}
                </div>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && detailUser) {
                    uploadAvatar.mutate({ id: detailUser._id, file });
                  }
                  e.target.value = '';
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!blockTarget} onOpenChange={(open) => !open && setBlockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockTarget?.isBlocked
                ? `${blockTarget?.name}ni blokdan chiqarasizmi?`
                : `${blockTarget?.name}ni bloklaysizmi?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget?.isBlocked
                ? 'Foydalanuvchi tizimga qayta kira oladi.'
                : 'Foydalanuvchi tizimga kira olmay qoladi.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (blockTarget)
                  toggleBlock.mutate({ id: blockTarget._id, isBlocked: !blockTarget.isBlocked });
                setBlockTarget(null);
              }}
            >
              Tasdiqlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.name}ni butunlay o&apos;chirmoqchimisiz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni orqaga qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteUser.mutate(deleteTarget._id);
                setDeleteTarget(null);
                closeDetail();
              }}
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resetTarget?.name}ning parolini tiklash</DialogTitle>
            <DialogDescription className="text-base">
              Eski parol so&apos;ralmaydi — yangi parol to&apos;g&apos;ridan-to&apos;g&apos;ri
              o&apos;rnatiladi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-base text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Bu amaldan so&apos;ng foydalanuvchining barcha eski sessiyalari yaroqsiz bo&apos;ladi
              — u qayta tizimga kirishi kerak bo&apos;ladi.
            </p>
          </div>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-3">
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Yangi parol</FormLabel>
                    <FormControl>
                      <Input type="password" autoFocus className="h-11 md:text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={resetPassword.isPending}>
                  {resetPassword.isPending && <Loader2 className="size-4 animate-spin" />}
                  Parolni tiklash
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkGradeOpen} onOpenChange={setBulkGradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tanlangan o&apos;quvchilarning sinfini o&apos;zgartirish</DialogTitle>
            <DialogDescription className="text-base">
              Tanlanganlar orasida faqat o&apos;quvchi rolidagilarga qo&apos;llanadi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Select
              value={bulkGradeNumber}
              onValueChange={(v) => setBulkGradeNumber(v ?? '1')}
              items={GRADE_NUMBERS.map((n) => ({ value: n, label: n }))}
            >
              <SelectTrigger className="h-10 w-20 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADE_NUMBERS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={bulkGradeLetter}
              onValueChange={(v) => setBulkGradeLetter(v ?? 'A')}
              items={GRADE_LETTERS.map((l) => ({ value: l, label: l }))}
            >
              <SelectTrigger className="h-10 w-20 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LETTERS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleBulkGradeChange} disabled={bulkPending}>
              {bulkPending && <Loader2 className="size-4 animate-spin" />}
              Qo&apos;llash
            </Button>
          </DialogFooter>
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
            <DialogDescription className="text-base">
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
                    <FormLabel className="text-base font-medium">Ism</FormLabel>
                    <FormControl>
                      <Input className="h-11 rounded-md text-base md:text-base" {...field} />
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
                    <FormLabel className="text-base font-medium">Telefon</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11 rounded-md text-base md:text-base"
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
                    <FormLabel className="text-base font-medium">Parol</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="h-11 rounded-md text-base md:text-base"
                        {...field}
                      />
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
                      <FormLabel className="text-base font-medium">Rol</FormLabel>
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
                      <FormLabel className="text-base font-medium">Tarif</FormLabel>
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
                        <FormLabel className="text-base font-medium">Sinf</FormLabel>
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
                        <FormLabel className="text-base font-medium">Guruh</FormLabel>
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
