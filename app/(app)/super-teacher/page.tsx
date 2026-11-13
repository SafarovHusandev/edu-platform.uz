import type { Metadata } from 'next';
import { SuperTeacherHub } from '@/components/super-teacher/super-teacher-hub';

export const metadata: Metadata = { title: 'Super-ustoz' };

export default function SuperTeacherPage() {
  return <SuperTeacherHub />;
}
