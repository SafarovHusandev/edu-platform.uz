'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getTokenCookie } from '@/lib/cookies';
import { LIVE_SOCKET_URL } from '@/lib/live-quiz';
import type { LiveAck } from '@/types/live-quiz';

export type LiveConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

export type LiveCall = <T = Record<string, unknown>>(
  event: string,
  payload?: Record<string, unknown>
) => Promise<LiveAck & T>;

type Handlers = Record<string, (data: never) => void>;

interface Options {
  // false bo'lsa ulanmaydi (masalan, ishtirokchi hali PIN kiritmagan)
  enabled?: boolean;
  // Har bir `connect` da (birinchi ham, qayta ulanish ham) chaqiriladi —
  // server xona a'zoligini unutadi, shuning uchun bu yerda host:join / player:rejoin
  onConnect?: (call: LiveCall) => void;
  // Server -> client hodisalari
  handlers: Handlers;
}

const ACK_TIMEOUT_MS = 10_000;

// Jonli viktorina socket'i: ulanish, avtomatik qayta ulanish, ack'ni Promise'ga
// o'rash va unmount bo'lganda uzish. Token har ulanishda cookie'dan qayta olinadi
// (login qilmagan ishtirokchi uchun auth bo'sh).
export function useLiveSocket({ enabled = true, onConnect, handlers }: Options) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const onConnectRef = useRef(onConnect);
  const [state, setState] = useState({ connected: false, everConnected: false });

  useEffect(() => {
    handlersRef.current = handlers;
    onConnectRef.current = onConnect;
  });

  const call = useCallback<LiveCall>(
    (event, payload = {}) =>
      new Promise((resolve) => {
        const socket = socketRef.current;
        if (!socket) {
          resolve({ ok: false, code: 'NO_SOCKET' } as never);
          return;
        }
        socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (err: unknown, res: LiveAck) => {
          if (err) resolve({ ok: false, code: 'TIMEOUT' } as never);
          else resolve((res ?? { ok: false, code: 'SERVER_ERROR' }) as never);
        });
      }),
    []
  );

  useEffect(() => {
    if (!enabled) return;
    const socket = io(LIVE_SOCKET_URL, {
      auth: (cb) => {
        const token = getTokenCookie();
        cb(token ? { token } : {});
      },
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState({ connected: true, everConnected: true });
      onConnectRef.current?.(call);
    });
    socket.on('disconnect', (reason) => {
      setState((s) => ({ ...s, connected: false }));
      // Server o'zi uzsa socket.io avtomatik qayta ulanmaydi — biz ulaymiz
      if (reason === 'io server disconnect') socket.connect();
    });
    socket.on('connect_error', () => setState((s) => ({ ...s, connected: false })));
    socket.onAny((event: string, data: unknown) => {
      const handler = handlersRef.current[event] as ((d: unknown) => void) | undefined;
      handler?.(data ?? {});
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, call]);

  // Ataylab uzish (masalan, o'quvchi chiqarilganda qayta ulanmasin)
  const disconnect = useCallback(() => {
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
  }, []);

  const status: LiveConnectionStatus = state.connected
    ? 'connected'
    : state.everConnected
      ? 'reconnecting'
      : 'connecting';

  return { call, status, disconnect };
}

// Ack ichidagi maydonni oladi: { ok, game } yoki { ok, data: { game } }
export function ackField<T>(res: LiveAck, key: string): T | undefined {
  if (key in res) return res[key] as T;
  const data = res.data as Record<string, unknown> | undefined;
  return data?.[key] as T | undefined;
}
