import { Presentation, Shuffle, Timer, Trophy, Users, type LucideIcon } from 'lucide-react';
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

// Yangi modul qo'shish: shu massivga yozuv + app/(app)/super-teacher/<modul> route
// (doska rejimidagi asboblar — app/(board)/super-teacher/<modul>).
// Hub sahifasi o'zgarmaydi.
export const SUPER_TEACHER_MODULES: SuperTeacherModule[] = [
  {
    key: 'lessons',
    title: 'Interaktiv dars',
    description: "Mavzuni rangli slaydlarda tushuntirish va doskada mashq bilan mustahkamlash",
    icon: Presentation,
    path: '/super-teacher/lessons',
    status: 'ready',
  },
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
    path: '/super-teacher/random-picker',
    status: 'ready',
  },
  {
    key: 'timer',
    title: 'Taymer',
    description: 'Vazifa uchun vaqt, tugaganda ovozli signal',
    icon: Timer,
    path: '/super-teacher/timer',
    status: 'ready',
  },
  {
    key: 'groups',
    title: "Guruhlarga bo'lish",
    description: "Sinfni jamoalarga bo'lish",
    icon: Users,
    path: '/super-teacher/groups',
    status: 'ready',
  },
];
