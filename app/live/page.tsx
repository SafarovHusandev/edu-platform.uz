'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Clock, Flame, Hourglass, Loader2, LogIn, PartyPopper, UserX, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { QuestionMarkdown } from '@/components/live-quiz/question-markdown';
import { OptionShape, optionStyle } from '@/components/live-quiz/option-styles';
import {
  CountdownRing,
  OptionTile,
  PointsBadge,
  useCountdown,
} from '@/components/live-quiz/board-views';
import { fetchLiveJoinInfo } from '@/hooks/use-live-quizzes';
import { ackField, useLiveSocket, type LiveCall } from '@/hooks/use-live-socket';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { useAuthStore } from '@/store/auth-store';
import { ApiError } from '@/lib/api-client';
import {
  LIVE_LIMITS,
  SILENT_CODES,
  clearPlayerKey,
  liveErrorMessage,
  readPlayerKey,
  toServerUrl,
  writePlayerKey,
} from '@/lib/live-quiz';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  LiveJoinInfo,
  LivePlayerGameEnd,
  LivePlayerSnapshot,
  LiveQuestionResult,
  LiveQuestionStart,
  PointsMultiplier,
} from '@/types/live-quiz';

type Screen =
  | 'pin'
  | 'name'
  | 'joining'
  | 'lobby'
  | 'question'
  | 'answered'
  | 'result'
  | 'finished'
  | 'kicked'
  | 'closed';

interface PlayerQuestion {
  index: number;
  total: number;
  text: string;
  image?: string | null;
  options: string[];
  timeLimit: number;
  pointsMultiplier: PointsMultiplier;
  endsAt?: number;
  offset: number;
}

const NAME_CODES = new Set(['NAME_REQUIRED', 'NAME_TOO_LONG', 'NAME_TAKEN']);
// Socket ulanib turishi kerak bo'lgan ekranlar
const SOCKET_SCREENS = new Set<Screen>(['name', 'joining', 'lobby', 'question', 'answered', 'result', 'finished']);

function toPlayerQuestion(q: Partial<LiveQuestionStart>, total: number): PlayerQuestion {
  return {
    index: q.index ?? 0,
    total: q.total ?? total,
    text: q.text ?? '',
    image: q.image ?? null,
    options: q.options ?? [],
    timeLimit: q.timeLimit ?? 20,
    pointsMultiplier: q.pointsMultiplier ?? 1,
    endsAt: q.endsAt,
    offset: q.serverNow ? q.serverNow - Date.now() : 0,
  };
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // qo'llab-quvvatlanmaydi
  }
}

// Katta, barmoq uchun qulay tugma (≥56px)
const bigButton =
  'flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-6 text-lg font-bold text-[#141B3D] transition-transform active:scale-[0.98] disabled:opacity-50';

function Centered({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-5 px-5 py-10 text-center', className)}>
      {children}
    </div>
  );
}

function LivePlayer() {
  const searchParams = useSearchParams();
  const initialPin = (searchParams.get('pin') ?? '').replace(/\D/g, '').slice(0, 6);
  const userName = useAuthStore((s) => s.user?.name);

  const [screen, setScreen] = useState<Screen>('pin');
  const [pinInput, setPinInput] = useState(initialPin);
  const [pinError, setPinError] = useState<string | null>(null);
  const [checking, setChecking] = useState(initialPin.length === 6);
  const [pin, setPin] = useState<string | null>(null);
  const [info, setInfo] = useState<LiveJoinInfo | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [me, setMe] = useState<{ name: string; score: number } | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [question, setQuestion] = useState<PlayerQuestion | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<LiveQuestionResult | null>(null);
  const [standing, setStanding] = useState<{ rank?: number; totalPlayers?: number }>({});
  const [final, setFinal] = useState<Partial<LivePlayerGameEnd> | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const pinRef = useRef<string | null>(null);

  useWakeLock(screen !== 'pin');

  // PIN tekshiruvidan keyingi qaror (QR orqali kelganda ham, qo'lda kiritilganda ham)
  const handleInfo = useCallback(
    (session: LiveJoinInfo) => {
      setChecking(false);
      const hasKey = !!readPlayerKey(session.pin);
      if (!hasKey && !session.joinable) {
        setPinError("O'yin allaqachon boshlangan");
        return;
      }
      setInfo(session);
      setCount(session.playerCount);
      setPin(session.pin);
      pinRef.current = session.pin;
      if (hasKey) {
        // Saqlangan playerKey bor — ism so'ramasdan player:rejoin (ulanganda)
        setScreen('joining');
      } else {
        setNameInput((prev) => prev || (userName ?? '').slice(0, LIVE_LIMITS.nameMax));
        setScreen('name');
      }
    },
    [userName]
  );

  const handlePinError = useCallback((error: unknown) => {
    setChecking(false);
    setPinError(
      error instanceof ApiError && error.status === 404
        ? "O'yin topilmadi"
        : error instanceof ApiError && error.status === 0
          ? 'Internet aloqasini tekshiring'
          : "Tekshirib bo'lmadi, qayta urinib ko'ring"
    );
  }, []);

  // ?pin= bilan kelgan bo'lsa (QR kod) — darhol tekshiramiz
  useEffect(() => {
    if (initialPin.length !== 6) return;
    let cancelled = false;
    fetchLiveJoinInfo(initialPin)
      .then((s) => !cancelled && handleInfo(s))
      .catch((e) => !cancelled && handlePinError(e));
    return () => {
      cancelled = true;
    };
    // faqat birinchi ochilganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submitPin(e?: React.FormEvent) {
    e?.preventDefault();
    const value = pinInput.replace(/\D/g, '');
    if (value.length !== 6) {
      setPinError('6 xonali PIN kiriting');
      return;
    }
    setPinError(null);
    setChecking(true);
    fetchLiveJoinInfo(value).then(handleInfo).catch(handlePinError);
  }

  const backToPin = useCallback((error?: string) => {
    setPin(null);
    pinRef.current = null;
    setScreen('pin');
    setPinError(error ?? null);
    setQuestion(null);
    setResult(null);
    setFinal(null);
    setMe(null);
    setChosen(null);
  }, []);

  const applySnapshot = useCallback((snap: LivePlayerSnapshot) => {
    setMe({ name: snap.name, score: snap.score ?? 0 });
    if (snap.playerCount != null) setCount(snap.playerCount);
    setStanding({ rank: snap.rank, totalPlayers: snap.totalPlayers });
    const q = snap.question ? toPlayerQuestion(snap.question, snap.totalQuestions) : null;
    setQuestion(q);
    setResult(null);
    switch (snap.status) {
      case 'lobby':
        setScreen('lobby');
        break;
      case 'question':
        setChosen(null);
        setScreen(snap.alreadyAnswered ? 'answered' : 'question');
        break;
      case 'reveal':
        setScreen('result');
        break;
      case 'finished':
        setFinal({ rank: snap.rank, score: snap.score, totalQuestions: snap.totalQuestions, totalPlayers: snap.totalPlayers });
        setScreen('finished');
        break;
    }
  }, []);

  // Har bir connect'da (qayta ulanishda ham): saqlangan kalit bo'lsa player:rejoin
  const onConnect = useCallback(
    async (call: LiveCall) => {
      const currentPin = pinRef.current;
      if (!currentPin) return;
      const playerKey = readPlayerKey(currentPin);
      if (!playerKey) return;
      const res = await call('player:rejoin', { pin: currentPin, playerKey });
      if (res.ok) {
        const snap = ackField<LivePlayerSnapshot>(res, 'game');
        if (snap) applySnapshot(snap);
        return;
      }
      if (res.code === 'PLAYER_NOT_FOUND') {
        clearPlayerKey(currentPin);
        setNameInput((prev) => prev || (userName ?? '').slice(0, LIVE_LIMITS.nameMax));
        setScreen('name');
      } else if (res.code === 'GAME_NOT_FOUND') {
        clearPlayerKey(currentPin);
        backToPin("O'yin topilmadi");
      } else {
        toast.error(liveErrorMessage(res.code, res.message));
      }
    },
    [applySnapshot, backToPin, userName]
  );

  const { call, status: connection } = useLiveSocket({
    enabled: !!pin && SOCKET_SCREENS.has(screen),
    onConnect,
    handlers: {
      'lobby:count': (d: { count: number }) => setCount(d.count),
      'question:start': (d: LiveQuestionStart) => {
        setQuestion(toPlayerQuestion(d, d.total));
        setChosen(null);
        setResult(null);
        setScreen('question');
      },
      'question:result': (d: LiveQuestionResult) => {
        setResult(d);
        setMe((m) => (m ? { ...m, score: d.score } : m));
        setStanding({ rank: d.rank, totalPlayers: d.totalPlayers });
        setScreen('result');
        vibrate(d.correct ? [30, 40, 30] : 120);
      },
      'game:end': (d: LivePlayerGameEnd) => {
        setFinal(d);
        setScreen('finished');
      },
      'player:kicked': () => {
        if (pinRef.current) clearPlayerKey(pinRef.current);
        setScreen('kicked');
      },
      'game:closed': () => {
        if (pinRef.current) clearPlayerKey(pinRef.current);
        setScreen('closed');
      },
    },
  });

  const remainingMs = useCountdown(
    screen === 'question' || screen === 'answered' ? question?.endsAt : null,
    question?.offset ?? 0
  );

  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) return;
    const name = nameInput.trim();
    if (!name) return setNameError('Ism kiriting');
    if (name.length > LIVE_LIMITS.nameMax) return setNameError('24 belgidan oshmasin');
    setNameError(null);
    setJoining(true);
    const res = await call('player:join', { pin, name });
    setJoining(false);
    if (res.ok) {
      const key = ackField<string>(res, 'playerKey');
      if (key) writePlayerKey(pin, key);
      const snap = ackField<LivePlayerSnapshot>(res, 'game');
      if (snap) applySnapshot({ ...snap, name: snap.name ?? name });
      else setScreen('lobby');
      return;
    }
    if (res.code && NAME_CODES.has(res.code)) setNameError(liveErrorMessage(res.code));
    else if (res.code === 'GAME_NOT_FOUND' || res.code === 'GAME_STARTED' || res.code === 'GAME_FULL')
      backToPin(liveErrorMessage(res.code));
    else toast.error(liveErrorMessage(res.code, res.message));
  }

  async function answer(option: number) {
    if (screen !== 'question' || !question || (remainingMs ?? 1) <= 0) return;
    vibrate(35);
    setChosen(option);
    setScreen('answered');
    const res = await call('player:answer', { questionIndex: question.index, option });
    if (!res.ok && !(res.code && SILENT_CODES.has(res.code))) {
      toast.error(liveErrorMessage(res.code, res.message));
      // Qabul qilinmadi — qayta bosish imkoniyati
      setScreen((s) => (s === 'answered' ? 'question' : s));
      setChosen(null);
    }
  }

  function playAgain() {
    if (pinRef.current) clearPlayerKey(pinRef.current);
    setPinInput('');
    setInfo(null);
    backToPin();
  }

  // ---------- Ekranlar ----------

  let content: React.ReactNode;

  if (screen === 'pin') {
    content = (
      <Centered>
        <PartyPopper className="size-14 text-[#FFC62E]" />
        <h1 className="font-heading text-3xl font-bold">Jonli viktorina</h1>
        <form onSubmit={submitPin} className="flex w-full max-w-sm flex-col gap-3">
          <label htmlFor="live-pin" className="text-lg text-white/75">
            Doskadagi PIN kodni kiriting
          </label>
          <input
            id="live-pin"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
              setPinError(null);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            aria-invalid={!!pinError}
            aria-describedby={pinError ? 'live-pin-error' : undefined}
            className="h-20 w-full rounded-2xl border-4 border-transparent bg-white text-center font-heading text-5xl font-bold tracking-[0.25em] text-[#141B3D] outline-none placeholder:text-[#141B3D]/20 focus:border-[#FFC62E] aria-invalid:border-[#FF4D5E]"
          />
          {pinError && (
            <p id="live-pin-error" role="alert" className="text-lg font-semibold text-[#FF8592]">
              {pinError}
            </p>
          )}
          <button type="submit" className={bigButton} disabled={checking || pinInput.length !== 6}>
            {checking ? <Loader2 className="size-6 animate-spin" /> : <LogIn className="size-6" />}
            Kirish
          </button>
        </form>
      </Centered>
    );
  } else if (screen === 'name') {
    content = (
      <Centered>
        <p className="text-lg text-white/70">{info?.quizTitle}</p>
        <h1 className="font-heading text-3xl font-bold">Ismingiz</h1>
        <form onSubmit={submitName} className="flex w-full max-w-sm flex-col gap-3">
          <input
            value={nameInput}
            onChange={(e) => {
              setNameInput(e.target.value.slice(0, LIVE_LIMITS.nameMax));
              setNameError(null);
            }}
            maxLength={LIVE_LIMITS.nameMax}
            autoComplete="nickname"
            autoFocus
            placeholder="Ism Familiya"
            aria-label="Ismingiz"
            aria-invalid={!!nameError}
            className="h-16 w-full rounded-2xl border-4 border-transparent bg-white px-5 text-center text-2xl font-bold text-[#141B3D] outline-none placeholder:text-[#141B3D]/30 focus:border-[#FFC62E] aria-invalid:border-[#FF4D5E]"
          />
          <div className="flex justify-between px-1 text-sm">
            <span role="alert" className="font-semibold text-[#FF8592]">
              {nameError}
            </span>
            <span className="tabular-nums text-white/60">
              {nameInput.length}/{LIVE_LIMITS.nameMax}
            </span>
          </div>
          {userName && (
            <p className="text-sm text-white/60">Natija akkauntingizga ham yoziladi</p>
          )}
          <button type="submit" className={bigButton} disabled={joining || connection !== 'connected'}>
            {joining || connection !== 'connected' ? <Loader2 className="size-6 animate-spin" /> : <Check className="size-6" />}
            Qo&apos;shilish
          </button>
        </form>
        <button type="button" className="min-h-14 px-4 text-white/70 underline" onClick={() => backToPin()}>
          Boshqa PIN
        </button>
      </Centered>
    );
  } else if (screen === 'joining') {
    content = (
      <Centered>
        <Loader2 className="size-12 animate-spin" />
        <p className="text-xl">O&apos;yinga qaytilmoqda…</p>
      </Centered>
    );
  } else if (screen === 'lobby') {
    content = (
      <Centered>
        <Check className="size-16 rounded-full bg-[#26890C] p-3" strokeWidth={3} />
        <h1 className="font-heading text-2xl font-bold">Siz qo&apos;shildingiz!</h1>
        <p className="text-xl text-white/80">O&apos;qituvchi boshlashini kuting</p>
        <p className="rounded-2xl bg-white/10 px-6 py-3 text-2xl font-bold">{me?.name}</p>
        {count != null && (
          <p className="flex items-center gap-2 text-lg text-white/70">
            <Users className="size-5" /> {count} ishtirokchi
          </p>
        )}
      </Centered>
    );
  } else if ((screen === 'question' || screen === 'answered') && question) {
    const image = toServerUrl(question.image);
    content = (
      <div className="flex flex-1 flex-col gap-3 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="rounded-full bg-white/15 px-3 py-1 font-bold tabular-nums">
            {question.index + 1} / {question.total}
          </span>
          <PointsBadge multiplier={question.pointsMultiplier} />
          {remainingMs != null && (
            <CountdownRing remainingMs={remainingMs} totalMs={question.timeLimit * 1000} className="size-14 text-sm" />
          )}
        </div>
        <div className="max-h-[32svh] overflow-y-auto rounded-2xl bg-white/5 p-3">
          <QuestionMarkdown text={question.text} variant="phone" onImageClick={setZoom} />
          {image && (
            <button type="button" className="mt-2 block cursor-zoom-in" onClick={() => setZoom(image)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="max-h-40 rounded-xl object-contain" />
            </button>
          )}
        </div>

        {screen === 'answered' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            {chosen != null && (
              <OptionTile index={chosen} text={question.options[chosen] ?? ''} size="compact" className="w-full max-w-sm" />
            )}
            <Hourglass className="size-12 animate-pulse" />
            <p className="text-2xl font-bold">Javob qabul qilindi ⏳</p>
            <p className="text-white/70">Boshqalar javob berishini kuting</p>
          </div>
        ) : (
          <div
            className={cn(
              'grid flex-1 gap-3',
              question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1'
            )}
          >
            {question.options.map((text, i) => {
              const style = optionStyle(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => answer(i)}
                  className={cn(
                    'flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl p-3 text-white shadow-[0_5px_0_rgb(0_0_0/0.3)] transition-transform active:translate-y-1 active:shadow-none',
                    style.bg
                  )}
                  aria-label={`${style.name} ${style.symbol}: ${text}`}
                >
                  <OptionShape index={i} className="size-10" />
                  <span className="line-clamp-3 text-base font-bold leading-tight">{text}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  } else if (screen === 'result') {
    const tone = !result
      ? 'bg-[#141B3D]'
      : !result.answered
        ? 'bg-[#8A5A00]'
        : result.correct
          ? 'bg-[#1E7A0A]'
          : 'bg-[#B0152F]';
    content = (
      <Centered className={cn('transition-colors', tone)}>
        {!result ? (
          <>
            <Clock className="size-14" />
            <p className="text-2xl font-bold">Natijalar ko&apos;rsatilmoqda</p>
            <p className="text-white/80">Keyingi savolni kuting</p>
          </>
        ) : !result.answered ? (
          <>
            <Clock className="size-20" />
            <p className="font-heading text-3xl font-bold">Vaqt tugadi</p>
          </>
        ) : result.correct ? (
          <>
            <Check className="size-24 rounded-full bg-white/20 p-4" strokeWidth={3} />
            <p className="font-heading text-3xl font-bold">To&apos;g&apos;ri!</p>
            <p className="live-pop-in font-heading text-5xl font-bold">+{formatNumber(result.points)}</p>
            {result.streak >= 2 && (
              <p className="flex items-center gap-2 text-xl font-bold">
                <Flame className="size-6 text-[#FFC62E]" /> {result.streak} ta ketma-ket
              </p>
            )}
          </>
        ) : (
          <>
            <X className="size-24 rounded-full bg-white/20 p-4" strokeWidth={3} />
            <p className="font-heading text-3xl font-bold">Noto&apos;g&apos;ri</p>
          </>
        )}
        {result && !result.correct && question?.options[result.correctIndex] != null && (
          <div className="flex w-full max-w-sm flex-col gap-2">
            <p className="text-white/80">To&apos;g&apos;ri javob:</p>
            <OptionTile
              index={result.correctIndex}
              text={question.options[result.correctIndex]}
              size="compact"
              state="correct"
            />
          </div>
        )}
        <div className="mt-4 flex flex-col items-center gap-1 rounded-2xl bg-black/20 px-8 py-4">
          <span className="text-white/75">Jami ball</span>
          <span className="font-heading text-3xl font-bold tabular-nums">{formatNumber(me?.score ?? 0)}</span>
          {standing.rank != null && (
            <span className="text-lg font-semibold">
              {standing.totalPlayers ? `${standing.totalPlayers} tadan ` : ''}
              {standing.rank}-o&apos;rin
            </span>
          )}
        </div>
      </Centered>
    );
  } else if (screen === 'finished') {
    content = (
      <Centered>
        <p className="text-xl text-white/75">O&apos;yin yakunlandi</p>
        {final?.rank != null && (
          <p className="live-pop-in font-heading text-8xl font-bold">
            {final.rank <= 3 ? ['🥇', '🥈', '🥉'][final.rank - 1] : `${final.rank}`}
          </p>
        )}
        {final?.rank != null && (
          <p className="text-2xl font-bold">
            {final.totalPlayers ? `${final.totalPlayers} tadan ` : ''}
            {final.rank}-o&apos;rin
          </p>
        )}
        <p className="font-heading text-4xl font-bold tabular-nums">
          {formatNumber(final?.score ?? me?.score ?? 0)} ball
        </p>
        {final?.correctCount != null && final.totalQuestions != null && (
          <p className="text-xl text-white/85">
            {final.totalQuestions} tadan {final.correctCount} ta to&apos;g&apos;ri
          </p>
        )}
        <button type="button" className={cn(bigButton, 'mt-4 max-w-sm')} onClick={playAgain}>
          Yangi o&apos;yinga qo&apos;shilish
        </button>
      </Centered>
    );
  } else if (screen === 'kicked' || screen === 'closed') {
    content = (
      <Centered>
        {screen === 'kicked' ? <UserX className="size-16" /> : <X className="size-16" />}
        <p className="font-heading text-2xl font-bold">
          {screen === 'kicked' ? "Siz o'yindan chiqarildingiz" : "O'yin yopildi"}
        </p>
        <button type="button" className={cn(bigButton, 'max-w-sm')} onClick={playAgain}>
          Bosh sahifa
        </button>
      </Centered>
    );
  } else {
    content = (
      <Centered>
        <Loader2 className="size-10 animate-spin" />
      </Centered>
    );
  }

  const showReconnect = !!pin && SOCKET_SCREENS.has(screen) && connection === 'reconnecting';

  return (
    <>
      {showReconnect && (
        <div
          role="status"
          className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-[#B07800] px-4 py-2.5 font-bold"
        >
          <Loader2 className="size-5 animate-spin" /> Qayta ulanmoqda…
        </div>
      )}
      <main className="flex flex-1 flex-col">{content}</main>

      <Dialog open={!!zoom} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-w-[calc(100%-1rem)] bg-black p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">Rasm</DialogTitle>
          {zoom && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={zoom} alt="" className="max-h-[85svh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-10 animate-spin" />
        </div>
      }
    >
      <LivePlayer />
    </Suspense>
  );
}
