'use client';

import { Suspense } from 'react';
import { BooksCatalog } from '@/components/books/books-catalog';

export default function BooksPage() {
  return (
    <Suspense>
      <BooksCatalog />
    </Suspense>
  );
}
