import { API_URL } from '@/lib/config';
import { getTokenCookie } from '@/lib/cookies';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  // Mashina o'qiydigan xato kodi (masalan "ATTEMPT_EXPIRED"), backend yuborsa
  code?: string;
  // 429 javobida Retry-After / RateLimit-Reset header'idan (soniya), backend yuborsa
  retryAfter?: number;

  constructor(message: string, status: number, errors?: Record<string, string[]>, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

// 422 javobidagi xato matnlari. Backend `errors`ni [{ field, message }] massivi
// sifatida yuboradi; eski { field: [msg] } ko'rinishi ham qo'llab-quvvatlanadi.
export function validationMessages(error: unknown): string[] {
  if (!(error instanceof ApiError)) return [];
  const raw = error.errors as unknown;
  const messages: unknown[] = Array.isArray(raw)
    ? raw.map((item) =>
        item && typeof item === 'object' ? (item as { message?: unknown }).message : item
      )
    : raw && typeof raw === 'object'
      ? Object.values(raw as Record<string, unknown>).flat()
      : [];
  const list = messages.filter((m): m is string => typeof m === 'string' && m.trim() !== '');
  return list.length > 0 ? list : [error.message];
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(fn: UnauthorizedHandler) {
  unauthorizedHandler = fn;
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export function buildQuery(params?: QueryParams) {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
  token?: string;
  // Public endpoint: 401 kelsa sessiya tozalanmaydi. Token (agar bo'lsa) baribir
  // yuboriladi — backend login qilgan foydalanuvchini so'rov limitidan ozod qiladi,
  // public route'lar esa yaroqsiz tokenni rad etmaydi.
  skipAuth?: boolean;
  // So'rovni bekor qilish (AbortController)
  signal?: AbortSignal;
  // Faqat shu so'rov uchun kutish chegarasi (ms). Berilmasa — chegarasiz.
  timeout?: number;
}

function retryAfterSeconds(headers: Headers) {
  const raw = headers.get('retry-after') ?? headers.get('ratelimit-reset');
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(raw);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.round((date - Date.now()) / 1000));
}

const PAGINATION_KEYS = ['total', 'page', 'limit', 'totalPages', 'pages', 'count'];

function toPaginated(items: unknown[], meta: Record<string, unknown>) {
  return {
    items,
    total: Number(meta.total ?? meta.count ?? items.length),
    page: Number(meta.page ?? 1),
    limit: Number(meta.limit ?? (items.length || 10)),
    totalPages: Number(meta.totalPages ?? meta.pages ?? 1),
  };
}

function unwrap(json: unknown) {
  if (json && typeof json === 'object' && 'data' in (json as Record<string, unknown>)) {
    const obj = json as Record<string, unknown>;
    const data = obj.data;

    if (Array.isArray(data)) {
      const hasPagination = PAGINATION_KEYS.some((key) => key in obj);
      return hasPagination ? toPaginated(data, obj) : data;
    }

    if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;

      // This API nests list results as { <name>: [...], meta: {...} } under data.
      if ('meta' in dataObj) {
        const arrayKey = Object.keys(dataObj).find(
          (key) => key !== 'meta' && Array.isArray(dataObj[key])
        );
        if (arrayKey) {
          // Ro'yxat yonidagi qo'shimcha maydonlar (masalan `summary`, `me`) saqlanadi
          const extra = Object.fromEntries(
            Object.entries(dataObj).filter(([key]) => key !== arrayKey && key !== 'meta')
          );
          return {
            ...extra,
            ...toPaginated(dataObj[arrayKey] as unknown[], dataObj.meta as Record<string, unknown>),
          };
        }
      }

      // Some endpoints (e.g. /users) nest list results as
      // { <name>: [...], total, page, limit, totalPages } directly under data,
      // with no separate `meta` wrapper — same pagination fields, flat.
      const arrayKey = Object.keys(dataObj).find((key) => Array.isArray(dataObj[key]));
      if (arrayKey && PAGINATION_KEYS.some((key) => key in dataObj)) {
        return toPaginated(dataObj[arrayKey] as unknown[], dataObj);
      }
    }

    return data;
  }
  return json;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, token, skipAuth, signal, timeout } = options;
  const url = `${API_URL}${path}${buildQuery(params)}`;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {};

  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const authToken = token ?? getTokenCookie();

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // timeout berilgan bo'lsa: tashqi signal + taymer bitta controller'ga ulanadi
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fetchSignal = signal;
  if (timeout) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => {
      timedOut = true;
      abort();
    }, timeout);
    fetchSignal = controller.signal;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: fetchSignal,
    });
  } catch (error) {
    if (timedOut) {
      throw new ApiError("Server belgilangan vaqtda javob bermadi. Qayta urinib ko'ring", 0, undefined, 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const json = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status === 401 && !skipAuth) {
      unauthorizedHandler?.();
    }
    const message =
      (json && typeof json === 'object' && 'message' in json
        ? String((json as Record<string, unknown>).message)
        : null) ??
      res.statusText ??
      "So'rovni bajarib bo'lmadi";
    const errors =
      json && typeof json === 'object' && 'errors' in json
        ? ((json as Record<string, unknown>).errors as Record<string, string[]>)
        : undefined;
    const code =
      json && typeof json === 'object' && typeof (json as Record<string, unknown>).code === 'string'
        ? ((json as Record<string, unknown>).code as string)
        : undefined;
    const error = new ApiError(message, res.status, errors, code);
    if (res.status === 429) error.retryAfter = retryAfterSeconds(res.headers);
    throw error;
  }

  return unwrap(json) as T;
}

export const api = {
  get: <T>(path: string, params?: QueryParams, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET', params }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

function errorFromJson(json: unknown, status: number, fallback: string) {
  const obj = json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
  return new ApiError(
    obj && 'message' in obj ? String(obj.message) : fallback,
    status,
    obj && 'errors' in obj ? (obj.errors as Record<string, string[]>) : undefined,
    obj && typeof obj.code === 'string' ? obj.code : undefined
  );
}

// Katta fayllar (video) uchun: fetch yuklash jarayonini bermaydi, shuning uchun XHR.
// onProgress 0..1 qiymat oladi. signal bilan yuklashni bekor qilish mumkin.
export function uploadWithProgress<T>(
  path: string,
  formData: FormData,
  options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    const token = getTokenCookie();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      let json: unknown = null;
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        json = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(unwrap(json) as T);
        return;
      }
      if (xhr.status === 401) unauthorizedHandler?.();
      if (xhr.status === 413) {
        reject(new ApiError('Fayl hajmi juda katta', 413));
        return;
      }
      reject(errorFromJson(json, xhr.status, "Faylni yuklab bo'lmadi"));
    };
    xhr.onerror = () => reject(new ApiError('Tarmoq xatosi — internetni tekshiring', 0));
    xhr.onabort = () => reject(new ApiError('Yuklash bekor qilindi', 0, undefined, 'ABORTED'));
    options.signal?.addEventListener('abort', () => xhr.abort());

    xhr.send(formData);
  });
}
