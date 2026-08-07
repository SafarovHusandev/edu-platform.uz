import Link from 'next/link';
import { ArrowRight, ArrowUpRight, FolderOpen } from 'lucide-react';
import { Hero } from '@/components/marketing/hero';
import { RoleShowcase } from '@/components/marketing/role-showcase';
import { GamificationSection } from '@/components/marketing/gamification-section';
import { CtaSection } from '@/components/marketing/cta-section';
import { Container } from '@/components/layout/container';
import { CourseCard } from '@/components/courses/course-card';
import { BookCard } from '@/components/books/book-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import type { Book, Category, Course, Paginated } from '@/types';

const CATEGORY_ACCENTS = [
  'bg-primary/10 text-primary',
  'bg-gold/15 text-gold-foreground',
  'bg-success/15 text-success',
  'bg-accent text-accent-foreground',
];

async function getLandingData() {
  const [categories, courses, books] = await Promise.all([
    api
      .get<Paginated<Category>>('/categories', { limit: 100 }, { skipAuth: true })
      .then((res) => res.items)
      .catch(() => [] as Category[]),
    api
      .get<Paginated<Course>>('/courses', { page: 1, limit: 8 }, { skipAuth: true })
      .catch(() => null),
    api
      .get<Paginated<Book>>('/books', { page: 1, limit: 4 }, { skipAuth: true })
      .catch(() => null),
  ]);

  return { categories, courses: courses?.items ?? [], books: books?.items ?? [] };
}

export default async function HomePage() {
  const { categories, courses, books } = await getLandingData();

  return (
    <>
      <Hero />

      {categories.length > 0 && (
        <div className="border-b border-border/60 bg-muted/20 py-16">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  Kategoriyalar
                </p>
                <h2 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Kategoriyalar bo&apos;yicha o&apos;rganing
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Sizga qiziq bo&apos;lgan sohani tanlang
                </p>
              </div>
              <Button
                variant="ghost"
                render={<Link href="/courses" />}
                className="group hidden sm:flex"
              >
                Barchasi{' '}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((category, idx) => (
                <Link
                  key={category._id}
                  href={`/courses?category=${category._id}`}
                  className="group relative flex flex-col gap-3 rounded-xl border border-border bg-background p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                >
                  <ArrowUpRight className="absolute top-4 right-4 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  <span
                    className={`flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length]}`}
                  >
                    <FolderOpen className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </div>
      )}

      {courses.length > 0 && (
        <div className="border-b border-border/60 py-16">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  Kurslar
                </p>
                <h2 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ommabop kurslar
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Eng so&apos;nggi qo&apos;shilgan kurslarni ko&apos;ring
                </p>
              </div>
              <Button
                variant="ghost"
                render={<Link href="/courses" />}
                className="group hidden sm:flex"
              >
                Barchasi{' '}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </Container>
        </div>
      )}

      {books.length > 0 && (
        <div className="border-b border-border/60 bg-muted/20 py-16">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  Kutubxona
                </p>
                <h2 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Bepul kitoblar
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Kutubxonamizdagi eng so&apos;nggi qo&apos;shilgan kitoblarni yuklab oling
                </p>
              </div>
              <Button
                variant="ghost"
                render={<Link href="/books" />}
                className="group hidden sm:flex"
              >
                Barchasi{' '}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
            <Button
              variant="ghost"
              render={<Link href="/books" />}
              className="group mt-6 flex w-full sm:hidden"
            >
              Barchasi{' '}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Container>
        </div>
      )}

      <RoleShowcase />
      <GamificationSection />
      <CtaSection />
    </>
  );
}
