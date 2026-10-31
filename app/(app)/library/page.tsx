'use client';

import { Suspense } from 'react';
import { BooksCatalog } from '@/components/books/books-catalog';

// Dashboard ichidagi kutubxona (yon menyu bilan); ochiq versiyasi — /books
export default function LibraryPage() {
  return (
    <Suspense>
      <BooksCatalog basePath="/library" variant="app" />
    </Suspense>
  );
}
