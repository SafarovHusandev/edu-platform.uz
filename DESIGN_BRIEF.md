# Edu Platform — Redesign Brief

> **Who this is for:** an AI design assistant (Claude) asked to produce a new visual design for this product.
> **How to use it:** Part A is the task (what to make and the rules). Part B is the current product in full detail: stack, tokens, components, every screen, flows, data and sample content. Treat Part B as facts about what exists. Treat Part A as the instructions. Where they conflict, Part A wins.
>
> Last synced with the codebase: 2026-10-26.

---

# PART A — THE TASK

## A1. Goal

Produce a **fresh, unified, modern visual design** for Edu Platform. The design should stay buildable with the existing stack (§B2): Tailwind v4 tokens and shadcn-style components on `@base-ui/react`.

Today the app looks like two products. Student and teacher pages use a newer card style (rounded-2xl, soft shadows, status pills). Admin pages use an older, denser table style (rounded-md, uppercase table headers). The redesign must turn this into **one coherent design system** that works for all four audiences.

**Scope (default; edit if needed):**
- [x] Design system: tokens, type scale, components, status vocabulary, motion
- [x] App shell: sidebar, top bar, mobile navigation
- [x] Student app (highest priority: children use it daily)
- [x] Teacher app
- [x] Admin app (may stay denser, but must clearly belong to the same family)
- [x] Public marketing site + auth screens
- [ ] Information architecture changes: **out of scope**. Keep routes, page set and nav items as listed in §B5–§B6. You may regroup items visually, for example by collapsing the shared items into an account menu.

## A2. Hard constraints (do not change)

1. **Language:** all UI copy is **Uzbek (Latin script)**. Keep the existing copy from §B6/§B9 unless you have a clearly better Uzbek wording. Never translate to English or Russian. Uzbek words are long ("O'zlashtirish", "Bildirishnomalar", "Foydalanuvchilar"), so layouts must tolerate long labels and wrap gracefully.
2. **Apostrophes:** Uzbek uses `'` inside words (O'quvchi, to'lov, g'olib). Fonts must render it nicely. Prefer a font with good Latin Extended support and a clean `'` / `ʻ` glyph.
3. **Light and dark themes** are both required. Every token needs both values.
4. **Gamification identity stays.** Diamonds (`/public/diamond.png`, a raster gem icon), the gold Premium accent, the daily spin wheel, leaderboard and rewards shop are core to the student experience and must stay visually prominent.
5. **Icons:** Lucide only (outline). No other icon set.
6. **Mobile first for students.** Many students are on phones (grades 1–11, ages ~7–17). Every student screen must work at 360px width with a 16px side gutter and no horizontal scroll. Teacher and admin screens are mostly desktop but must not break on tablet.
7. **Accessibility:** WCAG AA contrast for text in both themes, visible focus rings, touch targets ≥ 40px on student screens, color never the only status signal (always icon + label).
8. **Tech feasibility:** express the design as CSS custom properties (OKLCH preferred) plus Tailwind utility classes. No design that needs a new UI framework. Charts use Recharts.

## A3. Design direction (preferences, open to your judgement)

- **Audience split:**
  - Student screens: friendly, motivating, playful but clean. Think Duolingo-level clarity, not a toy.
  - Teacher screens: calm, productive, data-forward.
  - Admin screens: dense, efficient, table-first.
  - All three share the same tokens and components.
- **Brand color:** the current primary is indigo (`oklch(0.52 0.22 264)`). You may refine it (hue, chroma, a secondary brand color), but keep it in the blue/indigo/violet family unless you propose a strong reason.
- **Typography:** today one font (Geist Sans) does everything and there is no type scale. Propose a real type scale with named roles (display, h1–h4, body, small, caption, numeric). You may add a display face for headings. Numbers (diamonds, scores, timers, prices) deserve a tabular/numeric style.
- **Status system:** formalize one status-pill system (§B4.4) as first-class Badge variants instead of per-page colors.
- **Motion:** define a small, purposeful motion set: hover lift, press, page/section enter, success celebration (diamonds earned, test passed, reward redeemed), spin wheel. Respect `prefers-reduced-motion`. Remove or replace the leftover experimental effects (§B3.6).
- **Celebration moments matter:** passing a test, earning diamonds, winning on the spin wheel and a reward being delivered should feel rewarding.

## A4. Deliverables

Please produce, in this order:

1. **Design tokens** as a ready-to-paste `app/globals.css` block: `:root` + `.dark` CSS variables and the `@theme inline` mapping, using the same token names as §B3.1 (add new ones if needed, e.g. `--warning`, `--info`, `--premium`). Include radius, shadow, type scale and motion tokens.
2. **Type scale + font choice** with rationale.
3. **Component specs** for every component in §B4: variants, sizes, states (hover, focus, active, disabled, loading, error), shown in light and dark.
4. **Status vocabulary table:** every status in §B4.4 mapped to badge variant, color, icon and Uzbek label.
5. **App shell** (desktop sidebar + top bar; mobile drawer or bottom nav for students).
6. **Key screen mockups**, highest priority first:
   1. Student dashboard `/student`
   2. Live quiz-taking screen (`/student/quizzes/[id]` in progress) + result / pending review / time-expired screens
   3. Student quizzes list + quiz detail/start screen
   4. Rewards shop + redemption history
   5. Daily spin
   6. Leaderboard
   7. Teacher dashboard + teacher quiz results table + quiz builder
   8. Admin users table (dense mode)
   9. Landing page `/`
   10. Login / register
   11. Premium checkout
7. **Empty / loading / error states** pattern (§B4.3).
8. **Implementation notes:** which existing classes or components change, so a developer can migrate page by page.

Use the real sample data from §B10, not lorem ipsum.

---

# PART B — THE CURRENT PRODUCT

## B1. What the product is

**Edu Platform** (edu-platform.uz) is an online learning platform for **schools in Uzbekistan**. Students are grouped by grade number + letter (e.g. "7-A"). One Next.js app serves four roles:

| Role | Uzbek label | What they do |
|---|---|---|
| Student | O'quvchi | Takes courses and lessons, takes timed quizzes, reads library books, earns **diamonds (olmos)**, spins a daily wheel, redeems diamonds for **physical rewards** collected at school, sees a leaderboard, holds certificates, can buy **Premium**. |
| Teacher | O'qituvchi | Creates courses, lessons and quizzes (incl. importing questions from .docx), uploads books, reviews quiz results, manually grades open-ended answers, exports results to Excel/PDF, sees stats. |
| Admin / Superadmin | Administrator / Bosh administrator | Verifies and manages users, moderates courses and quizzes, manages categories, rewards, redemptions (approve → deliver / reject), promo codes, payments. Superadmin also creates and deletes accounts. |
| Visitor | — | Public landing page, course and book catalogs, certificate verification, donate, legal pages, login/register. |

**Core student loop:** learn (lesson/quiz) → earn diamonds → spend in rewards shop → pick up the prize at school. **Premium** (paid, 30/90/180/365 days) multiplies diamonds ×1.5, allows up to 3 daily spins per day, unlocks premium-only rewards, and (for a teacher's students) more quiz attempts.

## B2. Tech stack and constraints

- **Next.js 16** (App Router, route groups `(marketing)`, `(auth)`, `(app)`), **React 19**, **TypeScript**.
- **Tailwind CSS v4**, CSS-first: tokens live in `app/globals.css` (`:root`, `.dark`, `@theme inline`). There is no `tailwind.config.js` theme. `tw-animate-css` is loaded.
- **Components:** shadcn-style (`components.json` style `base-nova`) in `components/ui/*`, built on **`@base-ui/react`** primitives (not Radix). Variants via `class-variance-authority`; `cn()` = clsx + tailwind-merge.
- **Theme:** `next-themes`, class-based `.dark`, default = system.
- **Fonts:** `Geist` → `--font-geist-sans` (used for everything, `--font-heading` = sans), `Geist_Mono` (rarely used).
- **Icons:** `lucide-react`. **Charts:** `recharts` (barely used yet). **Toasts:** `sonner` (top-center, rich colors, close button). **Top progress bar:** `nextjs-toploader`. **Count-up numbers:** `react-countup`.
- **Data:** TanStack Query, Zustand auth store, REST backend (`server.maktab16.uz/api/v1`).

## B3. Current design tokens (exact values)

### B3.1 Colors (OKLCH)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `0.99 0.003 264` | `0.14 0.015 264` | page background |
| `--foreground` | `0.15 0.018 264` | `0.98 0.005 264` | body text |
| `--card` / `--popover` | `1 0 0` | `0.18 0.018 264` | surfaces |
| `--primary` | `0.52 0.22 264` (indigo) | `0.68 0.19 264` | brand, buttons, links, active nav |
| `--primary-foreground` | `0.99 0.005 264` | `0.99 0.005 264` | text on primary |
| `--secondary` / `--muted` | `0.96 0.012 264` | `0.24 0.022 264` / `0.22 0.02 264` | subtle fills |
| `--muted-foreground` | `0.48 0.025 264` | `0.72 0.02 264` | secondary text |
| `--accent` | `0.94 0.035 264` | `0.28 0.04 264` | hover fills |
| `--destructive` | `0.577 0.245 27.3` | `0.704 0.191 22.2` | errors, failed, delete, expired |
| `--success` (custom) | `0.65 0.17 150` | `0.72 0.17 150` | passed, active, delivered |
| `--gold` (custom) | `0.76 0.16 80` | `0.82 0.16 80` | Premium + diamond accents |
| `--gold-foreground` | `0.25 0.08 70` | `0.96 0.04 80` | text on gold tints |
| `--border` / `--input` | `0.91 0.012 264` | `0.28 0.02 264` | borders |
| `--ring` | primary @ 50% | primary @ 60% | focus |
| `--chart-1..5` | indigo, orange (55), green (150), magenta (320), red (25) | lighter | charts |
| `--sidebar*` | own namespace, near card/primary values | | sidebar |

Ad-hoc colors used directly in pages (no tokens exist for them yet): `emerald-500` (passed/active pills), `amber-500` (pending/warning), `sky-500` (approved). **There is no `warning` or `info` token. Please add them.**

### B3.2 Radius
`--radius: 0.85rem`. Derived: sm 0.6×, md 0.8×, lg 1×, xl 1.4×, 2xl 1.8×, 3xl 2.2×, 4xl 2.6×. Actual usage across the code: `rounded-md` ×195 (older/admin), `rounded-2xl` ×108 (newer cards), `rounded-xl` ×78, `rounded-full` for pills and avatars. The system is inconsistent.

### B3.3 Elevation
`--shadow-xs/sm/md/lg`: soft, foreground-tinted at 5–10% in light; black 30–55% in dark. Cards use `shadow-xs` at rest.

### B3.4 Typography
One family (Geist Sans). Page titles are `text-2xl`/`text-3xl font-semibold|bold tracking-tight`, set per page. There is no type-scale token.

### B3.5 Component base sizes (from `components/ui`)
- **Button:** `rounded-lg`, `text-sm font-medium`.
  - Sizes: xs h-6, sm h-7, default h-8, lg h-9; icon sizes 6/7/8/9.
  - Variants: default (primary), outline, secondary, ghost, destructive (tinted, not solid red), link.
  - Pages often hand-override with `rounded-full` and `bg-foreground text-background` (quiz screen).
  - These sizes are small for a children's app.
- **Badge:** h-5, `rounded-4xl`, `text-xs`. Variants: default, secondary, destructive (tinted), outline, ghost, link. **No success/warning/info/premium variants.**

### B3.6 Leftover CSS helpers (globals.css)
`.card-hover-glow` (lift + indigo glow), `.glass-card` (backdrop blur), `.bg-grid-pattern`, `.animate-float`, `.animate-pulse-slow`, `.animate-glow` (static glow, misnamed), `.shimmer-btn`, `.scrollbar-blue`. These are used rarely and inconsistently. Formalize them or drop them.

## B4. Component inventory and patterns

### B4.1 UI primitives (`components/ui/*`)
accordion, alert-dialog, avatar (sizes sm/default/lg/xl, initials fallback), badge, breadcrumb, button, card, chart (Recharts wrapper), checkbox, dialog, dropdown-menu, empty-state, error-state, form (react-hook-form), input, label, page-header (title + description + actions), pagination + pagination-bar, phone-input (+998 mask), popover, progress, scroll-area, select, separator, sheet, skeleton (+ SkeletonTable / SkeletonCardGrid / SkeletonList), sonner (toast), stat-card, switch, table, tabs, textarea, tooltip.

**Missing:** RadioGroup (hand-rolled as two buttons), segmented control, stepper/timeline (hand-rolled in redemptions), status Badge variants, a numeric/stat display component with consistent styling.

### B4.2 Domain components
- `layout/`: sidebar-nav, app-topbar, status-card (student balance + diamonds + Premium), user-menu, public-navbar, public-footer, container.
- `courses/`: course-card, course-reviews, enroll-card, star-rating-input.
- `books/`: book-card.
- `quizzes/`: question-form-dialog, import-questions-dialog (.docx import), target-grades-editor.
- `certificates/`: download-certificate-button.
- `payments/`: payment-row.
- `marketing/`: hero, stats-strip, economy-steps, daily-spin-showcase, rewards-preview, premium-pricing, role-showcase, telegram-callout, cta-section.
- `icons/diamond-icon`, `logo`, `theme-toggle`.

### B4.3 Recurring patterns (keep the behaviour, redesign the look)
- **State triad on every data page:** Skeleton while loading → `ErrorState` (message + "retry") → `EmptyState` (icon + title + optional description + optional action).
  - Two kinds of empty: "nothing exists yet" ("Hali … mavjud emas") vs "filter matched nothing" ("Hech narsa topilmadi" + "Filtrlarni tozalash").
- **Page header:** title + muted description + right-aligned actions; breadcrumbs on detail pages.
- **Filter bar:** search input with icon + one or more Selects + clear-filters icon button; "N ta natija topildi" below when filtered.
- **Sortable table:** clickable headers with ArrowUp / ArrowDown / ArrowUpDown.
- **Export dialog:** column checklist + format picker (Excel / PDF cards) + confirm.
- **Icon tile:** rounded square with tinted bg holding a Lucide icon, as list-row lead.
- **Stat tray:** small metric chips (icon + value) in a muted tray.
- **Currency display:** `diamond.png` + number, often in a gold-tinted pill. Money: "12 500 so'm".
- **Confirm destructive actions** with AlertDialog.

### B4.4 Complete status vocabulary (design one system for all of these)

| Domain | Status | Current Uzbek label | Current look |
|---|---|---|---|
| Quiz | active / inactive | Faol / Nofaol | emerald pill / muted |
| Quiz attempt | `in_progress` | (taking test) | — |
| | `submitted` | Tekshirilmoqda (open answers awaiting teacher) | muted/secondary + Hourglass |
| | `reviewed` + passed | O'tdi | emerald/success + CheckCircle2/Trophy |
| | `reviewed` + failed | O'tmadi / O'ta olmadi | muted or destructive + XCircle |
| | `expired` (**new**) | ⏱ Vaqt tugadi (time ran out; attempt voided, counts toward max attempts) | destructive + TimerOff |
| | over time limit (teacher view) | duration shown red + AlertTriangle | destructive text |
| Redemption | pending | Kutilmoqda | amber |
| | approved | Tasdiqlangan | sky |
| | delivered | Topshirilgan | success |
| | rejected | Rad etilgan | destructive |
| Payment | success | To'lov muvaffaqiyatli | success |
| | draft | To'lov kutilmoqda | muted + Clock |
| | progress / billing | To'lov amalga oshirilmoqda | muted + Clock |
| | hold | To'lov tekshirilmoqda | muted + Clock |
| | error | To'lov amalga oshmadi | destructive |
| | revert | (refunded) | — |
| User | unverified / verified / blocked | Tasdiqlanmagan / Tasdiqlangan / Bloklangan | amber / success / destructive |
| Tarif | standart / premium | Standart / Premium | muted / gold + Crown |
| Reward | in stock / out of stock / premium-only | "N ta qoldi" / "Tugagan" / Premium | — / muted / gold + Lock |
| Course/Book | published / draft | Nashr qilingan / Qoralama | success / muted |
| Notification | unread / read | dot indicator | primary dot |

## B5. Layout shell and navigation

- **`(app)` shell:**
  - Left sidebar (`sidebar-nav`): logo, role nav items, shared items, "Chiqish" (logout).
  - Top bar (`app-topbar`): page context; for students a **StatusCard** (balance in so'm, diamonds, Premium badge or "Test va darslarni tugatib diamond to'plang" nudge); theme toggle; user menu (avatar, name, role).
  - Content inside `Container` (max-width wrapper).
  - Mobile: sidebar collapses into a sheet/drawer.
- **`(marketing)` shell:** public navbar (logo, Kurslar, Kutubxona, …, Kirish / Ro'yxatdan o'tish) + footer (links incl. Oferta, Maxfiylik siyosati, Telegram).
- **`(auth)`:** centered card, minimal chrome.

**Sidebar items by role** (label → route, Lucide icon):

| Student | Teacher | Admin / Superadmin |
|---|---|---|
| Bosh sahifa → /student (LayoutDashboard) | Bosh sahifa → /teacher | Bosh sahifa → /admin |
| Mening kurslarim → /student/courses (GraduationCap) | Kurslarim → /teacher/courses | Foydalanuvchilar → /admin/users (Users) |
| Testlar → /student/quizzes (ClipboardList) | Testlar → /teacher/quizzes | Kurslar → /admin/courses |
| Kutubxona → /books (Library) | Kitoblarim → /teacher/books | Testlar → /admin/quizzes |
| Sertifikatlar → /student/certificates (ScrollText) | Mukofotlar → /student/rewards (Gift) | Kategoriyalar → /admin/categories (Tags) |
| Mukofotlar → /student/rewards (Gift) | Statistika → /teacher/stats (BarChart3) | Kitob kategoriyalari → /admin/book-categories (Tag) |
| Kunlik barabon → /student/daily-spin (RotateCw) | | Mukofotlar → /admin/rewards (Gift) |
| Hamyon → /student/wallet (Wallet) | | Yutuqlar → /admin/redemptions (Trophy) |
| | | Promo kodlar → /admin/promo-codes (TicketPercent) |
| | | To'lovlar → /admin/payments (Receipt) |

**Shared (all roles):** Reyting → /leaderboard (Trophy), Premium → /premium (Crown), To'lovlar tarixi → /payments (Receipt), Bildirishnomalar → /notifications (Bell), Profil → /profile (CircleUserRound).

## B6. Every screen

### B6.1 Public / marketing
| Route | Content |
|---|---|
| `/` | Landing, in order: **Hero** ("Yangi avlod interaktiv ta'lim platformasi", CTAs) → **StatsStrip** (counts of courses, categories, books, rewards) → **EconomySteps** ("Olmos ishlab toping": Darsni tugating → Kunlik barabonni aylantiring → spend on rewards) → **DailySpinShowcase** → **RewardsPreview** (4 real rewards) → **PremiumPricing** (Standart "Bepul, boshlash uchun yetarli" vs Premium) → **RoleShowcase** (O'quvchi / O'qituvchi / Administrator feature lists) → **TelegramCallout** → **CtaSection**. |
| `/courses` | Course catalog: search, category filter, sort (Odatiy tartibda / Ommabopligi bo'yicha / Yuqori reytingli / Narx: avval arzon / Narx: avval qimmat), course-card grid, pagination. |
| `/courses/[id]` | Course detail: cover, title, teacher, rating, price/"Bepul", enroll card; tabs "Dars rejasi" (lesson outline) and "Sharhlar (N)" (reviews + star-rating input). |
| `/books`, `/books/[id]` | "Kutubxona": category + grade filters, book-card grid (cover, title, author, downloads); detail with cover, metadata, download. |
| `/certificates/verify`, `/certificates/verify/[number]` | Certificate number lookup → "Sertifikat tasdiqlandi" (student, course, date) or "Sertifikat topilmadi". |
| `/donate` | Donation page incl. "Nima uchun bu muhim?" |
| `/oferta`, `/maxfiylik-siyosati` | Long-form legal text ("Ommaviy oferta", privacy). Needs a good reading layout. |

### B6.2 Auth
| Route | Content |
|---|---|
| `/login` | Phone (+998 mask) + password. |
| `/register` | Name, phone, password, role-specific fields (grade number + letter for students). |
| `/register/pending` | "Hisobingiz tasdiqlanishi kutilmoqda": an admin must verify new accounts. |

### B6.3 Shared (any logged-in role)
| Route | Content |
|---|---|
| `/dashboard` | Redirects to the role home. |
| `/leaderboard` | Tabs: **students** ranked by diamonds (podium for top 3 + list, avatar, name, grade, diamonds) and **teachers** ranked by activity (courses, quizzes, lessons, books, students, avg rating; currently a dense chip tray). The teacher tab is hidden from students. |
| `/premium` | "Premium a'zolik": current status (days left), plan cards 1 oylik / 3 oylik / **6 oylik (popular)** / 1 yillik, benefit lists ("O'quvchi uchun imkoniyatlar": 1.5× diamonds, daily spin up to 3×/day, premium rewards unlocked; "O'qituvchi uchun imkoniyatlar": unlimited quiz attempts as configured), promo code input + "Tekshirish", price summary with discount, checkout button → payment gateway. Extending adds days on top of the current plan. |
| `/payments` | "To'lovlar tarixi": filters (status, purpose: wallet/course/premium/donation), payment rows with status pills. |
| `/payment/[invoiceId]` | Payment status after gateway redirect (pending → success/error). |
| `/notifications` | "Bildirishnomalar": list, unread dot, relative time, click → deep link (e.g. quiz result). |
| `/profile` | "Profil": cards "Shaxsiy ma'lumotlar" (avatar upload, name, phone), "Parolni o'zgartirish", "Telegram" (link the account to the Telegram bot). |

### B6.4 Student
| Route | Content |
|---|---|
| `/student` | "O'quvchi Paneli". Hero with "Mening olmoslarim" / "Mavjud olmoslar"; stats (Aktiv Kurslar, Tugallangan, O'zlashtirish %); "O'rganishni davom eting" (continue courses); quick-link tiles: Testlar bazasi ("Bilimingizni sinang"), Mukofotlar/Do'kon ("Olmoslarni almashtiring"), Sertifikatlar ("Yutuqlaringizni ko'ring"), Hamyon & To'lovlar ("Balans va operatsiyalar"), daily spin ("Aylantirish"). |
| `/student/courses` | "Mening kurslarim": enrolled courses with progress bars. |
| `/student/courses/[enrollmentId]` | Course progress + "Darslar" list (completed checkmarks, locked/next). |
| `/student/lessons/[id]` | Lesson viewer: text content, video, attachments, "mark complete" (earns diamonds). |
| `/student/quizzes` | "Testlar — Bilimingizni sinab ko'ring": list cards (icon tile, title, "Faol" badge, question count, pass score "O'tish balli: 60%", attempts "3 urinish", date). |
| `/student/quizzes/[id]` | **One route, five states:** (1) **Start screen** (§B7.1); (2) **Live test** (§B7.1); (3) **Result** (passed: Trophy, "Tabriklaymiz!" / failed: "Afsuski, o'ta olmadingiz"; score %, pass score, duration, diamonds earned, retry if attempts remain); (4) **Pending review** ("Javoblaringiz qabul qilindi": open answers are being checked by the teacher); (5) **Time expired** ("Vaqtingiz tugadi": attempt voided, counted toward the limit, remaining attempts, retry button if any remain). |
| `/student/quizzes/[id]/attempts/[attemptId]` | Past attempt review: hero (score/pass or pending or expired) + per-question cards showing the student's answer, correct/incorrect, points, teacher feedback for open questions. |
| `/student/rewards` | "Mukofotlar" shop: balance card, filter pills (Barchasi / Olsa bo'ladi / Premium), sort, reward grid (image, title, cost in diamonds, stock "N ta qoldi" / "Tugagan", Premium lock), redeem confirm dialog. |
| `/student/rewards/redemptions` | "Mening yutuqlarim": redemption history with a 3-step tracker (Kutilmoqda → Tasdiqlangan → Topshirilgan, or Rad etildi with reason), notes. |
| `/student/daily-spin` | "Kunlik Baraban — Har Kuni Bepul Sovrin": 8-segment wheel, "Aylantir" button, win message "N ta Olmos hisobingizga qo'shildi!", out-of-spins state "Bugungi imkoniyatingiz tugadi — ertaga yana kiring!". Standart = 1 spin/day, Premium = up to 3. |
| `/student/wallet` | "Hamyon": balance (so'm), "Hamyonni to'ldirish" (top-up amount → payment gateway), transactions. |
| `/student/certificates` | "Sertifikatlarim": certificate cards (course, number, date, download PDF). Empty: "Kursni yakunlab, birinchi sertifikatingizni oling!" |

### B6.5 Teacher
| Route | Content |
|---|---|
| `/teacher` | "Ustoz & Muallif Boshqaruv Markazi": stats, shortcut cards (Kurslarga o'tish, Testlarga o'tish, Kutubxonaga o'tish, Tahlillarni ko'rish), "Ustoz uchun foydali maslahat" tip box. |
| `/teacher/courses`, `/new`, `/[id]` | Course list cards; create form ("Yangi kurs yaratish": title, description, category, price, thumbnail); detail with "Kurs ma'lumotlari" + "Darslar (N)" (add/reorder/edit lessons). |
| `/teacher/lessons/[id]` | "Darsni tahrirlash" (title, content, video URL) + "Qo'shimcha materiallar" (attachments). |
| `/teacher/books`, `/new`, `/[id]` | "Kitoblarim" grid (cover zoom, downloads); form "Kitob ma'lumotlari" (title, author, category, grade or "Barcha sinflar uchun", cover) + "Kitob fayli". |
| `/teacher/quizzes` | "Testlar — Testlaringizni yarating va boshqaring": search/filter, quiz cards (active state, grades, question count). |
| `/teacher/quizzes/new` | Create quiz: target type (Mustaqil / Kurs / Dars), title, description, pass score, max attempts, time limit (daqiqa), **target grades editor** (per-grade: number, letter, availability window, attempts and time overrides). |
| `/teacher/quizzes/[id]` | Quiz builder: header stats (Savollar, Daqiqa, Urinishlar), actions (Faolsizlantirish, Nusxalash, delete), question list (types: Bir javobli / multiple choice with options A–D, To'g'ri/Noto'g'ri, Ochiq savol with sample answer; points), add/edit question dialog, **import from .docx** (template `public/templates/savol-namunasi.docx`). Activation requires a minimum number of questions: 10 for grades 1–4, 20 for 5–8, 25 for 9–11. |
| `/teacher/quizzes/[id]/results` | "Natijalar": counts (N o'quvchi, N urinish), "Yuklab olish" export dialog, filter bar (search, status: Barcha holatlar / O'tdi / O'tmadi / Tekshirilmoqda / Vaqt tugadi, grade), sortable table: O'quvchi (avatar, name, "N marta urindi"), Sinf, Ball, Holat, Boshlagan vaqti, Yakunlangan vaqti, Davomiyligi (red if over limit), Amal (Ko'rish, Baholash). Grading dialog "Ochiq savollarni baholash": per open question the student's answer, sample answer, points input, "To'g'ri deb belgilash", feedback textarea. |
| `/teacher/quizzes/[id]/results/[attemptId]` | Attempt detail: student hero (avatar, name, status badge), score tray (Natija %, Ball x/y, O'tish balli), meta (started, submitted, attempt #, duration), attempt switcher pills, per-question breakdown with colored left border. |
| `/teacher/stats` | "Statistika": course/student/rating numbers, "Testlar" pass rates. Good candidate for real charts. |

### B6.6 Admin
| Route | Content |
|---|---|
| `/admin` | "Platforma holatiga umumiy nazar": metric tiles (Foydalanuvchilar, Kurslar, Testlar, Kategoriyalar, Mukofotlar, Kutilayotgan yutuqlar) + shortcuts (Yutuqlarni tasdiqlash, Chegirma kodlarini yarating). |
| `/admin/users` | Largest screen. Users table: role filter, search, verify, block/unblock, change role and grade, edit; superadmin can create and delete. Row action menu. |
| `/admin/courses`, `/admin/quizzes` | Moderation tables ("Platformadagi barcha kurslar / testlar"). |
| `/admin/categories`, `/admin/book-categories` | Simple CRUD lists. |
| `/admin/rewards` | "Mukofotlar — Olmoslarga almashtiriladigan sovg'alar": CRUD with image, cost, stock (empty = unlimited), premium-only switch. |
| `/admin/redemptions` | "Yutuqlar — Mukofot so'rovlarini ko'rib chiqing": tabs Barchasi / Kutilmoqda / Tasdiqlangan / Topshirilgan / Rad etilgan; approve → deliver (with note) or reject (with reason). |
| `/admin/promo-codes` | "Promo kodlar": code, discount %, expiry, max uses / used, active switch. |
| `/admin/payments` | "To'lovlar": platform ledger with status and purpose filters. |

## B7. Key flows (design these end-to-end)

### B7.1 Taking a timed quiz (most important student flow)
1. **Start screen.**
   - Breadcrumb, title, description.
   - Stat tiles: Savollar, Vaqt ("15 daq" or "Cheksiz"), O'tish bali %, Mukofot (+10 diamonds, ×1.5 for Premium).
   - "Oldingi urinishlar" list (#, date, duration, status pill).
   - Sticky side card "Urinishlar": big "2 / 3 qoldi", availability window, max-reward note, Premium nudge if capped, "Testni boshlash" button, "Boshlagach taymer to'xtamaydi" (the timer doesn't stop once started).
   - When attempts are exhausted: "Urinishlar tugadi", plus "Oxirgi urinish vaqt tugashi sababli bekor qilindi" if the last attempt expired.
2. **Live test (full-bleed).**
   - Top bar: quiz title, "N-urinish", **countdown pill** (turns red under 60 s), "Yakunlash" (finish) button.
   - Main: "Savol 3 / 10", type badge + points, **large question text** (wraps; copy/context-menu disabled), answer options as big A/B/C/D cards (selected = success colour) or textarea for open questions, "Oldingi" / "Keyingi" (last → "Yakunlash").
   - Right panel "Savollar": numbered grid (current = outlined, answered = filled success, unanswered = muted) + legend "Javob berilgan · N", "Javobsiz · N".
   - On mobile the panel must move below or into a sheet.
3. **Auto-submit** when the countdown reaches 0.
4. **Outcomes:**
   - Result (passed / failed + diamonds earned).
   - Pending review (has open questions).
   - **Expired:** the backend rejects submissions after the time limit (+20 s grace). The attempt becomes `expired`, scores 0, gives no diamonds and still counts toward max attempts. It must look clearly different from "0% failed".

Rules worth showing in UI: diamonds are awarded only on attempt #1 (score% × 10, ×1.5 Premium). Time limit and max attempts can differ per grade and are capped for non-Premium.

### B7.2 Rewards
Browse shop → filter "Olsa bo'ladi" (affordable) → redeem (confirm dialog shows cost and remaining balance) → appears in "Mening yutuqlarim" as Kutilmoqda → admin approves (Tasdiqlangan) → delivers at school (Topshirilgan) or rejects with reason (diamonds refunded).

### B7.3 Premium checkout
Pick plan → optional promo code → see discounted price → pay via gateway (Multicard) → `/payment/[invoiceId]` status → Premium badge appears everywhere (StatusCard, avatar, leaderboard).

### B7.4 Teacher grading
Notification "new attempt needs review" → results table filtered "Tekshirilmoqda" → "Baholash" dialog → saved → student gets notified and sees the final score.

## B8. Formatting conventions
- Numbers: `Intl.NumberFormat('uz-UZ')` → `12 500`.
- Money: stored in tiyin (1 so'm = 100 tiyin), shown as `12 500 so'm`, or `Bepul` when 0.
- Dates: `20.10.2026`; with time `10:10 20.10.2026`. Quiz times are always Asia/Tashkent.
- Relative time: Hozirgina, N daqiqa oldin, N soat oldin, Kecha, N kun oldin, N hafta oldin, then the absolute date.
- Duration: `8 daqiqa 20 soniya`, `45 soniya`.
- Timer: `MM:SS`, tabular numerals.
- Grade: `7-A`; grade-only `7-sinf`.
- Avatar fallback: up to 2 initials.
- Plans: 1 oylik / 3 oylik / 6 oylik / 1 yillik.

## B9. Copy glossary
Saqlash (save), Bekor qilish (cancel), Tasdiqlash (confirm/verify), O'chirish (delete), Tahrirlash (edit), Qo'shish (add), Yuklab olish (download), Yuklash (upload), Qidirish (search), Barchasi (all), Hech narsa topilmadi (no results), Filtrlarni tozalash (clear filters), Qayta urinish (retry), Testni boshlash (start test), Yakunlash (finish), Oldingi / Keyingi (previous / next), Ko'rish (view), Baholash (grade), Olmos (diamond), Mukofot (reward), Yutuq (redemption/prize), Urinish (attempt), O'tish balli (pass score), Savol (question), Javob (answer), Sinf (grade/class), Faol / Nofaol (active / inactive), Chiqish (log out), Kirish (log in), Ro'yxatdan o'tish (register).

## B10. Data models and sample data

Source of truth: `types/index.ts`. List endpoints return `Paginated<T> = { items, total, page, limit, totalPages }`.

- **User:** `_id, name, phone ("998XXXXXXXXX"), role, grade {number, letter}, avatar?, diamonds, balance (tiyin), tarif (standart|premium), premiumExpiresAt?, isBlocked, isVerified, lastLogin, createdAt`
- **Course:** `title, description, category, teacher, price (tiyin), thumbnail?, isPublished, rating, reviewsCount, studentsCount, lessonsCount`
- **Lesson:** `course, title, description?, content?, order, videoUrl?, attachments[], isCompleted?`
- **Book:** `title, author, description?, category, grade?, coverImage?, file?, isPublished, downloadsCount`
- **Quiz:** `title, description, targetType (standalone|course|lesson), passingScore %, maxAttempts, timeLimit? (min), targetGrades[] {number, letter?, availableFrom?, availableUntil?, maxAttempts?, timeLimit?, effectiveMaxAttempts?, effectiveTimeLimit?}, isActive, questions?[], questionsCount?, createdAt`
- **Question:** `text, type (multiple_choice|true_false|open_ended), options?[{label, text}], correctAnswer?, sampleAnswer?, points`
- **Attempt:** `quiz, student, answers[] {question, givenAnswer, isCorrect, pointsEarned, feedback?}, totalPoints, earnedPoints, scorePercent, status (in_progress|submitted|reviewed|expired), passed, attemptNumber, startedAt, submittedAt, durationSeconds`
- **Reward:** `title, description?, cost (diamonds), stock (null = unlimited), image?, premiumOnly?`
- **Redemption:** `reward, student, diamondsSpent, status (pending|approved|delivered|rejected), adminNote?, rejectReason?, deliveryNote?, createdAt`
- **Notification:** `title, message, type?, meta {quizId?, attemptId?, url?}, isRead, createdAt`
- **Certificate:** `certificateNumber, student, course, issuedAt`
- **PromoCode:** `code, discountPercent, expiresAt, maxUses, usedCount, isActive`
- **Payment:** purpose `wallet|course|premium|donation`, status `draft|progress|billing|hold|success|error|revert`

### Sample content (use in mockups)

**Students (leaderboard):**
```json
[
  { "name": "Ali", "grade": "1-A", "diamonds": 420, "rank": 1, "tarif": "premium" },
  { "name": "Mubina", "grade": "1-A", "diamonds": 365, "rank": 2 },
  { "name": "Abdurahim", "grade": "7-A", "diamonds": 298, "rank": 3 },
  { "name": "Yakubova Gulbaxor", "grade": "5-B", "diamonds": 240, "rank": 4 },
  { "name": "Aliyev Vali", "grade": "5-B", "diamonds": 210, "rank": 5 },
  { "name": "Jumayeva Farida Shavqiddin qizi", "grade": "4-B", "diamonds": 180, "rank": 6 },
  { "name": "Roziyeva Dildora", "grade": "10-A", "diamonds": 150, "rank": 7 },
  { "name": "Aziza Mannonova", "grade": "6-A", "diamonds": 120, "rank": 8 },
  { "name": "Davlatbek", "grade": "11-A", "diamonds": 95, "rank": 9 },
  { "name": "akbarali-2011", "grade": "9-B", "diamonds": 60, "rank": 10 }
]
```
(Note the long name in rank 6 and the lowercase username in rank 10. Layouts must handle both.)

**Teachers:**
```json
[
  { "name": "Husan", "coursesCount": 3, "quizzesCount": 7, "lessonsCount": 12, "booksCount": 4, "studentsCount": 86, "avgRating": 4.8 },
  { "name": "Karimboyev Mamurjon", "coursesCount": 2, "quizzesCount": 5, "lessonsCount": 9, "booksCount": 1, "studentsCount": 54, "avgRating": 4.5 },
  { "name": "Berikboyeva Shahriza", "coursesCount": 1, "quizzesCount": 3, "lessonsCount": 6, "booksCount": 2, "studentsCount": 31, "avgRating": 4.9 }
]
```

**Course:** `{ "title": "Nodejs Praktikum", "description": "NodeJS backend kurs", "category": "Dasturlash", "teacher": "Husan", "price": "250 000 so'm", "studentsCount": 86, "lessonsCount": 12, "rating": 4.8 }`

**Quizzes:**
```json
[
  { "title": "sinov test", "questionsCount": 12, "passingScore": 60, "maxAttempts": 3, "timeLimit": 15, "isActive": true, "grades": ["1-A"], "createdAt": "20.10.2026" },
  { "title": "Matematika 2", "questionsCount": 10, "passingScore": 60, "maxAttempts": 3, "timeLimit": 20, "isActive": true, "grades": ["1-A"], "createdAt": "10.08.2026" },
  { "title": "Ingliz tili", "questionsCount": 10, "passingScore": 60, "isActive": true, "grades": [] },
  { "title": "Matematika", "questionsCount": 2, "passingScore": 60, "isActive": false, "grades": ["2-sinf"] }
]
```

**Questions (live test screen):**
```json
[
  { "text": "5 + 5 = ?", "type": "multiple_choice", "points": 1, "options": ["A. 20", "B. 10", "C. 5", "D. 15"] },
  { "text": "2 + 2 = 4", "type": "true_false", "points": 1 },
  { "text": "O'zbekiston poytaxti qaysi shahar va u qachon poytaxt maqomini olgan? Javobingizni qisqacha izohlang.", "type": "open_ended", "points": 3 }
]
```

**Attempts (results table):**
```json
[
  { "student": "Ali", "grade": "1-A", "status": "reviewed", "passed": true, "scorePercent": 100, "earnedPoints": 10, "totalPoints": 10, "attemptNumber": 1, "durationSeconds": 57 },
  { "student": "Mubina", "grade": "1-A", "status": "reviewed", "passed": false, "scorePercent": 40, "attemptNumber": 2, "durationSeconds": 610 },
  { "student": "Aliyev Vali", "grade": "5-B", "status": "submitted", "attemptNumber": 1, "durationSeconds": 480 },
  { "student": "Davlatbek", "grade": "11-A", "status": "expired", "attemptNumber": 3, "durationSeconds": 1260 }
]
```

**Rewards:**
```json
[
  { "title": "Ruchka", "cost": 12, "stock": 2 },
  { "title": "O'chirg'ich", "cost": 15, "stock": 15, "description": "1 donadan beriladi" },
  { "title": "Kitob", "cost": 25, "stock": 0, "description": "Mukammal Dasturlash 2 — JavaScript" },
  { "title": "Spinner", "cost": 30, "stock": 1 },
  { "title": "Qalamdon", "cost": 45, "stock": 3 },
  { "title": "Simsiz quloqchin", "cost": 50, "stock": 0, "premiumOnly": true },
  { "title": "Bakal", "cost": 100, "stock": 1 }
]
```

**Current student (top bar):** `{ "name": "Ali", "grade": "1-A", "diamonds": 32, "balance": "0 so'm", "tarif": "standart" }`

**Premium plans:** 1 oylik, 3 oylik, 6 oylik (popular), 1 yillik. Prices come from the backend. Show the per-month equivalent and the discount.

## B11. Known problems to fix in the redesign
1. Two visual eras: card style (student/teacher) vs dense `rounded-md` tables (admin).
2. No type scale; one font for everything.
3. Status colors copy-pasted per page (emerald/amber/sky/destructive), with no Badge variants and no warning/info tokens.
4. Buttons are small (h-8 default) for a children's audience. The quiz screen overrides them ad hoc (`rounded-full bg-foreground`).
5. Teacher leaderboard rows cram six metric chips into one line.
6. Leftover "wow" CSS effects used inconsistently.
7. Charts are barely used although stats pages need them.
8. Mobile: the live-quiz side panel and wide tables (teacher results, admin users) need a defined mobile pattern (stacked cards or horizontal scroll inside the table only).
9. Marketing page sections each have their own style and no shared section rhythm.

## B12. Assets
- `public/logo.png`, `public/logo-white.png`: wordmark (light/dark).
- `public/diamond.png`: the diamond currency icon (raster). A matching SVG may be proposed.
- `public/templates/savol-namunasi.docx`: question-import template.
