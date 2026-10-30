'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, GraduationCap, Presentation, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AuthTabs } from '@/components/auth/auth-tabs';
import { cn } from '@/lib/utils';
import { useRegister } from '@/hooks/use-auth';

const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1));
const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const ROLE_OPTIONS = [
  { value: 'student', label: "O'quvchi", hint: 'Darslar va testlar', icon: GraduationCap },
  { value: 'teacher', label: "O'qituvchi", hint: 'Kurs va test yaratish', icon: Presentation },
] as const;

const schema = z
  .object({
    name: z.string().min(2, { error: "Ism kamida 2 ta belgidan iborat bo'lsin" }),
    phone: z
      .string()
      .length(9, { error: "Telefon raqamni to'liq kiriting" })
      .regex(/^[0-9]{9}$/, { error: "Faqat raqamlardan iborat bo'lsin" }),
    password: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
    role: z.enum(['student', 'teacher']),
    gradeNumber: z.string().optional(),
    gradeLetter: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'student') {
      if (!data.gradeNumber) {
        ctx.addIssue({ code: 'custom', path: ['gradeNumber'], message: 'Sinf raqamini tanlang' });
      }
      if (!data.gradeLetter) {
        ctx.addIssue({ code: 'custom', path: ['gradeLetter'], message: 'Guruh harfini tanlang' });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      role: 'student',
      gradeNumber: '',
      gradeLetter: '',
    },
  });

  const role = form.watch('role');

  function onSubmit(values: FormValues) {
    register.mutate(
      {
        name: values.name,
        phone: `998${values.phone}`,
        password: values.password,
        role: values.role,
        grade:
          values.role === 'student'
            ? { number: Number(values.gradeNumber), letter: values.gradeLetter! }
            : undefined,
      },
      { onSuccess: () => router.push('/register/pending') }
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTabs active="register" />

      <div>
        <h2 className="font-heading text-[28px] font-bold">Hisob yaratish</h2>
        <p className="mt-1 text-secondary-foreground">
          Ro&apos;yxatdan o&apos;tgach, admin hisobingizni tasdiqlaydi.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kim sifatida qo&apos;shilasiz?</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLE_OPTIONS.map((option) => {
                      const selected = field.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            'flex items-center gap-3 rounded-[14px] border-[1.5px] p-3 text-left transition-colors',
                            selected
                              ? 'border-primary bg-primary-soft'
                              : 'border-border bg-card hover:bg-muted'
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-[10px]',
                              selected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            <option.icon className="size-4.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold">{option.label}</span>
                            <span className="block text-xs text-muted-foreground">
                              {option.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ism familiya</FormLabel>
                <FormControl>
                  <Input placeholder="Masalan: Ali Valiyev" autoComplete="name" {...field} />
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
                <FormLabel>Telefon raqam</FormLabel>
                <FormControl>
                  <PhoneInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parol</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Kamida 6 ta belgi"
                      autoComplete="new-password"
                      {...field}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {role === 'student' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="gradeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sinf</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
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
                    <FormLabel>Guruh</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Harf" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADE_LETTERS.map((l) => (
                          <SelectItem key={l} value={l}>
                            &quot;{l}&quot; guruhi
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

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={register.isPending}>
            {register.isPending ? <Loader2 className="size-5 animate-spin" /> : "Ro'yxatdan o'tish"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
