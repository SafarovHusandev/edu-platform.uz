export type Role = "student" | "teacher" | "admin" | "superadmin"

export interface Grade {
  number: number | null
  letter: string | null
}

export type Tarif = "standart" | "premium"

export interface User {
  _id: string
  name: string
  phone: string
  role: Role
  grade?: Grade
  avatar?: string
  diamonds?: number
  balance?: number
  tarif?: Tarif
  isBlocked?: boolean
  isVerified?: boolean
  telegramId?: number | null
  telegramUsername?: string | null
  lastLogin?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  _id: string
  name: string
  description?: string
  createdAt?: string
}

export interface Course {
  _id: string
  title: string
  description: string
  category: Category | string
  teacher?: User | string
  price: number
  thumbnail?: string
  isPublished?: boolean
  rating?: number
  reviewsCount?: number
  studentsCount?: number
  lessonsCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface BookCategory {
  _id: string
  name: string
  slug: string
  description?: string
  icon?: string | null
  isActive?: boolean
  createdAt?: string
}

export interface Book {
  _id: string
  title: string
  author: string
  description?: string
  category: BookCategory | string
  grade?: number | null
  uploadedBy?: User | string
  coverImage?: string | null
  file?: string | null
  isPublished?: boolean
  downloadsCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface Lesson {
  _id: string
  course: string
  title: string
  description?: string
  content?: string
  order: number
  material?: string
  isCompleted?: boolean
  createdAt?: string
}

export interface Enrollment {
  _id: string
  student: User | string
  course: Course | string
  progress?: number
  completedLessons?: string[]
  isCompleted?: boolean
  createdAt?: string
}

export interface Review {
  _id: string
  course: string
  student: User | string
  rating: number
  comment: string
  createdAt?: string
}

export interface Notification {
  _id: string
  user: string
  title: string
  message: string
  type?: string
  meta?: { quizId?: string; attemptId?: string; studentId?: string }
  isRead: boolean
  createdAt: string
}

export type QuestionType = "multiple_choice" | "true_false" | "open_ended"

export interface QuestionOption {
  label: string
  text: string
}

export interface Question {
  _id: string
  quiz: string
  text: string
  type: QuestionType
  options?: QuestionOption[]
  correctAnswer?: number | boolean | null
  sampleAnswer?: string
  points: number
  order?: number
}

export type QuizTargetType = "standalone" | "course" | "lesson"

export interface Quiz {
  _id: string
  title: string
  description?: string
  targetType: QuizTargetType
  targetId?: string | null
  createdBy?: User | string
  passingScore: number
  maxAttempts: number
  timeLimit?: number | null
  availableFrom?: string | null
  availableUntil?: string | null
  grade?: number
  isActive?: boolean
  questions?: Question[]
  questionsCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface AttemptAnswer {
  questionId: string
  givenAnswer: number | string | boolean
}

export interface EvaluatedAnswer {
  question: string
  givenAnswer?: number | string | boolean | null
  isCorrect: boolean
  pointsEarned: number
  feedback?: string | null
}

export type AttemptStatus = "in_progress" | "submitted" | "reviewed"

export interface Attempt {
  _id: string
  quiz: string | Quiz
  student: string | User
  answers: EvaluatedAnswer[]
  totalPoints?: number
  earnedPoints?: number
  scorePercent?: number
  status: AttemptStatus
  passed?: boolean
  attemptNumber?: number
  startedAt?: string
  submittedAt?: string
  durationSeconds?: number | null
}

export type PaymentPurpose = "wallet" | "course" | "premium" | "donation"
export type PaymentStatus = "draft" | "progress" | "billing" | "hold" | "success" | "error" | "revert"

export interface Invoice {
  invoiceId: string
  purpose: PaymentPurpose
  amount: number
  status: PaymentStatus
  checkoutUrl?: string
  courseId?: string
  createdAt?: string
}

export interface Reward {
  _id: string
  title: string
  description?: string
  cost: number
  stock: number | null
  image?: string
  createdAt?: string
}

export type RedemptionStatus = "pending" | "delivered" | "rejected"

export interface Redemption {
  _id: string
  reward: Reward | string
  student: User | string
  diamondsSpent: number
  status: RedemptionStatus
  adminNote?: string
  createdAt: string
}

export interface Certificate {
  _id: string
  certificateNumber: string
  student: User | string
  course: Course | string
  issuedAt: string
}

export interface PromoCode {
  _id: string
  code: string
  discountPercent: number
  expiresAt: string
  maxUses: number
  usedCount?: number
  isActive: boolean
}

export interface QuizStatsSummary {
  totalQuizzes: number
  totalAttempts: number
  avgScore: number
  passRate: number
}

export interface TeacherStats {
  courses: { total: number; published: number }
  students: { total: number }
  rating: { avg: number }
  revenue: { total: number }
  quizzes: QuizStatsSummary
}

export interface CourseStats {
  enrollment: { active: number; completed: number; total: number; completionRate: number }
  rating: { avg: number; count: number }
  revenue: { total: number; paymentCount: number }
  quizzes: QuizStatsSummary
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiErrorShape {
  message: string
  errors?: Record<string, string[]>
}
