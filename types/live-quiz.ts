// Jonli viktorina (Super-ustoz) — REST va Socket.IO ma'lumot tiplari

export type PointsMultiplier = 0 | 1 | 2;

export interface LiveQuizQuestion {
  _id?: string;
  // Markdown, ≤2000 belgi, ko'pi bilan 3 ta rasm (/uploads/live-quiz/...)
  text: string;
  image?: string | null;
  // 2–4 ta oddiy matn, har biri ≤120 belgi
  options: string[];
  correctIndex: number;
  // 5–120 soniya
  timeLimit: number;
  pointsMultiplier: PointsMultiplier;
}

export interface LiveQuizSummary {
  _id: string;
  title: string;
  description?: string;
  questionCount: number;
  coverImage?: string | null;
  updatedAt: string;
}

export interface LiveQuiz extends LiveQuizSummary {
  questions: LiveQuizQuestion[];
}

export interface LiveQuizPayload {
  title: string;
  description?: string;
  questions?: LiveQuizQuestion[];
}

export interface LiveSessionCreated {
  pin: string;
  sessionId: string;
  quizTitle: string;
  totalQuestions: number;
}

export interface LiveJoinInfo {
  pin: string;
  quizTitle: string;
  status: LiveGameStatus;
  joinable: boolean;
  playerCount: number;
}

export interface LivePodiumEntry {
  rank?: number;
  id?: string;
  name: string;
  score: number;
  correctCount?: number;
}

export interface LiveSessionSummary {
  _id: string;
  pin: string;
  startedAt: string;
  endedAt?: string | null;
  playerCount: number;
  podium: LivePodiumEntry[];
}

export interface LiveSessionPlayer {
  rank?: number;
  name: string;
  score: number;
  correctCount?: number;
  // Login qilgan o'quvchi bo'lsa — platformadagi akkaunti
  user?: string | { _id: string; name?: string } | null;
}

export interface LiveSessionQuestion {
  text: string;
  image?: string | null;
  options: string[];
  correctIndex: number;
  distribution?: number[];
  answered?: number;
  correctCount?: number;
  timeLimit?: number;
  pointsMultiplier?: PointsMultiplier;
}

export interface LiveSessionResult {
  _id?: string;
  quizId?: string;
  quizTitle: string;
  startedAt: string;
  endedAt?: string | null;
  players: LiveSessionPlayer[];
  questions: LiveSessionQuestion[];
}

export interface LiveImportResult {
  quiz: LiveQuiz;
  imported: number;
  skipped: { index: number; text: string; reason: string }[];
}

// ---------- Socket.IO ----------

export type LiveGameStatus = 'lobby' | 'question' | 'reveal' | 'finished';

export interface LiveAck<T = unknown> {
  ok: boolean;
  code?: string;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface LiveLobbyPlayer {
  id: string;
  name: string;
  connected: boolean;
  isPlatformUser?: boolean;
}

export interface LiveQuestionStart {
  index: number;
  total: number;
  text: string;
  image?: string | null;
  options: string[];
  timeLimit: number;
  pointsMultiplier: PointsMultiplier;
  endsAt: number;
  serverNow: number;
}

export interface LiveLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  score: number;
  correctCount?: number;
  streak?: number;
}

export interface LiveQuestionEnd {
  index: number;
  correctIndex: number;
  distribution: number[];
  answered: number;
  total: number;
  leaderboard: LiveLeaderboardEntry[];
  isLast: boolean;
}

export interface LiveQuestionResult {
  index: number;
  answered: boolean;
  correct: boolean;
  correctIndex: number;
  points: number;
  score: number;
  streak: number;
  rank: number;
  totalPlayers: number;
}

export interface LiveHostGameEnd {
  podium: LiveLeaderboardEntry[];
  leaderboard: LiveLeaderboardEntry[];
  totalPlayers: number;
  totalQuestions: number;
}

export interface LivePlayerGameEnd {
  rank: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  totalPlayers: number;
}

export interface LiveHostSnapshot {
  pin: string;
  sessionId: string;
  quizTitle: string;
  status: LiveGameStatus;
  totalQuestions: number;
  currentIndex: number;
  players: LiveLobbyPlayer[];
  question?: Partial<LiveQuestionStart> & { distribution?: number[] };
  answered?: number;
  leaderboard?: LiveLeaderboardEntry[];
  correctIndex?: number;
  distribution?: number[];
}

export interface LivePlayerSnapshot {
  pin: string;
  quizTitle: string;
  status: LiveGameStatus;
  playerId: string;
  name: string;
  score: number;
  totalQuestions: number;
  question?: Partial<LiveQuestionStart>;
  alreadyAnswered?: boolean;
  rank?: number;
  totalPlayers?: number;
  playerCount?: number;
}
