import { Shuffle, Timer, Trophy, Users, type LucideIcon } from 'lucide-react';
import type { Role } from '@/types';

// Super-ustoz bo'limiga kira oladigan rollar (proxy.ts bilan bir xil)
export const SUPER_TEACHER_ROLES: Role[] = ['teacher', 'admin', 'superadmin'];

export interface SuperTeacherModule {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path?: string;
  status: 'ready' | 'soon';
}

// Yangi modul qo'shish: shu massivga yozuv + app/(app)/super-teacher/<modul> route.
// Hub sahifasi o'zgarmaydi.
export const SUPER_TEACHER_MODULES: SuperTeacherModule[] = [
  {
    key: 'live-quiz',
    title: 'Jonli viktorina',
    description: "Doskada savol-javob o'yini, o'quvchilar telefondan qatnashadi",
    icon: Trophy,
    path: '/super-teacher/live-quiz',
    status: 'ready',
  },
  {
    key: 'random-picker',
    title: "Tasodifiy o'quvchi",
    description: 'Kim javob beradi?',
    icon: Shuffle,
    status: 'soon',
  },
  { key: 'timer', title: 'Taymer', description: 'Vazifa uchun vaqt', icon: Timer, status: 'soon' },
  {
    key: 'groups',
    title: "Guruhlarga bo'lish",
    description: "Sinfni jamoalarga bo'lish",
    icon: Users,
    status: 'soon',
  },
];
