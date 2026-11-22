'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  Clock,
  Flame,
  Hourglass,
  Loader2,
  Lock,
  LogIn,
  PartyPopper,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { RankMedal } from '@/components/ui/rank-medal';
import { Confetti, type ConfettiHandle } from '@/components/board-lesson/confetti';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FitQuestion } from '@/components/live-quiz/fit-question';
import {
  AvatarArt,
  DEFAULT_AVATAR,
  LEGACY_AVATAR_KEYS,
  LIVE_AVATARS,
  PlayerAvatar,
  findAvatar,
  readSavedAvatar,
  saveAvatar,
} from '@/components/live-quiz/player-avatars';
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
  opensAt?: number;
  readMs: number;
  endsAt?: number;
  offset: number;
}

const NAME_CODES = new Set(['NAME_REQUIRED', 'NAME_TOO_LONG', 'NAME_TAKEN']);
// O'yin holati xatolari — PIN ekraniga qaytariladi
const GAME_CODES = new Set(['GAME_NOT_FOUND', 'GAME_STARTED', 'GAME_FULL']);
// Socket ulanib turishi kerak bo'lgan ekranlar
const SOCKET_SCREENS = new Set<Screen>([
  'name',
  'joining',
  'lobby',
  'question',
  'answered',
  'result',
  'finished',
]);

function toPlayerQuestion(q: Partial<LiveQuestionStart>, total: number): PlayerQuestion {
  return {
    index: q.index ?? 0,
    total: q.total ?? total,
    text: q.text ?? '',
    image: q.image ?? null,
    options: q.options ?? [],
    timeLimit: q.timeLimit ?? 20,
    pointsMultiplier: q.pointsMultiplier ?? 1,
    opensAt: q.opensAt,
    readMs: q.opensAt && q.serverNow ? Math.max(0, q.opensAt - q.serverNow) : 0,
    endsAt: q.endsAt,
    offset: q.serverNow ? q.serverNow - Date.now() : 0,
  };
}

// Shu o'yindagi tanlov — sahifa yangilanib rejoin bo'lganda (server avatar qaytarmasa) tiklash uchun
function pinAvatarKey(pin: string) {
  return `live:${pin}:avatar`;
}

function readPinAvatar(pin: string | null) {
  if (!pin) return null;
  try {
    return sessionStorage.getItem(pinAvatarKey(pin));
  } catch {
    return null;
  }
}

function writePinAvatar(pin: string, avatar: string) {
  try {
    sessionStorage.setItem(pinAvatarKey(pin), avatar);
  } catch {
    // e'tiborsiz
  }
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
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-5 px-5 py-10 text-center',
        className
      )}
    >
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
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [me, setMe] = useState<{ name: string; score: number; avatar?: string | null } | null>(
    null
  );
  const [count, setCount] = useState<number | null>(null);
  const [question, setQuestion] = useState<PlayerQuestion | null>(null);
  const [result, setResult] = useState<LiveQuestionResult | null>(null);
  const [standing, setStanding] = useState<{ rank?: number; totalPlayers?: number }>({});
  const [final, setFinal] = useState<Partial<LivePlayerGameEnd> | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const pinRef = useRef<string | null>(null);
  const confettiRef = useRef<ConfettiHandle>(null);

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
        setAvatar(readSavedAvatar());
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
  }, []);

  const applySnapshot = useCallback((snap: LivePlayerSnapshot) => {
    setMe({
      name: snap.name,
      score: snap.score ?? 0,
      avatar: snap.avatar ?? readPinAvatar(pinRef.current),
    });
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
        setScreen(snap.alreadyAnswered ? 'answered' : 'question');
        break;
      case 'reveal':
        setScreen('result');
        break;
      case 'finished':
        setFinal({
          rank: snap.rank,
          score: snap.score,
          totalQuestions: snap.totalQuestions,
          totalPlayers: snap.totalPlayers,
        });
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
        setAvatar(readSavedAvatar());
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
        setResult(null);
        setScreen('question');
      },
      'question:result': (d: LiveQuestionResult) => {
        setResult(d);
        setMe((m) => (m ? { ...m, score: d.score } : m));
        setStanding({ rank: d.rank, totalPlayers: d.totalPlayers });
        setScreen('result');
        vibrate(d.correct ? [30, 40, 30] : 120);
        // To'g'ri javobga konfetti: ✓ belgisi ortidan portlash; 3+ ketma-ket to'g'ri
        // javobda — katta bayram (yon pushkalar + yomg'ir). Natija ekrani chizilgach.
        if (d.correct) {
          window.setTimeout(() => {
            if (d.streak >= 3) confettiRef.current?.celebrate();
            else confettiRef.current?.burst({ x: 0.5, y: 0.32, count: 150 });
          }, 120);
        }
      },
      'game:end': (d: LivePlayerGameEnd) => {
        setFinal(d);
        setScreen('finished');
        // G'oliblar uchun bayram: 1-o'rin — ikki to'lqin, 2-3-o'rin — bitta
        if (d.rank >= 1 && d.rank <= 3) {
          vibrate([40, 60, 40, 60, 80]);
          window.setTimeout(() => confettiRef.current?.celebrate(), 300);
          if (d.rank === 1) window.setTimeout(() => confettiRef.current?.celebrate(), 2200);
        }
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
  // O'qish bosqichi: javoblar ochilishigacha qolgan vaqt (doskada savol o'qiladi)
  const readingMs = useCountdown(screen === 'question' ? question?.opensAt : null, question?.offset ?? 0);
  const reading = readingMs != null && readingMs > 0;

  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) return;
    const name = nameInput.trim();
    if (!name) return setNameError('Ism kiriting');
    if (name.length > LIVE_LIMITS.nameMax) return setNameError('24 belgidan oshmasin');
    setNameError(null);
    setJoining(true);
    let chosen = avatar;
    let res = await call('player:join', { pin, name, avatar: chosen });
    // Yangi (2-to'plam) ikonkani backend hali tanimasa — o'yindan qolib ketmaslik uchun
    // standart ikonka bilan bir marta qayta urinamiz. Ism/o'yin xatolarida bunday qilinmaydi.
    if (
      !res.ok &&
      !LEGACY_AVATAR_KEYS.has(chosen) &&
      !(res.code && (NAME_CODES.has(res.code) || GAME_CODES.has(res.code)))
    ) {
      chosen = DEFAULT_AVATAR;
      res = await call('player:join', { pin, name, avatar: chosen });
      if (res.ok) {
        setAvatar(chosen);
        toast.info("Bu ikonka hozircha mavjud emas — standart ikonka tanlandi");
      }
    }
    setJoining(false);
    if (res.ok) {
      const key = ackField<string>(res, 'playerKey');
      if (key) writePlayerKey(pin, key);
      saveAvatar(chosen);
      writePinAvatar(pin, chosen);
      const snap = ackField<LivePlayerSnapshot>(res, 'game');
      if (snap) applySnapshot({ ...snap, name: snap.name ?? name, avatar: snap.avatar ?? chosen });
      else {
        setMe({ name, score: 0, avatar: chosen });
        setScreen('lobby');
      }
      return;
    }
    if (res.code && NAME_CODES.has(res.code)) setNameError(liveErrorMessage(res.code));
    else if (res.code && GAME_CODES.has(res.code)) backToPin(liveErrorMessage(res.code));
    else toast.error(liveErrorMessage(res.code, res.message));
  }

  async function answer(option: number) {
    if (screen !== 'question' || !question || reading || (remainingMs ?? 1) <= 0) return;
    vibrate(35);
    setScreen('answered');
    const res = await call('player:answer', { questionIndex: question.index, option });
    if (res.code === 'QUESTION_NOT_OPEN') {
      // Soatlar biroz farq qilsa — savol hali ochilmagan, qayta bosish mumkin
      setScreen((s) => (s === 'answered' ? 'question' : s));
    } else if (!res.ok && !(res.code && SILENT_CODES.has(res.code))) {
      toast.error(liveErrorMessage(res.code, res.message));
      // Qabul qilinmadi — qayta bosish imkoniyati
      setScreen((s) => (s === 'answered' ? 'question' : s));
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-base font-semibold text-white/80">
              Ikonkangizni tanlang
            </legend>
            <div
              // Desktopda forma kengligidan (480px) chiqib kengayadi — 8 ustunda ikonkalar
              // ~70px bo'ladi va 32 tasi skrollsiz 4 qatorga sig'adi
              className="grid max-h-[50vh] grid-cols-5 gap-2 overflow-y-auto p-2 sm:grid-cols-8 md:-mx-16 md:gap-3"
              role="radiogroup"
              aria-label="Ikonka"
            >
              {LIVE_AVATARS.map((item) => {
                const active = item.key === avatar;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => setAvatar(item.key)}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-2xl transition-transform active:scale-95',
                      item.bg,
                      active ? 'scale-105 ring-4 ring-white' : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    <AvatarArt avatarKey={item.key} className="size-[82%]" />
                  </button>
                );
              })}
            </div>
          </fieldset>
          {userName && <p className="text-sm text-white/60">Natija akkauntingizga ham yoziladi</p>}
          <button
            type="submit"
            className={bigButton}
            disabled={joining || connection !== 'connected'}
          >
            {joining || connection !== 'connected' ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Check className="size-6" />
            )}
            Qo&apos;shilish
          </button>
        </form>
        <button
          type="button"
          className="min-h-14 px-4 text-white/70 underline"
          onClick={() => backToPin()}
        >
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
        <span className="relative">
          {findAvatar(me?.avatar) ? (
            <PlayerAvatar avatar={me?.avatar} className="size-24" />
          ) : (
            <Check className="size-16 rounded-full bg-[#26890C] p-3" strokeWidth={3} />
          )}
          {findAvatar(me?.avatar) && (
            <Check
              className="absolute -bottom-1 -right-1 size-8 rounded-full border-4 border-[#141B3D] bg-[#26890C] p-1"
              strokeWidth={3}
            />
          )}
        </span>
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
    content = (
      <div className="flex flex-1 flex-col gap-3 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 lg:mx-auto lg:w-full lg:max-w-[1500px] lg:px-8 lg:pb-8 lg:pt-6">
        <div className="flex items-center justify-between gap-2 text-[clamp(0.875rem,0.6rem+1vw,1.5rem)]">
          <span className="rounded-full bg-white/15 px-[0.8em] py-[0.25em] font-bold tabular-nums">
            {question.index + 1} / {question.total}
          </span>
          <PointsBadge multiplier={question.pointsMultiplier} />
          {remainingMs != null && !reading && (
            <CountdownRing
              remainingMs={remainingMs}
              totalMs={question.timeLimit * 1000}
              className="size-[clamp(3.5rem,2.5rem+4vw,6.5rem)] text-[clamp(0.875rem,0.6rem+1vw,1.5rem)]"
            />
          )}
        </div>
        {/* Kompyuterda savol va javoblar ekran o'rtasida, kartalar cho'zilmaydi */}
        <div className="flex flex-1 flex-col gap-3 lg:justify-center lg:gap-6">
          {/* Shrift blokka scroll'siz sig'adigan o'lchamga avtomatik tushadi */}
          <FitQuestion
            text={question.text}
            image={question.image}
            onImageClick={setZoom}
            className="max-h-[38svh] lg:max-h-[42svh]"
          />

          {screen === 'question' && reading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="live-pop-in font-heading text-[clamp(1.75rem,1rem+3vw,3rem)] font-bold">Tayyorlaning!</p>
              <p className="text-white/75">
                Javoblar <span className="font-bold tabular-nums text-white">{Math.ceil(readingMs / 1000)}</span>{' '}
                soniyadan keyin ochiladi
              </p>
              <div className="h-2.5 w-full max-w-md overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#FFC62E] transition-[width] duration-200 ease-linear"
                  style={{
                    width: `${question.readMs ? Math.min(1, readingMs / question.readMs) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : screen === 'answered' ? (
            // Tanlangan variant atayin ko'rsatilmaydi: yonidagi o'quvchi ekranga qarab
            // ko'chirib olmasin. To'g'ri/noto'g'ri natija ekranida (hamma javob bergach) ko'rinadi.
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <Hourglass className="size-12 animate-pulse" />
              <p className="text-2xl font-bold">Javob qabul qilindi</p>
              <p className="text-white/70">Boshqalar javob berishini kuting</p>
              <p className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
                <Lock className="size-4" aria-hidden /> Javobingiz hamma javob bergach ko&apos;rinadi
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'grid flex-1 gap-3 lg:flex-none lg:gap-5',
                question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'
              )}
            >
              {question.options.map((text, i) => {
                const style = optionStyle(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => answer(i)}
                    disabled={remainingMs != null && remainingMs <= 0}
                    className={cn(
                      'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-[0.4em] rounded-2xl p-3 text-white shadow-[0_5px_0_rgb(0_0_0/0.3)] outline-none transition-[transform,box-shadow,filter] duration-150 select-none sm:p-5',
                      'active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-60',
                      // 360px telefonda ~20px, planshetda kattaroq
                      'text-[clamp(1.25rem,0.75rem+2.4vw,3rem)]',
                      // Kompyuter: ixcham gorizontal karta, hover effekti
                      'lg:min-h-36 lg:flex-row lg:justify-start lg:gap-5 lg:px-7 lg:text-left lg:text-[clamp(1.5rem,1.5vw,2rem)]',
                      'lg:hover:-translate-y-1 lg:hover:shadow-[0_9px_0_rgb(0_0_0/0.3)] lg:hover:brightness-110',
                      style.bg
                    )}
                    aria-label={`${style.name} ${style.symbol}: ${text}`}
                  >
                    <OptionShape index={i} className="size-[1.8em] lg:size-[1.5em]" />
                    <span className="line-clamp-4 font-bold leading-tight break-words">{text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
            <p className="live-pop-in font-heading text-5xl font-bold">
              +{formatNumber(result.points)}
            </p>
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
          <div className="flex w-full max-w-xl flex-col gap-2">
            <p className="text-lg text-white/80">To&apos;g&apos;ri javob:</p>
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
          <span className="font-heading text-3xl font-bold tabular-nums">
            {formatNumber(me?.score ?? 0)}
          </span>
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
            {final.rank <= 3 ? <RankMedal rank={final.rank} className="size-28" /> : final.rank}
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
      <Confetti ref={confettiRef} />

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
