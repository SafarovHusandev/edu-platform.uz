# Edu Platform — Design Brief

Written for: a design assistant (e.g. Claude Design) asked to refresh or redesign this product's UI. This document describes the current state of the frontend — stack, visual language, component inventory, full page map, and data models (with mock sample data) — so a redesign can build on what exists instead of guessing at it.

## 1. What this product is

Edu Platform is an online learning platform for schools in Uzbekistan (UI language: Uzbek, Latin script). It serves four roles from one Next.js app:

- **Student (o'quvchi)** — takes courses, quizzes, reads library books, earns "diamonds" (gamified currency) for completing lessons/quizzes, redeems diamonds for physical rewards, tracks a leaderboard, holds certificates, can buy Premium.
- **Teacher (o'qituvchi)** — creates/manages courses, lessons, quizzes, uploads books, reviews student quiz attempts (incl. manual grading of open-ended questions), views stats.
- **Admin / Superadmin** — manages users, courses, quizzes, categories, rewards, redemptions, promo codes, payments. Superadmin additionally creates/edits/deletes user accounts.
- **Public/marketing visitor** — browses course and book catalogs, sees a public leaderboard preview, can register/log in.

The gamification loop (diamonds → rewards catalog → redemption → physical pickup) and the Premium subscription tier are central to the student experience and should stay visually prominent in any redesign.

## 2. Tech stack & constraints

- **Next.js 16** (App Router) — the team's internal note: *"this is NOT the Next.js you know; APIs/conventions differ from training data."* Don't assume Next 14/15 idioms are still valid.
- **React 19**, **TypeScript**, **Tailwind CSS v4** (CSS-first config via `@theme inline` in `app/globals.css`, not a `tailwind.config.js` theme object).
- **Component layer**: a shadcn-style library in `components/ui/*`, built on `@base-ui/react` primitives (Radix-alternative — `Dialog`, `Select`, `Tabs`, `Menu`, `Tooltip`, `Avatar`, etc. all come from `@base-ui/react`). Class merging via `tailwind-merge` (`cn()` helper in `lib/utils`).
- **Data**: TanStack Query for all server state; Zustand (`store/auth-store`) for the authenticated user; a thin `lib/api-client` wrapper over a separate backend API (`server.maktab16.uz`).
- **Forms**: `react-hook-form` + `zod`.
- **Icons**: `lucide-react` exclusively.
- **Fonts**: Geist Sans (`--font-geist-sans`) for everything, including headings (`--font-heading` is aliased to Geist Sans — there is no distinct display font today). Geist Mono exists but is barely used (seen once, for a diamond count).
- **Theming**: light/dark via `next-themes`, class-based (`.dark`), defaults to system preference. Every color token below has a light and dark value.
- No charting/export libraries were present by default — `exceljs` and `jspdf`/`jspdf-autotable` were added ad hoc for one CSV/PDF export feature (dynamically imported, not part of the base design system).

## 3. Design tokens (current)

All colors are OKLCH, defined as CSS custom properties in `app/globals.css` under `:root` and `.dark`, then re-exposed as Tailwind tokens via `@theme inline` (e.g. `--color-primary: var(--primary)`), so they're used in JSX as ordinary Tailwind classes: `bg-primary`, `text-muted-foreground`, `border-border`, etc.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` / `foreground` | near-white / near-black, both with a faint blue-violet tint (hue 264) | dark navy-black / near-white | page background, body text |
| `primary` | `oklch(0.52 0.22 264)` — a saturated indigo-blue | `oklch(0.68 0.19 264)` — lighter indigo for dark bg | brand color: buttons, links, active states, focus rings |
| `card` / `popover` | white | dark slate | card/dialog/menu surfaces |
| `muted` / `muted-foreground` | very light blue-gray / mid gray | dark gray / lighter gray | secondary surfaces, secondary text, disabled states |
| `secondary`, `accent` | light blue-gray tints | dark blue-gray tints | subtle backgrounds, hover states |
| `destructive` | `oklch(0.577 0.245 27.325)` — red | `oklch(0.704 0.191 22.216)` — lighter red | errors, "failed"/"blocked" states, delete actions |
| `success` (custom, non-shadcn-default) | `oklch(0.65 0.17 150)` — green | `oklch(0.72 0.17 150)` | "passed"/"active"/"approved" states |
| `gold` / `gold-foreground` (custom) | `oklch(0.76 0.16 80)` amber-gold | `oklch(0.82 0.16 80)` | **Premium** tier and diamond-currency accents everywhere |
| `border` / `input` / `ring` | very light gray | dark gray | borders, input outlines, focus rings |
| `chart-1..5` | indigo, orange, green, magenta, red | lighter variants | reserved for data viz (Recharts is installed; current usage is minimal) |
| `sidebar*` | near-identical to card/primary but own namespace | same | left nav shell |

Beyond raw tokens, the app leans hard on **emerald/amber/destructive with `/10` opacity fills + a matching `ring-1` border** as its de-facto "status pill" pattern, e.g. `bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400` for "passed/active", `bg-amber-500/10 ...` for warnings, `bg-destructive/10 text-destructive ring-1 ring-destructive/20` for failed/blocked. This is applied ad hoc per page rather than being a reusable `Badge` variant — a real design system pass could formalize this into first-class `Badge`/status-pill variants.

**Radius scale**: one base `--radius: 0.85rem`, with `sm/md/lg/xl/2xl/3xl/4xl` all derived as multiples of it (0.6×…2.6×). In practice, newer/redesigned pages converge on **`rounded-2xl`** for cards and **`rounded-full`** for pills/badges/avatars; some older or admin screens still use `rounded-md`, so corner radius is not yet fully consistent across the app (see §8).

**Elevation**: `--shadow-xs/sm/md/lg`, all soft dark-tinted shadows (no colored shadows except the custom glow helpers below). Cards mostly use `shadow-xs` at rest.

**Custom CSS helpers** (`globals.css`, beyond Tailwind): `.card-hover-glow` (lift + soft indigo shadow on hover, used on leaderboard rows), `.glass-card` (frosted-glass panel, backdrop-blur), `.bg-grid-pattern` (faint grid texture), `.animate-float`, `.animate-pulse-slow`, `.animate-glow` (static colored glow ring, not actually pulsing despite the name), `.shimmer-btn`. These read as leftover/experimental "wow" effects rather than a systematic motion language — a redesign could either formalize a small motion system or remove the unused ones.

## 4. Component inventory (`components/ui/*`)

A fairly complete shadcn-equivalent set already exists: `button`, `card`, `badge`, `input`, `textarea`, `label`, `form` (react-hook-form bindings), `select`, `checkbox`, `switch`, `tabs`, `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `popover`, `tooltip`, `accordion`, `avatar`, `table`, `pagination` + a custom `pagination-bar`, `breadcrumb`, `separator`, `scroll-area`, `progress`, `chart` (Recharts wrapper), `phone-input`, `skeleton` (plus `SkeletonTable`/`SkeletonCardGrid`/`SkeletonList` presets), and three bespoke composite components: `page-header` (title + description + actions slot, used atop almost every authenticated page), `empty-state`, `error-state`.

Notable gap: **no `RadioGroup` component** — binary choices are hand-rolled as two styled `<button>`s (e.g. export-format picker). No dedicated data-viz components beyond the raw `chart.tsx` Recharts wrapper, and chart usage across the app is minimal despite `recharts` being a dependency.

## 5. Layout shell & navigation

- `app/(app)/*` — the authenticated shell: a left sidebar (`components/layout/sidebar-nav.tsx`) with per-role nav items, a top bar (`app-topbar.tsx`) with a `StatusCard` (balance + diamonds + Premium badge, shown to students) and a `user-menu`.
- `app/(marketing)/*` — public pages (home, course/book catalogs, legal pages) with their own `public-navbar`/`public-footer`.
- `app/(auth)/*` — login/register, unstyled shell.
- Content pages live inside a `Container` (`components/layout/container.tsx`) that caps width; most authenticated pages do **not** set an explicit `max-w-*` themselves and rely on this shell — a couple of one-off pages were found hand-overriding this (e.g. an accidental `max-w-10xl`), which is a bug/inconsistency worth cleaning up in a redesign, not a deliberate pattern.

**Sidebar nav items per role** (from `lib/roles.ts`):

| Student | Teacher | Admin / Superadmin |
|---|---|---|
| Bosh sahifa | Bosh sahifa | Bosh sahifa |
| Mening kurslarim | Kurslarim | Foydalanuvchilar |
| Testlar | Testlar | Kurslar |
| Kutubxona | Kitoblarim | Testlar |
| Sertifikatlar | Mukofotlar | Kategoriyalar |
| Mukofotlar | Statistika | Kitob kategoriyalari |
| Kunlik barabon | | Mukofotlar |
| Hamyon | | Yutuqlar |
| | | Promo kodlar |
| | | To'lovlar |

**Shared nav items (all roles, usually in the user/account menu)**: Reyting (leaderboard), Premium, To'lovlar tarixi, Bildirishnomalar, Profil.

## 6. Established UI conventions (from recent redesign passes)

Several pages were recently redesigned by hand toward a consistent "modern" language; this is the de-facto target style to extend, not the admin section's older style:

- **Cards**: `rounded-2xl`, `border-border/70`, `shadow-xs` at rest, `hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5` on hover, `transition-all duration-300`. Used for quiz cards, book cards, reward cards, leaderboard rows.
- **Icon tiles**: a small rounded-2xl `size-11` square with a tinted background (`bg-primary/10 text-primary`) holding a Lucide icon, used as a leading visual on list rows and card headers.
- **Status badges**: pill-shaped (`rounded-full`), colored via the `/10`-fill + `ring-1` pattern described in §3, always paired with a small leading icon (`CheckCircle2`, `XCircle`, `Hourglass`, `Crown`, …).
- **Stat trays**: a strip of small metric chips (icon + value, `rounded-lg`/`rounded-full`, `ring-1 ring-border/60`, `bg-background`) grouped inside a softer `bg-muted/40` tray — used for teacher/leaderboard rows with many metrics (courses, quizzes, students, rating…).
- **Filter bars**: a `rounded-2xl border bg-card p-3` row combining a left-aligned search `Input` (icon-prefixed) with one or more `Select` filters and an optional "clear filters" icon button; result count shown as muted text below when filters are active; a dedicated empty state ("hech narsa topilmadi") distinct from the "no data at all" empty state.
- **Sortable tables**: clickable `TableHead`s with a trailing `ArrowUp`/`ArrowDown`/`ArrowUpDown` indicator, client-side sort state.
- **Export flow** (one instance so far, quiz results): a `Download` button opens a `Dialog` with a column-selection checklist and a two-option format picker (Excel/PDF as selectable cards), footer with a single confirm button.
- **Empty/loading/error states**: every data-driven page follows the same triad — `Skeleton*` while loading, `ErrorState` with retry on failure, `EmptyState` (icon + title [+ description] [+ action]) when there's no data.
- **Avatars**: initials fallback over `AvatarImage`, sized via the `size` prop (`sm|default|lg|xl`), sometimes with a small overlapping badge (rank medal, verification dot).
- **Diamonds/currency**: always rendered as `<Image src="/diamond.png" .../>` next to a formatted count, usually inside a `bg-gold/10 text-gold-foreground rounded-full` pill.

## 7. Full site map

Grouped by role. "Modern" = already styled toward §6; "Dense/admin" = older table-heavy convention (see §8). Dynamic segments shown as `[param]`.

### Public / marketing (`app/(marketing)/*`, no login required)
| Route | Purpose |
|---|---|
| `/` | Landing page — hero, feature highlights, role-based CTAs |
| `/courses`, `/courses/[id]` | Public course catalog + course detail (read-only, no enrollment UI) |
| `/books`, `/books/[id]` | Public library catalog + book detail, download link |
| `/certificates/verify`, `/certificates/verify/[number]` | Public certificate authenticity checker |
| `/donate` | Donation page |
| `/oferta`, `/maxfiylik-siyosati` | Legal: terms of service, privacy policy |

### Auth (`app/(auth)/*`)
| Route | Purpose |
|---|---|
| `/login` | Phone + password login |
| `/register`, `/register/pending` | Registration, "awaiting verification" screen (new accounts need admin approval) |

### Shared authenticated pages (`app/(app)/*`, any role)
| Route | Purpose |
|---|---|
| `/dashboard` | Generic landing after login (role-aware redirect target) |
| `/leaderboard` | **Modern.** Student diamond ranking (podium for top 3 + list) and teacher activity ranking in tabs; teacher tab hidden from students |
| `/premium` | Premium plan picker (30/90/180/365-day plans) + checkout |
| `/payments`, `/payment/[invoiceId]` | Payment history and a single invoice/checkout status screen |
| `/notifications` | Notification inbox (read/unread, links into quiz results etc.) |
| `/profile` | Account settings: name/phone, password, avatar, Telegram link |

### Student (`app/(app)/student/*`)
| Route | Purpose |
|---|---|
| `/student` | Student dashboard — progress summary, quick links |
| `/student/courses`, `/student/courses/[enrollmentId]` | Enrolled courses list + a single course's lesson list/progress |
| `/student/lessons/[id]` | Lesson viewer (content, attachments, video, "mark complete") |
| `/student/quizzes`, `/student/quizzes/[id]` | Available quizzes list + quiz detail/start screen |
| `/student/quizzes/[id]/attempts/[attemptId]` | Live quiz-taking screen (answer questions, submit) |
| `/student/rewards` | **Modern (just redesigned).** Rewards catalog — balance card, filter pills (Barchasi/Olsa bo'ladi/Premium), sort, reward grid with stock/premium badges, redeem flow |
| `/student/rewards/redemptions` | "Mening yutuqlarim" — redemption history with status (pending/approved/delivered/rejected) |
| `/student/daily-spin` | Daily gamified spin-wheel for bonus diamonds |
| `/student/wallet` | Diamond/balance wallet overview |
| `/student/certificates` | Earned certificates list, each with a verification number |

### Teacher (`app/(app)/teacher/*`)
| Route | Purpose |
|---|---|
| `/teacher` | Teacher dashboard |
| `/teacher/courses`, `/teacher/courses/new`, `/teacher/courses/[id]` | Course CRUD, lesson management within a course |
| `/teacher/lessons/[id]` | Edit a single lesson (content, attachments, video) |
| `/teacher/books`, `/teacher/books/new`, `/teacher/books/[id]` | **Modern (just redesigned, incl. cover zoom-on-click & download tracking).** Uploaded-books CRUD |
| `/teacher/quizzes`, `/teacher/quizzes/new`, `/teacher/quizzes/[id]` | **Modern (just redesigned: search/filter, cards).** Quiz CRUD, question builder |
| `/teacher/quizzes/[id]/results` | **Modern (just redesigned: search/filter/sort, Excel/PDF export).** Per-student results table, grouped by student with multi-attempt drill-down, manual grading entry point for open-ended questions |
| `/teacher/quizzes/[id]/results/[attemptId]` | **Modern (just redesigned).** Single attempt detail — score hero, per-question breakdown, attempt switcher pills, manual grading dialog for open-ended answers |
| `/teacher/stats` | Teaching stats: courses, students, rating, revenue, quiz pass rates |

### Admin / Superadmin (`app/(app)/admin/*`)
| Route | Purpose |
|---|---|
| `/admin` | Admin dashboard/overview |
| `/admin/users` | **Dense/admin (just touched: role filter + action-menu cleanup, still `rounded-md` table convention).** User CRUD, verification, block/unblock, role & grade |
| `/admin/courses`, `/admin/quizzes`, `/admin/categories`, `/admin/book-categories` | **Dense/admin.** Catalog moderation — approve/edit/delete courses, quizzes, categories |
| `/admin/rewards`, `/admin/redemptions` | **Dense/admin.** Reward catalog CRUD; redemption queue (approve → deliver, or reject) |
| `/admin/promo-codes` | **Dense/admin.** Discount code CRUD |
| `/admin/payments` | **Dense/admin.** Platform-wide payment ledger |

## 8. Known inconsistencies worth a redesign's attention

- **Two visual eras coexist.** Teacher/student-facing pages (quizzes, results, leaderboard, rewards, books) have been pushed toward the "modern" language in §6; the `admin/*` section still largely uses an older, denser convention — `rounded-md` cards, uppercase-tracked dense table headers (`text-xs uppercase tracking-wide` on a `bg-muted/40` row) — which reads as a different product. A unified system should pick one direction (or deliberately define "admin = dense data-table mode" vs "app = card mode" as an intentional split).
- **No typographic hierarchy beyond one font.** Headings and body text share the same Geist Sans family; scale/weight do the work. A redesign could introduce real type scale tokens (currently ad hoc `text-xl`/`text-2xl`/`font-heading` per page) or a second display face.
- **Status-pill color logic is copy-pasted per page**, not a `Badge` variant — risk of drift (e.g. "passed" sometimes emerald, sometimes the shadcn default `success` token exists but isn't always used).
- **A couple of experimental CSS helpers** (`.animate-glow`, `.glass-card`, `.bg-grid-pattern`, `.shimmer-btn`) are defined but used in zero or one place — either adopt them intentionally or drop them.
- **Dense multi-metric rows** (teacher leaderboard entries: courses/quizzes/lessons/books/rating/students all in one chip tray) are information-dense; worth reconsidering for a scan-friendly layout (e.g. progressive disclosure, or a proper data table) rather than six small chips in a row.

## 9. Reference assets

- `public/logo.png`, `public/logo-white.png` — wordmark, light/dark variants.
- `public/diamond.png` — the gamified-currency icon, used everywhere currency is shown.
- No icon font/sprite — all iconography is Lucide React (outline style, 1.5px stroke by default).

## 10. Formatting & copy conventions

- **Numbers**: `Intl.NumberFormat('uz-UZ')` everywhere (thousand separators), e.g. `12 500`.
- **Money**: stored in tiyin (1 so'm = 100 tiyin) and rendered as `"12 500 so'm"`, or `"Bepul"` (free) when zero.
- **Dates**: `"01.01.2026"` (day.month.year); with time: `"10:10 01.01.2026"`. Timestamps tied to quiz attempts are always rendered in Asia/Tashkent wall-clock time regardless of viewer's browser timezone.
- **Relative time**: `"Hozirgina"`, `"N daqiqa oldin"`, `"N soat oldin"`, `"Kecha"`, `"N kun oldin"`, `"N hafta oldin"`, then falls back to the absolute date past 30 days.
- **Duration**: `"8 daqiqa 20 soniya"` or just `"45 soniya"` if under a minute.
- **Avatar fallback**: initials, max 2 letters, from the first two words of the name.
- **Common verbs/labels**: Yuklab olish (download), Yuklash (upload), Saqlash (save), Bekor qilish (cancel), Tasdiqlash (confirm/verify — overloaded, used both for "approve user" and "confirm destructive action"), O'chirish (delete), Tahrirlash (edit), Qidirish (search), Filtrlash (filter), Barchasi (all/clear filter), Hech narsa topilmadi (no results for current filter), Hali ... mavjud emas (empty state, nothing exists yet).

## 11. Core data models

TypeScript source of truth: `types/index.ts`. Field tables below list the shape as seen by the frontend; `?` = optional. Populated relations (e.g. `course.teacher`) arrive either as a full object or just an id string depending on endpoint — screens must handle both.

### User
| Field | Type | Notes |
|---|---|---|
| `_id`, `name`, `phone` | string | phone is the login identifier, format `998XXXXXXXXX` |
| `role` | `student \| teacher \| admin \| superadmin` | |
| `grade` | `{ number: number\|null, letter: string\|null }` | students only, e.g. `{ number: 7, letter: "A" }` → shown as "7-A" |
| `avatar` | string? | relative path, resolved via `resolveAssetUrl` |
| `diamonds`, `balance` | number | balance is in tiyin |
| `tarif` | `standart \| premium` | |
| `premiumExpiresAt` | ISO string \| null | |
| `isBlocked`, `isVerified` | boolean | new accounts start unverified, admin must verify |
| `lastLogin`, `createdAt` | ISO string | |

### Course
`{ _id, title, description, category: Category|string, teacher?: User|string, price (tiyin), thumbnail?, isPublished?, rating?, reviewsCount?, studentsCount?, lessonsCount?, createdAt? }`

### Lesson
`{ _id, course, title, description?, content?, order, videoUrl?, attachments?: string[], isCompleted? }`

### Book
`{ _id, title, author, description?, category: BookCategory|string, grade?, uploadedBy?, coverImage?, file?, isPublished?, downloadsCount? }`

### Quiz
`{ _id, title, description?, targetType: standalone|course|lesson, targetId?, createdBy?, passingScore (%), maxAttempts, timeLimit? (minutes), targetGrades: TargetGrade[], isActive?, questions?: Question[], questionsCount? }`

- `TargetGrade`: `{ number, letter?, availableFrom?, availableUntil?, maxAttempts?, timeLimit?, effectiveMaxAttempts?, effectiveTimeLimit? }` — per-grade overrides; `effective*` fields reflect Premium-driven caps (a non-Premium grade can be capped below the quiz's own `maxAttempts`, surfaced in UI with a gold "Premium" nudge).
- `Question`: `{ _id, quiz, text, type: multiple_choice|true_false|open_ended, options?: {label, text}[], correctAnswer?, sampleAnswer?, points, order? }`

### Attempt
`{ _id, quiz, student, answers: EvaluatedAnswer[], totalPoints?, earnedPoints?, scorePercent?, status: in_progress|submitted|reviewed, passed?, attemptNumber?, startedAt?, submittedAt?, durationSeconds? }`

- `status: "submitted"` = waiting on teacher to manually grade open-ended questions before a final score/pass-fail exists.
- `EvaluatedAnswer`: `{ question, givenAnswer?, isCorrect, pointsEarned, feedback? }`

### Reward
`{ _id, title, description?, cost (diamonds), stock: number|null (null = unlimited), image?, premiumOnly? }`

### Redemption
`{ _id, reward, student, diamondsSpent, status: pending|approved|delivered|rejected, adminNote?, approvedBy?, rejectedBy?, rejectReason?, deliveredBy?, deliveryNote?, createdAt }`

### TeacherRanking (leaderboard row, computed/derived — not a stored entity)
`{ rank, _id, name, avatar?, coursesCount, quizzesCount, lessonsCount, booksCount, studentsCount, avgRating, activityScore }`

### Other entities
- `Notification`: `{ _id, user, title, message, type?, meta?: {quizId?, attemptId?, studentId?, url?}, isRead, createdAt }`
- `Certificate`: `{ _id, certificateNumber, student, course, issuedAt }`
- `PromoCode`: `{ _id, code, discountPercent, expiresAt, maxUses, usedCount?, isActive }`
- `Invoice` / `PaymentRecord`: payment purpose is `wallet|course|premium|donation`; status is `draft|progress|billing|hold|success|error|revert` (Multicard-style payment gateway states).
- `Paginated<T>`: `{ items: T[], total, page, limit, totalPages }` — the universal list-response envelope.

## 12. Mock dataset

Realistic sample content (reusing names/items actually seen in the live app during recent design reviews) for populating mockups without inventing placeholder content.

### Students (for leaderboard / user list / quiz results screens)
```json
[
  { "name": "Ali", "grade": "1-A", "diamonds": 420, "rank": 1 },
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

### Teachers (for leaderboard / admin user list)
```json
[
  { "name": "Husan", "phone": "998906762920", "coursesCount": 3, "quizzesCount": 7, "lessonsCount": 12, "booksCount": 4, "studentsCount": 86, "avgRating": 4.8 },
  { "name": "Karimboyev Mamurjon", "coursesCount": 2, "quizzesCount": 5, "lessonsCount": 9, "booksCount": 1, "studentsCount": 54, "avgRating": 4.5 },
  { "name": "Berikboyeva Shahriza", "coursesCount": 1, "quizzesCount": 3, "lessonsCount": 6, "booksCount": 2, "studentsCount": 31, "avgRating": 4.9 }
]
```

### Course
```json
{
  "title": "Nodejs Praktikum",
  "description": "NodeJS backend kurs",
  "category": "Dasturlash",
  "teacher": { "name": "Husan", "phone": "998906762920" },
  "price": 25000000,
  "isPublished": true,
  "studentsCount": 86,
  "lessonsCount": 12,
  "rating": 4.8
}
```

### Quizzes (list screen)
```json
[
  { "title": "Matematika", "questionsCount": 2, "passingScore": 60, "isActive": false, "grades": ["2-sinf"] },
  { "title": "test", "questionsCount": 0, "passingScore": 60, "isActive": false, "grades": [] },
  { "title": "Ingliz tili", "questionsCount": 10, "passingScore": 60, "isActive": true, "grades": [] },
  { "title": "Matematika 2", "questionsCount": 10, "passingScore": 60, "isActive": true, "grades": ["1-A"] }
]
```

### Quiz attempt (for results/attempt-detail screens)
```json
{
  "student": "Ali",
  "grade": "1-A",
  "scorePercent": 100,
  "earnedPoints": 10,
  "totalPoints": 10,
  "passed": true,
  "attemptNumber": 1,
  "status": "reviewed",
  "startedAt": "2026-08-10T05:22:00+05:00",
  "submittedAt": "2026-08-10T05:23:00+05:00",
  "durationSeconds": 57,
  "questions": [
    { "text": "2+2=4", "type": "true_false", "isCorrect": true, "points": 1 },
    { "text": "5+5=?", "type": "multiple_choice", "options": ["20", "10", "5", "15"], "correctAnswer": "10", "givenAnswer": "10", "isCorrect": true, "points": 1 },
    { "text": "3+3=?", "type": "open_ended", "givenAnswer": "6", "sampleAnswer": "6", "isCorrect": true, "points": 1 }
  ]
}
```

### Rewards catalog
```json
[
  { "title": "Ruchka", "cost": 12, "stock": 2 },
  { "title": "O'chirg'ich", "cost": 15, "stock": 15 },
  { "title": "O'chirg'ich", "cost": 15, "stock": 7, "note": "1 donadan beriladi" },
  { "title": "Ruchka", "cost": 20, "stock": 18 },
  { "title": "Kitob", "cost": 25, "stock": 0, "note": "Mukammal Dasturlash 2 — JavaScript" },
  { "title": "Ruchka", "cost": 30, "stock": 6 },
  { "title": "Spinner", "cost": 30, "stock": 1 },
  { "title": "Qalamdon", "cost": 45, "stock": 3 },
  { "title": "Simsiz quloqchin", "cost": 50, "stock": 0, "premiumOnly": true },
  { "title": "Bakal", "cost": 100, "stock": 1, "description": "yaxshi" }
]
```

### Current student balance (for header/status-card mockups)
```json
{ "diamonds": 32, "balance_som": 0, "tarif": "standart" }
```

## 13. What to actually redesign

*(Fill this in before sending — §1–12 are a snapshot of "what exists today," not a brief of desired changes. At minimum, specify: which surfaces are in scope — e.g. just the student app, or admin too; whether the goal is a visual refresh within the current structure, or a deeper IA/navigation rework; and any brand constraints, such as whether `primary` indigo and the gold/diamond motif are fixed or open to change.)*
