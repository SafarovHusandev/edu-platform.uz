import { Hero } from '@/components/marketing/hero';
import { StatsStrip } from '@/components/marketing/stats-strip';
import { EconomySteps } from '@/components/marketing/economy-steps';
import { DailySpinShowcase } from '@/components/marketing/daily-spin-showcase';
import { RewardsPreview } from '@/components/marketing/rewards-preview';
import { PremiumPricing } from '@/components/marketing/premium-pricing';
import { RoleShowcase } from '@/components/marketing/role-showcase';
import { TelegramCallout } from '@/components/marketing/telegram-callout';
import { CtaSection } from '@/components/marketing/cta-section';
import { api } from '@/lib/api-client';
import type { Book, Category, Course, Paginated, Reward } from '@/types';

async function getLandingData() {
  // Barchasi ochiq (skipAuth) endpoint'lar — mehmon foydalanuvchi uchun ham
  // ishlaydi.
  //
  // Kategoriyalar/kurslar/kitoblarning o'zi endi bosh sahifada ko'rsatilmaydi
  // (ular /courses va /books sahifalarida to'liq, filtr bilan mavjud) —
  // shu uch endpoint faqat StatsStrip uchun umumiy sonni (.total) olish
  // maqsadida, minimal limit bilan chaqiriladi. Reyting (leaderboard) esa
  // dashboard funksiyasi — bosh sahifada ko'rsatilmaydi.
  const [categoriesRes, coursesRes, booksRes, rewardsRes] = await Promise.all([
    api.get<Paginated<Category>>('/categories', { limit: 1 }, { skipAuth: true }).catch(() => null),
    api
      .get<Paginated<Course>>('/courses', { page: 1, limit: 1 }, { skipAuth: true })
      .catch(() => null),
    api.get<Paginated<Book>>('/books', { page: 1, limit: 1 }, { skipAuth: true }).catch(() => null),
    api
      .get<Paginated<Reward>>('/rewards', { page: 1, limit: 4 }, { skipAuth: true })
      .catch(() => null),
  ]);

  return {
    rewards: rewardsRes?.items ?? [],
    stats: {
      courses: coursesRes?.total ?? 0,
      categories: categoriesRes?.total ?? 0,
      books: booksRes?.total ?? 0,
      rewards: rewardsRes?.total ?? 0,
    },
  };
}

export default async function HomePage() {
  const { rewards, stats } = await getLandingData();

  return (
    <>
      <Hero />
      <StatsStrip stats={stats} />
      <EconomySteps />
      <DailySpinShowcase />
      {rewards.length > 0 && <RewardsPreview rewards={rewards} />}
      <PremiumPricing />
      <RoleShowcase />
      <TelegramCallout />
      <CtaSection />
    </>
  );
}
