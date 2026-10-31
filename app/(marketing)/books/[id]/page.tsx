import { notFound } from 'next/navigation';
import { BookDetail, getBook, getSimilarBooks } from '@/components/books/book-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();
  const similar = await getSimilarBooks(book);
  return <BookDetail book={book} similar={similar} />;
}
