import { API_URL } from './constants';
import type { ApiEnvelope, AuthPayload, PaginationMeta } from './types';

/** Error thrown for any non-2xx API response, carrying field errors when present. */
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]> | { path: string; message: string }[];

  constructor(status: number, message: string, errors?: ApiError['errors']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  /** Flatten field errors to a "field: message" list for form display. */
  fieldMessages(): string[] {
    if (!this.errors) return [];
    if (Array.isArray(this.errors)) return this.errors.map((e) => e.message);
    return Object.entries(this.errors).flatMap(([, msgs]) => msgs);
  }
}

// --------------------------- Access token store ----------------------------
// Access token lives in memory (mirrored to localStorage so it survives a
// reload before the refresh call resolves). The refresh token is an httpOnly
// cookie the browser sends automatically to /api/auth.

const TOKEN_KEY = 'bufahairs_access_token';
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = window.localStorage.getItem(TOKEN_KEY);
  }
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

// ------------------------------- Transport ---------------------------------

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean; // attach bearer token (default: true when a token exists)
  retry?: boolean; // internal: whether a 401 refresh-retry is still allowed
  raw?: boolean; // return the full envelope (incl. meta) instead of just data
}

let refreshPromise: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent 401s share one refresh round-trip. */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const json = (await res.json()) as ApiEnvelope<AuthPayload>;
        setAccessToken(json.data.accessToken);
        return json.data.accessToken;
      } catch {
        return null;
      } finally {
        // Allow the next refresh cycle after this one settles.
        setTimeout(() => (refreshPromise = null), 0);
      }
    })();
  }
  return refreshPromise;
}

export { refreshAccessToken };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth, retry = true, raw = false, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) finalHeaders.set('Content-Type', 'application/json');

  const token = getAccessToken();
  const useAuth = auth ?? Boolean(token);
  if (useAuth && token) finalHeaders.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: 'include',
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  let json: ApiEnvelope<T> | { success: false; message: string; errors?: ApiError['errors'] };
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, res.statusText || 'Unexpected server response');
  }

  if (!res.ok || json.success === false) {
    // Attempt a one-time transparent refresh on auth failure.
    if (res.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login') {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, { ...options, retry: false });
      }
    }
    const message = ('message' in json && json.message) || 'Request failed';
    const errors = 'errors' in json ? json.errors : undefined;
    throw new ApiError(res.status, message, errors);
  }

  if (raw) return json as unknown as T;
  return (json as ApiEnvelope<T>).data;
}

/** Result of a paginated list call: data + pagination meta. */
export interface Paged<T> {
  data: T;
  meta?: PaginationMeta;
}

async function requestPaged<T>(path: string, options: RequestOptions = {}): Promise<Paged<T>> {
  const envelope = await request<ApiEnvelope<T>>(path, { ...options, raw: true });
  // request(raw) returns the full envelope typed as ApiEnvelope<T>
  const e = envelope as unknown as ApiEnvelope<T>;
  return { data: e.data, meta: e.meta };
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  getPaged: <T>(path: string, options?: RequestOptions) =>
    requestPaged<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  del: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

/** Build a querystring from a params object, dropping null/undefined/''. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
