'use client';

import { use, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  Camera,
  KeyRound,
  Loader2,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusPill } from '@/components/dashboard/dashboard-ui';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import {
  useAdminDeleteAvatar,
  useAdminUploadAvatar,
  useDeleteUser,
  useResetUserPassword,
  useToggleUserBlock,
  useUpdateUser,
  useUser,
  useVerifyUser,
  type AdminUpdateUserPayload,
} from '@/hooks/use-users';
import { ApiError } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/config';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPrice,
  formatRelativeTime,
  initials,
} from '@/lib/format';
import { ROLE_LABELS } from '@/lib/roles';
import { useAuthStore } from '@/store/auth-store';
import type { Role, Tarif, User } from '@/types';

const ROLES: Role[] = ['student', 'teacher', 'admin', 'superadmin'];
const TARIFS: Tarif[] = ['standart', 'premium'];
const TARIF_LABELS: Record<Tarif, string> = { standart: 'Standart', premium: 'Premium' };
const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1));
const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function gradeLabel(user: User) {
  return user.grade?.number ? `${user.grade.number}-${user.grade.letter ?? ''}` : '—';
}

const userEditSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: 'Kamida 2 ta belgi' })
      .max(50, { error: "Ko'pi bilan 50 ta belgi" }),
    phone: z.string().trim().min(5, { error: 'Telefon raqamni kiriting' }),
    role: z.enum(ROLES as [Role, ...Role[]]),
    tarif: z.enum(TARIFS as [Tarif, ...Tarif[]]),
    gradeNumber: z.string(),
    gradeLetter: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.role === 'student' && values.gradeNumber && !values.gradeLetter) {
      ctx.addIssue({ code: 'custom', path: ['gradeLetter'], message: 'Harfni tanlang' });
    }
  });

type UserEditValues = z.infer<typeof userEditSchema>;

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// Tahrirlash faqat bosh admin uchun (PATCH /users/:id)
function UserEditForm({ user, isSelf }: { user: User; isSelf: boolean }) {
  const updateUser = useUpdateUser();
  const form = useForm<UserEditValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone,
      role: user.role,
      tarif: user.tarif ?? 'standart',
      gradeNumber: user.grade?.number ? String(user.grade.number) : '',
      gradeLetter: user.grade?.letter ?? '',
    },
  });
  const role = form.watch('role');

  function onSubmit(values: UserEditValues) {
    // Faqat o'zgargan maydonlar yuboriladi (masalan, telefon band tekshiruviga tushmasin)
    const payload: AdminUpdateUserPayload = { id: user._id };
    const { dirtyFields } = form.formState;
    if (dirtyFields.name) payload.name = values.name;
    if (dirtyFields.phone) payload.phone = values.phone;
    if (dirtyFields.role) payload.role = values.role;
    if (dirtyFields.tarif) payload.tarif = values.tarif;
    if (
      values.role === 'student' &&
      values.gradeNumber &&
      (dirtyFields.gradeNumber || dirtyFields.gradeLetter)
    ) {
      payload.grade = { number: Number(values.gradeNumber), letter: values.gradeLetter };
    }
    updateUser.mutate(payload);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ism</FormLabel>
                <FormControl>
                  <Input className="h-11" {...field} />
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
                  <Input className="h-11" placeholder="998901234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={ROLE_LABELS}
                  disabled={isSelf}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {ROLE_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSelf && (
                  <p className="text-[13px] text-muted-foreground">
                    O&apos;z rolingizni o&apos;zgartirib bo&apos;lmaydi
                  </p>
                )}
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
                <Select value={field.value} onValueChange={field.onChange} items={TARIF_LABELS}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TARIFS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {TARIF_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {role === 'student' && (
            <>
              <FormField
                control={form.control}
                name="gradeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sinf</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? '')}
                      items={GRADE_NUMBERS.map((n) => ({ value: n, label: `${n}-sinf` }))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder="Sinfni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
              <FormField
                control={form.control}
                name="gradeLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sinf harfi</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? '')}
                      items={GRADE_LETTERS.map((l) => ({ value: l, label: l }))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder="Harfni tanlang" />
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
            </>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={!form.formState.isDirty || updateUser.isPending}
          >
            {updateUser.isPending && <Loader2 className="size-4 animate-spin" />}
            Saqlash
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const resetPassword = useResetUserPassword();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.name}ning parolini tiklash</DialogTitle>
          <DialogDescription>
            Eski parol so&apos;ralmaydi — yangi parol to&apos;g&apos;ridan-to&apos;g&apos;ri
            o&apos;rnatiladi.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 rounded-lg bg-gold-soft px-3.5 py-2.5 text-sm text-gold-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Bu amaldan so&apos;ng foydalanuvchining barcha eski sessiyalari yaroqsiz bo&apos;ladi.
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              resetPassword.mutate(
                { id: user._id, newPassword: values.newPassword },
                { onSuccess: onClose }
              )
            )}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yangi parol</FormLabel>
                  <FormControl>
                    <Input type="password" autoFocus className="h-11" {...field} />
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
  );
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperadmin = currentUser?.role === 'superadmin';
  const isSelf = currentUser?._id === id;

  const { data: user, isLoading, isError, error, refetch } = useUser(id);
  const verifyUser = useVerifyUser();
  const toggleBlock = useToggleUserBlock();
  const deleteUser = useDeleteUser();
  const uploadAvatar = useAdminUploadAvatar();
  const deleteAvatar = useAdminDeleteAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [blockOpen, setBlockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const listCrumb = { label: 'Foydalanuvchilar', href: '/admin/users' };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="h-40 animate-pulse rounded-[20px] bg-muted" />
        <div className="h-80 animate-pulse rounded-[20px] bg-muted" />
      </div>
    );
  }

  if (isError || !user) {
    const notFound = !user && (!isError || (error instanceof ApiError && error.status === 404));
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Foydalanuvchi" breadcrumbs={[listCrumb, { label: 'Tafsilot' }]} />
        {notFound ? (
          <EmptyState icon={UserX} title="Foydalanuvchi topilmadi" />
        ) : (
          <ErrorState onRetry={() => refetch()} />
        )}
      </div>
    );
  }

  const verifiedBy = typeof user.verifiedBy === 'object' ? user.verifiedBy?.name : null;
  const details = [
    { label: 'Olmos', value: formatNumber(user.diamonds ?? 0), diamond: true },
    { label: 'Balans', value: formatPrice(user.balance ?? 0) },
    { label: 'Sinf', value: gradeLabel(user) },
    {
      label: 'Telegram',
      value: user.telegramUsername
        ? `@${user.telegramUsername}`
        : user.telegramId
          ? 'Ulangan'
          : 'Ulanmagan',
    },
    {
      label: 'Premium muddati',
      value:
        user.tarif === 'premium' && user.premiumExpiresAt ? formatDate(user.premiumExpiresAt) : '—',
    },
    { label: "Ro'yxatdan o'tgan", value: user.createdAt ? formatDate(user.createdAt) : '—' },
    {
      label: 'Oxirgi faollik',
      value: user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Hali kirmagan',
    },
    {
      label: 'Tasdiqlangan',
      value: user.verifiedAt
        ? `${formatDateTime(user.verifiedAt)}${verifiedBy ? ` · ${verifiedBy}` : ''}`
        : user.isVerified
          ? 'Ha'
          : "Yo'q",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title={user.name} breadcrumbs={[listCrumb, { label: user.name }]} />

      <section className="mb-5 flex flex-wrap items-center gap-4 rounded-[20px] border border-border bg-card p-5">
        <div className="relative shrink-0">
          <Avatar className="size-20">
            <AvatarImage src={resolveAssetUrl(user.avatar)} alt={user.name} />
            <AvatarFallback className="text-xl font-bold">{initials(user.name)}</AvatarFallback>
          </Avatar>
          {isSuperadmin && (
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              aria-label="Rasmni almashtirish"
              className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-card"
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1.5">
          <p className="wrap-break-word text-muted-foreground">{user.phone}</p>
          <div className="flex flex-wrap gap-1.5">
            <StatusPill tone="primary">{ROLE_LABELS[user.role]}</StatusPill>
            <StatusPill tone={user.tarif === 'premium' ? 'warning' : 'neutral'}>
              {TARIF_LABELS[user.tarif ?? 'standart']}
            </StatusPill>
            {user.isBlocked ? (
              <StatusPill tone="danger">Bloklangan</StatusPill>
            ) : user.isVerified ? (
              <StatusPill tone="success">Faol</StatusPill>
            ) : (
              <StatusPill tone="warning">Tasdiqlanmagan</StatusPill>
            )}
          </div>
          {isSuperadmin && user.avatar && (
            <button
              type="button"
              onClick={() => deleteAvatar.mutate(user._id)}
              disabled={deleteAvatar.isPending}
              className="self-start text-sm text-muted-foreground hover:text-destructive"
            >
              Rasmni o&apos;chirish
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!user.isVerified && (
            <Button onClick={() => verifyUser.mutate(user._id)} disabled={verifyUser.isPending}>
              {verifyUser.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserCheck className="size-4" />
              )}
              Tasdiqlash
            </Button>
          )}
          {!isSelf && (
            <Button variant="outline" onClick={() => setBlockOpen(true)}>
              {user.isBlocked ? (
                <ShieldCheck className="size-4" />
              ) : (
                <ShieldBan className="size-4" />
              )}
              {user.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
            </Button>
          )}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {isSuperadmin ? (
            <section className="rounded-[20px] border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-bold">Ma&apos;lumotlarni tahrirlash</h2>
              {/* key: saqlangach forma serverdagi yangi qiymatlar bilan qayta ochiladi */}
              <UserEditForm key={user.updatedAt ?? user._id} user={user} isSelf={isSelf} />
            </section>
          ) : (
            <p className="rounded-[20px] border border-border bg-card p-5 text-muted-foreground">
              Foydalanuvchi ma&apos;lumotlarini faqat bosh admin tahrirlay oladi.
            </p>
          )}

          {isSuperadmin && (
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border bg-card p-5">
              <div>
                <h2 className="font-bold">Xavfsizlik</h2>
                <p className="text-sm text-muted-foreground">
                  Parolni tiklash yoki hisobni o&apos;chirish
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setResetOpen(true)}>
                  <KeyRound className="size-4" /> Parolni tiklash
                </Button>
                {!isSelf && (
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4" /> O&apos;chirish
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>

        <section className="rounded-[20px] border border-border bg-card p-5">
          <h2 className="mb-2 text-lg font-bold">Ma&apos;lumotlar</h2>
          <dl className="divide-y divide-muted">
            {details.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-sm text-muted-foreground">{item.label}</dt>
                <dd className="flex min-w-0 items-center gap-1 text-right font-semibold wrap-anywhere">
                  {item.diamond && <DiamondIcon className="size-4" />}
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadAvatar.mutate({ id: user._id, file });
          e.target.value = '';
        }}
      />

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isBlocked
                ? `${user.name}ni blokdan chiqarasizmi?`
                : `${user.name}ni bloklaysizmi?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isBlocked
                ? 'Foydalanuvchi tizimga qayta kira oladi.'
                : 'Foydalanuvchi tizimga kira olmay qoladi.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleBlock.mutate({ id: user._id, isBlocked: !user.isBlocked })}
            >
              Tasdiqlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{user.name}ni butunlay o&apos;chirmoqchimisiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni orqaga qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleteUser.mutate(user._id, { onSuccess: () => router.push('/admin/users') })
              }
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {resetOpen && <ResetPasswordDialog user={user} onClose={() => setResetOpen(false)} />}
    </div>
  );
}
