import type { Role } from '@/types';
import {
  BarChart3,
  Bell,
  BookOpen,
  CircleUserRound,
  ClipboardList,
  Crown,
  FolderTree,
  Gift,
  GraduationCap,
  House,
  Inbox,
  LayoutDashboard,
  Library,
  PackageCheck,
  PenLine,
  Receipt,
  RotateCw,
  ScrollText,
  Share2,
  Tag,
  TicketPercent,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export const ROLE_LABELS: Record<Role, string> = {
  student: "O'quvchi",
  teacher: "O'qituvchi",
  admin: 'Administrator',
  superadmin: 'Bosh administrator',
};

export const ROLE_HOME: Record<Role, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
  superadmin: '/admin',
};

// Menyu bandi yonidagi son belgisi qaysi ma'lumotdan olinadi
// (components/layout/use-nav-badges.ts'da hisoblanadi).
export type NavBadgeKey =
  'notifications' | 'incomingShares' | 'pendingReviews' | 'pendingUsers' | 'pendingRedemptions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: NavBadgeKey;
  // Faqat shu manzilning o'zida faol bo'ladi (ichki sahifalarda emas)
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Foydalanuvchilar', href: '/admin/users', icon: Users, badge: 'pendingUsers' },
      { label: 'Kurslar', href: '/admin/courses', icon: GraduationCap },
      { label: 'Testlar', href: '/admin/quizzes', icon: ClipboardList },
      { label: 'Mukofotlar katalogi', href: '/admin/rewards', icon: Gift },
      {
        label: "Mukofot so'rovlari",
        href: '/admin/redemptions',
        icon: PackageCheck,
        badge: 'pendingRedemptions',
      },
      { label: 'Kategoriyalar', href: '/admin/categories', icon: FolderTree },
      { label: 'Kitob kategoriyalari', href: '/admin/book-categories', icon: Tag },
      { label: "To'lovlar", href: '/admin/payments', icon: Receipt },
      { label: 'Promokodlar', href: '/admin/promo-codes', icon: TicketPercent },
    ],
  },
  {
    label: 'Hisob',
    items: [
      { label: 'Reyting', href: '/leaderboard', icon: Trophy },
      { label: 'Bildirishnomalar', href: '/notifications', icon: Bell, badge: 'notifications' },
      { label: 'Profil', href: '/profile', icon: CircleUserRound },
    ],
  },
];

export const NAV_GROUPS: Record<Role, NavGroup[]> = {
  student: [
    {
      items: [
        { label: 'Asosiy', href: '/student', icon: House, exact: true },
        { label: 'Kurslarim', href: '/student/courses', icon: GraduationCap },
        { label: 'Testlar', href: '/student/quizzes', icon: ClipboardList },
        { label: 'Kutubxona', href: '/library', icon: Library },
        { label: 'Sertifikatlar', href: '/student/certificates', icon: ScrollText },
      ],
    },
    {
      label: 'Olmos va mukofotlar',
      items: [
        { label: 'Kunlik baraban', href: '/student/daily-spin', icon: RotateCw },
        // /student/rewards/redemptions (so'rovlarim) ham shu band ostida
        { label: 'Mukofotlar', href: '/student/rewards', icon: Gift },
        { label: 'Reyting', href: '/leaderboard', icon: Trophy },
      ],
    },
    {
      label: 'Hisob',
      items: [
        // To'lovlar tarixi hamyon sahifasida
        { label: 'Hamyon', href: '/student/wallet', icon: Wallet },
        { label: 'Premium', href: '/premium', icon: Crown },
      ],
    },
  ],
  teacher: [
    {
      items: [
        { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard, exact: true },
        { label: 'Kurslarim', href: '/teacher/courses', icon: GraduationCap },
        { label: 'Testlarim', href: '/teacher/quizzes', icon: ClipboardList },
        {
          label: 'Ulashilgan testlar',
          href: '/teacher/quiz-shares',
          icon: Share2,
          badge: 'incomingShares',
        },
        { label: 'Baholash', href: '/teacher/grading', icon: PenLine, badge: 'pendingReviews' },
        { label: 'Kitoblarim', href: '/teacher/books', icon: BookOpen },
        { label: 'Statistika', href: '/teacher/stats', icon: BarChart3 },
        { label: 'Reyting', href: '/leaderboard', icon: Trophy },
        { label: 'Mukofotlar', href: '/student/rewards', icon: Gift },
      ],
    },
    {
      label: 'Hisob',
      items: [
        { label: 'Premium', href: '/premium', icon: Crown },
        { label: "To'lovlar tarixi", href: '/payments', icon: Receipt },
      ],
    },
  ],
  admin: ADMIN_NAV,
  superadmin: ADMIN_NAV,
};

// Mobil pastki menyu (o'quvchi va o'qituvchi). Admin uchun faqat yon panel.
export const MOBILE_NAV: Partial<Record<Role, NavItem[]>> = {
  student: [
    { label: 'Asosiy', href: '/student', icon: House, exact: true },
    { label: 'Kurslar', href: '/student/courses', icon: GraduationCap },
    { label: 'Testlar', href: '/student/quizzes', icon: ClipboardList },
    { label: 'Mukofot', href: '/student/rewards', icon: Gift },
    { label: 'Profil', href: '/profile', icon: CircleUserRound },
  ],
  teacher: [
    { label: 'Asosiy', href: '/teacher', icon: LayoutDashboard, exact: true },
    { label: 'Testlar', href: '/teacher/quizzes', icon: ClipboardList, badge: 'incomingShares' },
    { label: 'Baholash', href: '/teacher/grading', icon: PenLine, badge: 'pendingReviews' },
    { label: 'Kurslar', href: '/teacher/courses', icon: GraduationCap },
    { label: 'Profil', href: '/profile', icon: CircleUserRound },
  ],
};

export function isNavItemActive(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// Yon menyuda yo'q, lekin header'da sarlavhasi ko'rinishi kerak bo'lgan sahifalar
// (bildirishnoma va profil — header'dagi qo'ng'iroq va foydalanuvchi menyusida).
const HEADER_ONLY_ITEMS: NavItem[] = [
  { label: 'Bildirishnomalar', href: '/notifications', icon: Bell },
  { label: 'Profil', href: '/profile', icon: CircleUserRound },
  { label: "To'lovlar tarixi", href: '/payments', icon: Receipt },
  { label: "So'rovlarim", href: '/student/rewards/redemptions', icon: Inbox },
];

// Header'da joriy bo'lim nomini ko'rsatish uchun: eng uzun mos keladigan band
export function findActiveNavItem(role: Role, pathname: string) {
  const items = [...NAV_GROUPS[role].flatMap((group) => group.items), ...HEADER_ONLY_ITEMS];
  return items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
