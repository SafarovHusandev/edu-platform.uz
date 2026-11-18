'use client';

import { use } from 'react';
import { BoardLessonEditor } from '@/components/board-lesson/board-lesson-editor';

// ?ai=1 — ro'yxatdagi "AI bilan yaratish" tugmasidan: AI oynasi darhol ochiladi
export default function NewBoardLessonPage({ searchParams }: { searchParams: Promise<{ ai?: string }> }) {
  const { ai } = use(searchParams);
  return <BoardLessonEditor autoOpenAi={ai === '1'} />;
}
