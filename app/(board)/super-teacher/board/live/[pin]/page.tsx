'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  BarChart3,
  Flag,
  Loader2,
  Play,
  SkipForward,
  Trophy,
  UserX,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BoardLayout, boardButton } from '@/components/super-teacher/board-layout';
import {
  BoardQuestion,
  DistributionBars,
  LeaderboardList,
  OptionGrid,
  useCountdown,
  type BoardQuestionData,
} from '@/components/live-quiz/board-views';
import { QuestionMarkdown } from '@/components/live-quiz/question-markdown';
import { ackField, useLiveSocket, type LiveCall } from '@/hooks/use-live-socket';
import { getFrontendUrl } from '@/lib/config';
import { SILENT_CODES, liveErrorMessage } from '@/lib/live-quiz';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  LiveAck,
  LiveGameStatus,
  LiveHostGameEnd,
  LiveHostSnapshot,
  LiveLeaderboardEntry,
  LiveLobbyPlayer,
  LiveQuestionEnd,
  LiveQuestionStart,
} from '@/types/live-quiz';

const LIST_HREF = '/super-teacher/live-quiz';
const FORBIDDEN_CODES = new Set(['UNAUTHORIZED', 'FORBIDDEN', 'NOT_HOST']);

type HostQuestion = BoardQuestionData & { endsAt?: number; offset: number };

function toHostQuestion(
  q: Partial<LiveQuestionStart>,
  fallback: { index: number; total: number }
): HostQuestion {
  return {
    index: q.index ?? fallback.index,
    total: q.total ?? fallback.total,
    text: q.text ?? '',
    image: q.image ?? null,
    options: q.options ?? [],
    timeLimit: q.timeLimit ?? 20,
    pointsMultiplier: q.pointsMultiplier ?? 1,
    endsAt: q.endsAt,
    offset: q.serverNow ? q.serverNow - Date.now() : 0,
  };
}

function formatPin(pin: string) {
  return pin.length === 6 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin;
}

// ---------- Lobby ----------

function Lobby({
  pin,
  quizTitle,
  players,
  onKick,
  onStart,
  busy,
}: {
  pin: string;
  quizTitle: string;
  players: LiveLobbyPlayer[];
  onKick: (player: LiveLobbyPlayer) => void;
  onStart: () => void;
  busy: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const frontend = getFrontendUrl();
  const joinUrl = `${frontend}/live?pin=${pin}`;
  const shortHost = `${frontend.replace(/^https?:\/\//, '')}/live`;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-[clamp(1.25rem,2vw,2rem)] font-semibold text-white/80">
            Telefonda oching: <strong className="text-white">{shortHost}</strong>
          </p>
          <p className="text-[clamp(1.1rem,1.6vw,1.6rem)] uppercase tracking-[0.3em] text-white/60">
            O&apos;yin PIN kodi
          </p>
          <p className="rounded-3xl bg-white px-10 py-4 font-heading text-[clamp(4rem,10vw,9rem)] font-bold leading-none tracking-wider text-[#141B3D] tabular-nums">
            {formatPin(pin)}
          </p>
          <p className="max-w-xl text-[clamp(1.1rem,1.6vw,1.75rem)] font-semibold text-white/85">{quizTitle}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-3xl bg-white p-5">
            <QRCodeSVG value={joinUrl} size={280} level="M" className="size-[clamp(12rem,22vw,20rem)]" />
          </div>
          <p className="text-lg text-white/70">Kamera bilan skanerlang</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6">
        <p className="flex items-center gap-3 text-[clamp(1.5rem,2.4vw,2.5rem)] font-bold">
          <Users className="size-[1.2em]" />
          <span className="tabular-nums">{players.length}</span> ishtirokchi
        </p>
        <button
          type="button"
          className={boardButton('success', 'min-h-20 px-12 text-[clamp(1.5rem,2.2vw,2.25rem)]')}
          disabled={players.length === 0 || busy}
          onClick={onStart}
        >
          {busy ? <Loader2 className="size-8 animate-spin" /> : <Play className="size-8" />}
          Boshlash
        </button>
      </div>

      {players.length === 0 ? (
        <p className="py-6 text-center text-[clamp(1.25rem,2vw,2rem)] text-white/60">
          O&apos;quvchilar qo&apos;shilishini kuting…
        </p>
      ) : (
        <ul className="flex flex-wrap justify-center gap-3" aria-label="Qo'shilgan ishtirokchilar">
          {players.map((player) => {
            const active = selected === player.id;
            return (
              <li key={player.id} className="live-pop-in">
                {active ? (
                  <span className="flex min-h-16 items-center gap-2 rounded-2xl bg-white p-2 pl-5 text-[clamp(1.25rem,1.8vw,1.9rem)] font-bold text-[#141B3D]">
                    {player.name}
                    <button
                      type="button"
                      className={boardButton('danger', 'min-h-12 px-4 text-lg')}
                      onClick={() => {
                        onKick(player);
                        setSelected(null);
                      }}
                    >
                      <UserX className="size-5" /> Chiqarish
                    </button>
                    <button
                      type="button"
                      aria-label="Bekor qilish"
                      className="flex size-12 items-center justify-center rounded-xl bg-[#141B3D]/10"
                      onClick={() => setSelected(null)}
                    >
                      <X className="size-5" />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelected(player.id)}
                    className={cn(
                      'min-h-16 rounded-2xl bg-white/15 px-6 text-[clamp(1.25rem,1.8vw,1.9rem)] font-bold transition-opacity active:scale-[0.97]',
                      !player.connected && 'opacity-40'
                    )}
                    title={player.connected ? undefined : 'Ulanish uzilgan'}
                  >
                    {player.name}
                    {!player.connected && <WifiOff className="ml-2 inline size-5" />}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- Natija (question:end) ----------

function Reveal({
  question,
  reveal,
  onNext,
  busy,
}: {
  question: HostQuestion | null;
  reveal: LiveQuestionEnd;
  onNext: () => void;
  busy: boolean;
}) {
  const options = question?.options ?? reveal.distribution.map((_, i) => `${i + 1}`);
  return (
    <div className="flex flex-1 flex-col gap-6">
      {question && (
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-full bg-white/15 px-4 py-1.5 font-heading text-[clamp(1.1rem,1.6vw,1.6rem)] font-bold tabular-nums">
            {reveal.index + 1} / {question.total}
          </span>
          <QuestionMarkdown
            text={question.text}
            variant="board"
            className="min-w-0 flex-1 !text-left !text-[clamp(1.25rem,2vw,2.25rem)]"
          />
        </div>
      )}
      <div className="grid flex-1 gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-6">
          {reveal.distribution.length > 0 && (
            <DistributionBars
              options={options}
              distribution={reveal.distribution}
              correctIndex={reveal.correctIndex}
            />
          )}
          <p className="text-center text-[clamp(1.1rem,1.6vw,1.6rem)] text-white/75">
            Javob berdi: {reveal.answered} / {reveal.total}
          </p>
          <OptionGrid options={options} correctIndex={reveal.correctIndex} />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-3 font-heading text-[clamp(1.5rem,2.2vw,2.25rem)] font-bold">
            <Trophy className="size-[1.1em] text-[#FFC62E]" /> Top-5
          </h2>
          <LeaderboardList entries={reveal.leaderboard} limit={5} />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          className={boardButton('primary', 'min-h-20 px-12 text-[clamp(1.4rem,2vw,2rem)]')}
          onClick={onNext}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-7 animate-spin" /> : reveal.isLast ? <Flag className="size-7" /> : <SkipForward className="size-7" />}
          {reveal.isLast ? 'Yakuniy natijalar' : 'Keyingi savol'}
        </button>
      </div>
    </div>
  );
}

// ---------- Yakun ----------

const PODIUM_LAYOUT = [
  { place: 2, height: 'h-[26vh]', color: 'bg-[#C0C7D6] text-[#141B3D]', delay: 1 },
  { place: 1, height: 'h-[36vh]', color: 'bg-[#FFC62E] text-[#3A2800]', delay: 2 },
  { place: 3, height: 'h-[18vh]', color: 'bg-[#D08A4E] text-[#2B1300]', delay: 0 },
];

function Podium({ podium }: { podium: LiveLeaderboardEntry[] }) {
  // 3-, 2-, 1-o'rin navbat bilan chiqadi
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [700, 1900, 3300].map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {PODIUM_LAYOUT.map(({ place, height, color, delay }) => {
        const entry = podium.find((p) => p.rank === place) ?? podium[place - 1];
        const visible = step > delay;
        return (
          <div key={place} className="flex w-[clamp(8rem,20vw,18rem)] flex-col items-center gap-3">
            <div
              className={cn(
                'flex min-h-24 flex-col items-center justify-end text-center transition-all duration-700',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              )}
            >
              {entry && (
                <>
                  <span className="max-w-full truncate text-[clamp(1.25rem,2.2vw,2.5rem)] font-bold">
                    {entry.name}
                  </span>
                  <span className="font-heading text-[clamp(1rem,1.6vw,1.75rem)] tabular-nums text-white/80">
                    {formatNumber(entry.score)}
                  </span>
                </>
              )}
            </div>
            <div
              className={cn(
                'flex w-full items-start justify-center rounded-t-3xl pt-4 font-heading text-[clamp(3rem,6vw,6rem)] font-bold transition-all duration-700',
                color,
                visible ? height : 'h-6',
                !entry && 'opacity-30'
              )}
            >
              {visible && place}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Finished({
  final,
  sessionId,
  onClose,
  busy,
}: {
  final: LiveHostGameEnd;
  sessionId?: string;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <h1 className="text-center font-heading text-[clamp(2rem,4vw,4rem)] font-bold">G&apos;oliblar</h1>
      <Podium podium={final.podium} />
      {final.leaderboard.length > 3 && (
        <div className="mx-auto w-full max-w-4xl">
          <LeaderboardList
            entries={final.leaderboard.slice(3)}
            className="max-h-[40vh] overflow-y-auto pr-2"
          />
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-4">
        {sessionId && (
          <Link
            href={`/super-teacher/live-quiz/results/${sessionId}`}
            className={boardButton('secondary', 'min-h-20 px-10 text-2xl')}
            onClick={() => document.fullscreenElement && document.exitFullscreen().catch(() => {})}
          >
            <BarChart3 className="size-7" /> Batafsil natijalar
          </Link>
        )}
        <button
          type="button"
          className={boardButton('primary', 'min-h-20 px-10 text-2xl')}
          onClick={onClose}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-7 animate-spin" /> : <X className="size-7" />}
          Yopish
        </button>
      </div>
    </div>
  );
}

// ---------- Sahifa ----------

export default function HostBoardPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params);
  const router = useRouter();

  const [game, setGame] = useState<{ quizTitle: string; sessionId?: string; totalQuestions: number } | null>(null);
  const [status, setStatus] = useState<LiveGameStatus | null>(null);
  const [players, setPlayers] = useState<LiveLobbyPlayer[]>([]);
  const [question, setQuestion] = useState<HostQuestion | null>(null);
  const [answered, setAnswered] = useState<{ answered: number; total: number } | null>(null);
  const [reveal, setReveal] = useState<LiveQuestionEnd | null>(null);
  const [final, setFinal] = useState<LiveHostGameEnd | null>(null);
  const [fatal, setFatal] = useState<{ title: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Snapshot'dan joriy ekranni to'liq tiklash (birinchi ulanish va qayta ulanish)
  const applySnapshot = useCallback((snap: LiveHostSnapshot) => {
    const snapPlayers = snap.players ?? [];
    setGame({ quizTitle: snap.quizTitle, sessionId: snap.sessionId, totalQuestions: snap.totalQuestions });
    setStatus(snap.status);
    setPlayers(snapPlayers);
    const q = snap.question
      ? toHostQuestion(snap.question, { index: snap.currentIndex, total: snap.totalQuestions })
      : null;
    setQuestion(q);
    if (snap.status === 'question') {
      setReveal(null);
      setAnswered({ answered: snap.answered ?? 0, total: snapPlayers.length });
    } else if (snap.status === 'reveal') {
      setReveal({
        index: snap.currentIndex,
        correctIndex: snap.correctIndex ?? -1,
        distribution: snap.distribution ?? snap.question?.distribution ?? [],
        answered: snap.answered ?? 0,
        total: snapPlayers.length,
        leaderboard: snap.leaderboard ?? [],
        isLast: snap.currentIndex >= snap.totalQuestions - 1,
      });
    } else if (snap.status === 'finished') {
      const leaderboard = snap.leaderboard ?? [];
      setFinal({
        podium: leaderboard.slice(0, 3),
        leaderboard,
        totalPlayers: snapPlayers.length,
        totalQuestions: snap.totalQuestions,
      });
    }
  }, []);

  const onConnect = useCallback(
    async (call: LiveCall) => {
      const res = await call('host:join', { pin });
      if (res.ok) {
        const snap = ackField<LiveHostSnapshot>(res, 'game');
        if (snap) applySnapshot(snap);
        setFatal(null);
        return;
      }
      if (res.code === 'GAME_NOT_FOUND') {
        setFatal({
          title: "O'yin topilmadi",
          description: "Bu PIN bilan faol o'yin yo'q — u yopilgan yoki server qayta ishga tushgan bo'lishi mumkin.",
        });
      } else if (res.code && FORBIDDEN_CODES.has(res.code)) {
        setFatal({ title: "Ruxsat yo'q", description: liveErrorMessage(res.code) });
      } else {
        toast.error(liveErrorMessage(res.code, res.message));
      }
    },
    [pin, applySnapshot]
  );

  const { call, status: connection } = useLiveSocket({
    onConnect,
    handlers: {
      'lobby:players': (d: { players: LiveLobbyPlayer[] }) => setPlayers(d.players ?? []),
      'question:start': (d: LiveQuestionStart) => {
        setQuestion(toHostQuestion(d, { index: d.index, total: d.total }));
        setAnswered(null);
        setReveal(null);
        setStatus('question');
      },
      'question:answers': (d: { answered: number; total: number }) => setAnswered(d),
      'question:end': (d: LiveQuestionEnd) => {
        setReveal(d);
        setStatus('reveal');
      },
      'game:end': (d: LiveHostGameEnd) => {
        setFinal(d);
        setStatus('finished');
      },
    },
  });

  const remainingMs = useCountdown(
    status === 'question' ? question?.endsAt : null,
    question?.offset ?? 0
  );

  async function hostCall(event: string, payload?: Record<string, unknown>): Promise<LiveAck | null> {
    setBusy(true);
    try {
      const res = await call(event, payload);
      if (!res.ok && !(res.code && SILENT_CODES.has(res.code))) {
        toast.error(liveErrorMessage(res.code, res.message));
      }
      return res;
    } finally {
      setBusy(false);
    }
  }

  async function closeGame() {
    const res = await hostCall('host:close');
    // O'yin serverda allaqachon yo'q bo'lsa ham ro'yxatga qaytamiz
    if (res?.ok || res?.code === 'GAME_NOT_FOUND') {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      router.push(LIST_HREF);
    }
  }

  const inGame = status === 'question' || status === 'reveal';
  const endButton =
    status && status !== 'finished' && !fatal ? (
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <button
              type="button"
              className={boardButton('secondary', 'min-h-14 px-4 text-lg sm:min-h-16 sm:px-5')}
            />
          }
        >
          <Flag className="size-6" /> <span className="hidden sm:inline">O&apos;yinni tugatish</span>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O&apos;yinni tugatasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              O&apos;yin darhol yakunlanadi va shu paytgacha bo&apos;lgan natijalar saqlanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Davom etish</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => hostCall('host:end')}>
              Tugatish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : null;

  return (
    <BoardLayout
      exitHref={LIST_HREF}
      controls={endButton}
      onExit={() =>
        !inGame || window.confirm("O'yin serverda davom etadi. Doskadan chiqasizmi?")
      }
    >
      {connection === 'reconnecting' && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-[#B07800] px-4 py-3 text-xl font-bold text-white"
        >
          <Loader2 className="size-6 animate-spin" /> Qayta ulanmoqda…
        </div>
      )}

      {fatal ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <AlertTriangle className="size-20 text-[#FFC62E]" />
          <h1 className="font-heading text-4xl font-bold">{fatal.title}</h1>
          <p className="max-w-xl text-2xl text-white/75">{fatal.description}</p>
          <Link href={LIST_HREF} className={boardButton('primary')}>
            Viktorinalar ro&apos;yxati
          </Link>
        </div>
      ) : !status || !game ? (
        <div className="flex flex-1 items-center justify-center gap-4 text-3xl">
          <Loader2 className="size-10 animate-spin" /> Ulanmoqda…
        </div>
      ) : status === 'lobby' ? (
        <Lobby
          pin={pin}
          quizTitle={game.quizTitle}
          players={players}
          busy={busy}
          onStart={() => hostCall('host:start')}
          onKick={(player) => hostCall('host:kick', { playerId: player.id })}
        />
      ) : status === 'question' && question ? (
        <BoardQuestion
          question={question}
          remainingMs={remainingMs}
          answered={answered ?? { answered: 0, total: players.filter((p) => p.connected).length || players.length }}
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                className={boardButton('secondary', 'text-2xl')}
                onClick={() => hostCall('host:next')}
                disabled={busy}
              >
                <SkipForward className="size-7" /> O&apos;tkazib yuborish
              </button>
            </div>
          }
        />
      ) : status === 'reveal' && reveal ? (
        <Reveal question={question} reveal={reveal} busy={busy} onNext={() => hostCall('host:next')} />
      ) : status === 'finished' && final ? (
        <Finished final={final} sessionId={game.sessionId} busy={busy} onClose={closeGame} />
      ) : (
        <div className="flex flex-1 items-center justify-center gap-4 text-3xl">
          <Loader2 className="size-10 animate-spin" />
        </div>
      )}
    </BoardLayout>
  );
}
