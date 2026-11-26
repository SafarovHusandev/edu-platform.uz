import { formatDate } from '@/lib/format';
import type { Attempt, Quiz, QuizTargetType, User } from '@/types';
import type { TgTone } from '@/components/tg/tg-ui';

export const TARGET_TYPE_LABELS: Record<QuizTargetType, string> = {
  standalone: 'Mustaqil',
  course: 'Kurs',
  lesson: 'Dars',
};

export function quizGradesLabel(quiz: Pick<Quiz, 'targetGrades'>) {
  const grades = quiz.targetGrades ?? [];
  if (grades.length === 0) return 'Sinf tanlanmagan';
  return grades.map((g) => (g.letter ? `${g.number}-${g.letter}` : `${g.number}-sinf`)).join(', ');
}

export function quizStatus(quiz: Quiz): { label: string; tone: TgTone } {
  if (!quiz.isActive) return { label: 'Qoralama', tone: 'neutral' };
  const from = quiz.availableFrom ? new Date(quiz.availableFrom) : null;
  if (from && from.getTime() > Date.now()) {
    return { label: `${formatDate(from).slice(0, 5)} da`, tone: 'warning' };
  }
  const until = quiz.availableUntil ? new Date(quiz.availableUntil) : null;
  if (until && until.getTime() < Date.now()) return { label: 'Yakunlangan', tone: 'neutral' };
  return { label: 'Faol', tone: 'success' };
}

export function attemptStudent(attempt: Attempt): User | null {
  return attempt.student && typeof attempt.student === 'object' ? (attempt.student as User) : null;
}

export function attemptStatus(attempt: Attempt): { label: string; tone: TgTone } {
  // Dizayn (TgTmResults): vaqt tugagani — qizil, o'tmagani — kulrang
  if (attempt.status === 'expired') return { label: 'Vaqt tugadi', tone: 'danger' };
  if (attempt.status === 'in_progress') return { label: 'Yechmoqda', tone: 'primary' };
  if (attempt.status === 'submitted') return { label: 'Tekshir', tone: 'warning' };
  return attempt.passed ? { label: "O'tdi", tone: 'success' } : { label: "O'tmadi", tone: 'neutral' };
}
