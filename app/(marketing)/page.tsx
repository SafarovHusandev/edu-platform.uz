import {
  LandingBooks,
  LandingCourses,
  LandingHero,
  LandingRewards,
  LandingSteps,
  LandingVerify,
} from '@/components/marketing/landing-sections';
import { api } from '@/lib/api-client';
import type { Book, Course, Paginated, Reward } from '@/types';

async function getLandingData() {
  // Barchasi ochiq (skipAuth) endpoint'lar — mehmon uchun ham ishlaydi.
  const [coursesRes, booksRes, rewardsRes] = await Promise.all([
    api
      .get<Paginated<Course>>(
        '/courses',
        { page: 1, limit: 3, sort: 'popular' },
        { skipAuth: true }
      )
      .catch(() => null),
    api.get<Paginated<Book>>('/books', { page: 1, limit: 5 }, { skipAuth: true }).catch(() => null),
    api
      .get<Paginated<Reward>>('/rewards', { page: 1, limit: 3 }, { skipAuth: true })
      .catch(() => null),
  ]);

  return {
    courses: coursesRes?.items ?? [],
    books: booksRes?.items ?? [],
    rewards: rewardsRes?.items ?? [],
  };
}

export default async function HomePage() {
  const { courses, books, rewards } = await getLandingData();

  return (
    <>
      <LandingHero />
      <LandingSteps />
      <LandingCourses courses={courses} />
      <LandingBooks books={books} />
      <LandingRewards rewards={rewards} />
      <LandingVerify />
    </>
  );
}
