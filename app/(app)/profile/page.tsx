'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  Crown,
  KeyRound,
  Loader2,
  Send,
  LogOut,
  Unlink,
  Wallet,
} from 'lucide-react';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/store/auth-store';
import {
  useChangePassword,
  useLinkTelegram,
  useUnlinkTelegram,
  useUpdateProfile,
  useUploadAvatar,
} from '@/hooks/use-users';
import { refreshCurrentUser, useLogout } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api-client';
import { ROLE_LABELS } from '@/lib/roles';
import { resolveAssetUrl, TELEGRAM_BOT_USERNAME } from '@/lib/config';
import { daysUntil, formatDate, formatNumber, formatPrice, initials } from '@/lib/format';

const TELEGRAM_POLL_INTERVAL_MS = 2500;
const TELEGRAM_POLL_TIMEOUT_MS = 60_000;

const setPasswordSchema = z
  .object({
    newPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
    confirmPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  });

const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1));
const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const nameSchema = z.object({
  name: z.string().trim().min(2, { error: "Ism kamida 2 ta belgidan iborat bo'lsin" }),
});

const gradeSchema = z.object({
  gradeNumber: z.string().min(1, { error: 'Sinf raqamini tanlang' }),
  gradeLetter: z.string().min(1, { error: 'Guruh harfini tanlang' }),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
    newPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
    confirmPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  });

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const linkTelegram = useLinkTelegram();
  const unlinkTelegram = useUnlinkTelegram();
  const logout = useLogout();

  // Backend PATCH /users/me'da o'quvchi yuborgan "name"ni jimgina e'tiborsiz
  // qoldiradi — shu sabab o'quvchi faqat sinfini, qolgan rollar esa ismini tahrirlaydi.
  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    values: { name: user?.name ?? '' },
  });

  const gradeForm = useForm<z.infer<typeof gradeSchema>>({
    resolver: zodResolver(gradeSchema),
    values: {
      gradeNumber: user?.grade?.number != null ? String(user.grade.number) : '',
      gradeLetter: user?.grade?.letter ?? '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const setPasswordForm = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const [telegramState, setTelegramState] = useState<'idle' | 'waiting' | 'timeout'>('idle');
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopTelegramPolling() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollIntervalRef.current = null;
    pollTimeoutRef.current = null;
  }

  useEffect(() => stopTelegramPolling, []);

  function handleLinkTelegram() {
    linkTelegram.mutate(undefined, {
      onSuccess: ({ token, deepLink }) => {
        const finalLink = deepLink ?? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;
        window.open(finalLink, '_blank');

        stopTelegramPolling();
        setTelegramState('waiting');
        pollIntervalRef.current = setInterval(async () => {
          await refreshCurrentUser();
          if (useAuthStore.getState().user?.telegramId) {
            stopTelegramPolling();
            setTelegramState('idle');
            toast.success('Telegram muvaffaqiyatli ulandi!');
          }
        }, TELEGRAM_POLL_INTERVAL_MS);
        pollTimeoutRef.current = setTimeout(() => {
          stopTelegramPolling();
          setTelegramState((s) => (s === 'waiting' ? 'timeout' : s));
        }, TELEGRAM_POLL_TIMEOUT_MS);
      },
    });
  }

  function handleUnlinkTelegram() {
    unlinkTelegram.mutate(undefined, {
      onError: (error) => {
        if (error instanceof ApiError && error.message.includes("parol o'rnating")) {
          setSetPasswordOpen(true);
        }
      },
    });
  }

  if (!user) return null;

  const isStudent = user.role === 'student';
  const isPremium = user.tarif === 'premium';
  const premiumDaysLeft = user.premiumExpiresAt ? daysUntil(user.premiumExpiresAt) : null;
  const gradeNumberError = gradeForm.formState.errors.gradeNumber?.message;
  const gradeLetterError = gradeForm.formState.errors.gradeLetter?.message;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Profil" />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-border bg-card p-5 sm:p-6">
          {/* Avatar va asosiy ma'lumot */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Profil rasmini o'zgartirish"
            >
              <Avatar className="size-20">
                <AvatarImage src={resolveAssetUrl(user.avatar)} alt={user.name} />
                <AvatarFallback className="bg-primary font-heading text-2xl font-bold text-primary-foreground">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold wrap-break-word">{user.name}</div>
              <div className="text-muted-foreground">
                +{user.phone} · {ROLE_LABELS[user.role]}
                {isPremium && (
                  <>
                    {' · '}
                    <Link href="/premium" className="font-bold text-gold-foreground">
                      Premium
                      {user.premiumExpiresAt ? ` · ${formatDate(user.premiumExpiresAt)} gacha` : ''}
                    </Link>
                  </>
                )}
              </div>
              {isPremium && premiumDaysLeft !== null && premiumDaysLeft <= 5 && (
                <Link
                  href="/premium"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-foreground hover:underline"
                >
                  <Crown className="size-4" />
                  Muddat{' '}
                  {premiumDaysLeft <= 0 ? 'tugadi' : `${premiumDaysLeft} kundan keyin tugaydi`} —
                  uzaytiring
                </Link>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              Avatar yuklash
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar.mutate(file);
                e.target.value = '';
              }}
            />
          </div>

          {isStudent && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gold-soft px-4 py-3">
                <p className="flex items-center gap-1.5 font-heading text-xl font-bold text-gold-foreground">
                  <DiamondIcon className="size-5" /> {formatNumber(user.diamonds ?? 0)}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">Olmoslar</p>
              </div>
              <Link href="/student/wallet" className="rounded-xl bg-primary-soft px-4 py-3">
                <p className="flex items-center gap-1.5 font-heading text-xl font-bold text-primary">
                  <Wallet className="size-5" /> {formatPrice(user.balance ?? 0)}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">Hamyon</p>
              </Link>
            </div>
          )}

          {/* Shaxsiy ma'lumotlar */}
          {isStudent ? (
            <Form {...gradeForm}>
              <form
                onSubmit={gradeForm.handleSubmit((values) =>
                  updateProfile.mutate({
                    grade: { number: Number(values.gradeNumber), letter: values.gradeLetter },
                  })
                )}
                className="flex flex-col gap-4"
              >
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-name" className="text-sm font-semibold">
                      Ism familiya
                    </label>
                    <Input id="profile-name" value={user.name} readOnly disabled className="h-11" />
                    <span className="text-xs text-muted-foreground">
                      Ismni faqat o&apos;qituvchi yoki administrator o&apos;zgartira oladi.
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold">Sinf</span>
                    <div className="flex gap-2">
                      <FormField
                        control={gradeForm.control}
                        name="gradeNumber"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(v) => field.onChange(v ?? '')}
                          >
                            <SelectTrigger className="h-11 w-full" aria-label="Sinf raqami">
                              <SelectValue placeholder="Sinf" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_NUMBERS.map((n) => (
                                <SelectItem key={n} value={n}>
                                  {n}-sinf
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FormField
                        control={gradeForm.control}
                        name="gradeLetter"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(v) => field.onChange(v ?? '')}
                          >
                            <SelectTrigger className="h-11 w-full" aria-label="Sinf harfi">
                              <SelectValue placeholder="Harf" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_LETTERS.map((l) => (
                                <SelectItem key={l} value={l}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {(gradeNumberError || gradeLetterError) && (
                      <span className="text-xs text-destructive">
                        {gradeNumberError ?? gradeLetterError}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-11 self-start px-5"
                  disabled={updateProfile.isPending || !gradeForm.formState.isDirty}
                >
                  {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                  Saqlash
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...nameForm}>
              <form
                onSubmit={nameForm.handleSubmit((values) =>
                  updateProfile.mutate({ name: values.name })
                )}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={nameForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:max-w-md">
                      <FormLabel className="font-semibold">Ism familiya</FormLabel>
                      <FormControl>
                        <Input className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="h-11 self-start px-5"
                  disabled={updateProfile.isPending || !nameForm.formState.isDirty}
                >
                  {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                  Saqlash
                </Button>
              </form>
            </Form>
          )}

          <div className="h-px bg-border" />

          {/* Parol */}
          <h2 className="font-bold">Parolni o&apos;zgartirish</h2>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit((values) => {
                changePassword.mutate(
                  { oldPassword: values.oldPassword, newPassword: values.newPassword },
                  { onSuccess: () => passwordForm.reset() }
                );
              })}
              className="flex flex-col gap-4"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={passwordForm.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Joriy parol</FormLabel>
                      <FormControl>
                        <Input type="password" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Yangi parol</FormLabel>
                      <FormControl>
                        <Input type="password" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Takrorlang</FormLabel>
                      <FormControl>
                        <Input type="password" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="h-11 self-start px-5"
                disabled={changePassword.isPending}
              >
                {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
                Parolni yangilash
              </Button>
            </form>
          </Form>
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="flex flex-col items-center gap-3 rounded-[20px] border border-border bg-card p-5 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Send className="size-6" />
            </span>
            <h2 className="font-bold">Telegram</h2>
            {user.telegramId ? (
              <>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
                  <CheckCircle2 className="size-4" />
                  Ulangan{user.telegramUsername ? ` · @${user.telegramUsername}` : ''}
                </span>
                <span className="text-sm text-muted-foreground">
                  Barcha bildirishnomalar Telegram botga ham keladi.
                </span>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="outline" className="w-full" />}>
                    <Unlink className="size-4" /> Uzish
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Telegramni uzasizmi?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Telegram orqali bildirishnomalar kelmay qo&apos;yadi. Davom etasizmi?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                      <AlertDialogAction onClick={handleUnlinkTelegram}>Uzish</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : telegramState === 'waiting' ? (
              <>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Botda ulanishni yakunlang — bu yerda avtomatik yangilanadi
                </span>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    stopTelegramPolling();
                    setTelegramState('idle');
                  }}
                >
                  Bekor qilish
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">
                  {telegramState === 'timeout'
                    ? "Ulanmadi, qayta urinib ko'ring."
                    : "Ulasangiz, to'lov, test natijasi va mukofot xabarlari Telegram botga ham keladi."}
                </span>
                <Button
                  className="w-full"
                  onClick={handleLinkTelegram}
                  disabled={linkTelegram.isPending}
                >
                  {linkTelegram.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {telegramState === 'timeout' ? 'Qayta urinish' : 'Telegramni ulash'}
                </Button>
              </>
            )}
          </section>

          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex items-center justify-center gap-2 rounded-[14px] border border-destructive/35 bg-card p-3.5 font-bold text-destructive transition-colors hover:bg-destructive-soft"
          >
            <LogOut className="size-4" /> Hisobdan chiqish
          </button>
        </div>
      </div>

      <Dialog open={setPasswordOpen} onOpenChange={setSetPasswordOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <KeyRound className="size-4.5" />
              </span>
              Parol o&apos;rnating
            </DialogTitle>
            <DialogDescription className="text-sm">
              Telegram orqali ro&apos;yxatdan o&apos;tgansiz, sizda hali parol yo&apos;q. Telegramni
              uzishdan oldin parol o&apos;rnating — aks holda hisobingizga kira olmay qolasiz.
            </DialogDescription>
          </DialogHeader>
          <Form {...setPasswordForm}>
            <form
              onSubmit={setPasswordForm.handleSubmit((values) => {
                changePassword.mutate(
                  { newPassword: values.newPassword },
                  {
                    onSuccess: () => {
                      setPasswordForm.reset();
                      setSetPasswordOpen(false);
                      toast.success("Parol o'rnatildi. Endi Telegramni uzishingiz mumkin");
                    },
                  }
                );
              })}
              className="space-y-4"
            >
              <FormField
                control={setPasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Yangi parol</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-11 rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={setPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Parolni tasdiqlang</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-11 rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 rounded-md px-6 text-base"
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
                  Parolni o&apos;rnatish
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
