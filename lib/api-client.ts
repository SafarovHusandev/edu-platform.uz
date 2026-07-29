import { API_URL } from '@/lib/config';
import { getTokenCookie } from '@/lib/cookies';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
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
  skipAuth?: boolean;
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

    // This API nests list results as { <name>: [...], meta: {...} } under data.
    if (data && typeof data === 'object' && 'meta' in (data as Record<string, unknown>)) {
      const dataObj = data as Record<string, unknown>;
      const arrayKey = Object.keys(dataObj).find(
        (key) => key !== 'meta' && Array.isArray(dataObj[key])
      );
      if (arrayKey) {
        return toPaginated(dataObj[arrayKey] as unknown[], dataObj.meta as Record<string, unknown>);
      }
    }

    return data;
  }
  return json;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, token, skipAuth } = options;
  const url = `${API_URL}${path}${buildQuery(params)}`;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {};

  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const authToken = token ?? (skipAuth ? undefined : getTokenCookie());

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

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
    throw new ApiError(message, res.status, errors);
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
