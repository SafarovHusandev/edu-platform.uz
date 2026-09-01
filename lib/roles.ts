import type { Role } from '@/types';
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  Trophy,
  Gift,
  ScrollText,
  Wallet,
  Bell,
  CircleUserRound,
  Users,
  Tags,
  Tag,
  TicketPercent,
  BarChart3,
  Library,
  RotateCw,
  Crown,
  Receipt,
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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Bosh sahifa', href: '/admin', icon: LayoutDashboard },
  { label: 'Foydalanuvchilar', href: '/admin/users', icon: Users },
  { label: 'Kurslar', href: '/admin/courses', icon: GraduationCap },
  { label: 'Testlar', href: '/admin/quizzes', icon: ClipboardList },
  { label: 'Kategoriyalar', href: '/admin/categories', icon: Tags },
  { label: 'Kitob kategoriyalari', href: '/admin/book-categories', icon: Tag },
  { label: 'Mukofotlar', href: '/admin/rewards', icon: Gift },
  { label: 'Yutuqlar', href: '/admin/redemptions', icon: Trophy },
  { label: 'Promo kodlar', href: '/admin/promo-codes', icon: TicketPercent },
  { label: "To'lovlar", href: '/admin/payments', icon: Receipt },
];

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { label: 'Bosh sahifa', href: '/student', icon: LayoutDashboard },
    { label: 'Mening kurslarim', href: '/student/courses', icon: GraduationCap },
    { label: 'Testlar', href: '/student/quizzes', icon: ClipboardList },
    { label: 'Kutubxona', href: '/books', icon: Library },
    { label: 'Sertifikatlar', href: '/student/certificates', icon: ScrollText },
    { label: 'Mukofotlar', href: '/student/rewards', icon: Gift },
    { label: 'Kunlik barabon', href: '/student/daily-spin', icon: RotateCw },
    { label: 'Reyting', href: '/leaderboard', icon: Trophy },
    { label: 'Hamyon', href: '/student/wallet', icon: Wallet },
  ],
  teacher: [
    { label: 'Bosh sahifa', href: '/teacher', icon: LayoutDashboard },
    { label: 'Kurslarim', href: '/teacher/courses', icon: GraduationCap },
    { label: 'Testlar', href: '/teacher/quizzes', icon: ClipboardList },
    { label: 'Kitoblarim', href: '/teacher/books', icon: Library },
    { label: 'Mukofotlar', href: '/student/rewards', icon: Gift },
    { label: 'Statistika', href: '/teacher/stats', icon: BarChart3 },
  ],
  admin: ADMIN_NAV_ITEMS,
  superadmin: ADMIN_NAV_ITEMS,
};

export const COMMON_NAV_ITEMS: NavItem[] = [
  { label: 'Premium', href: '/premium', icon: Crown },
  { label: "To'lovlar tarixi", href: '/payments', icon: Receipt },
  { label: 'Bildirishnomalar', href: '/notifications', icon: Bell },
  { label: 'Profil', href: '/profile', icon: CircleUserRound },
];

export { GraduationCap };
