const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const AUTH_TOKEN_KEY = 'cv_auth_token';
const AUTH_USER_KEY = 'cv_auth_user';
const CACHE_STORAGE_PREFIX = 'cv_api_cache_v1:';
const CACHE_TTL_MS = 10 * 60 * 1000;
const PREFETCH_COOLDOWN_MS = 20 * 1000;
const WAKEUP_COOLDOWN_MS = 2 * 60 * 1000;
const SLOW_THRESHOLD_MS = 2200;
const VERY_SLOW_THRESHOLD_MS = 6500;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface SlowApiState {
  slow: boolean;
  verySlow: boolean;
  activeCount: number;
  startedAt: number | null;
}

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

// Chỉ lưu tạm trong RAM của tab trình duyệt (không lưu localStorage/sessionStorage/DB)
let runtimeGeminiApiKey = '';
let runtimeGeminiModel = 'gemini-3-flash-preview';

const memoryCache = new Map<string, CacheEntry>();
const inFlightGets = new Map<string, Promise<unknown>>();
const lastPrefetchAt = new Map<string, number>();
let lastWakeupAt = 0;

const pendingRequests = new Map<number, number>();
let nextRequestId = 1;
let slowMonitorTimer: ReturnType<typeof setInterval> | null = null;
let currentSlowState: SlowApiState = {
  slow: false,
  verySlow: false,
  activeCount: 0,
  startedAt: null,
};
const slowListeners = new Set<(state: SlowApiState) => void>();

function normalizePath(endpoint: string): string {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

function getTokenScope(): string {
  const token = getAuthToken();
  if (!token) return 'anon';
  // Use last 12 chars as lightweight session-scoping key (never store full token in cache key)
  return token.slice(-12);
}

function getCacheKey(endpoint: string): string {
  return `${getTokenScope()}:${normalizePath(endpoint)}`;
}

function emitSlowState(next: SlowApiState) {
  if (
    currentSlowState.slow === next.slow &&
    currentSlowState.verySlow === next.verySlow &&
    currentSlowState.activeCount === next.activeCount &&
    currentSlowState.startedAt === next.startedAt
  ) {
    return;
  }
  currentSlowState = next;
  slowListeners.forEach((listener) => listener(next));
}

function recomputeSlowState() {
  if (pendingRequests.size === 0) {
    if (slowMonitorTimer) {
      clearInterval(slowMonitorTimer);
      slowMonitorTimer = null;
    }
    emitSlowState({ slow: false, verySlow: false, activeCount: 0, startedAt: null });
    return;
  }

  let earliest = Infinity;
  pendingRequests.forEach((ts) => {
    if (ts < earliest) earliest = ts;
  });

  const elapsed = Date.now() - earliest;
  emitSlowState({
    slow: elapsed >= SLOW_THRESHOLD_MS,
    verySlow: elapsed >= VERY_SLOW_THRESHOLD_MS,
    activeCount: pendingRequests.size,
    startedAt: earliest,
  });
}

function beginTrackedRequest(): number {
  const id = nextRequestId++;
  pendingRequests.set(id, Date.now());
  if (typeof window !== 'undefined' && !slowMonitorTimer) {
    slowMonitorTimer = setInterval(recomputeSlowState, 450);
  }
  return id;
}

function endTrackedRequest(id: number) {
  pendingRequests.delete(id);
  recomputeSlowState();
}

export function subscribeApiSlowState(listener: (state: SlowApiState) => void): () => void {
  slowListeners.add(listener);
  listener(currentSlowState);
  return () => {
    slowListeners.delete(listener);
  };
}

export function setRuntimeGeminiKey(key: string): void {
  runtimeGeminiApiKey = key.trim();
}

export function getRuntimeGeminiKey(): string {
  return runtimeGeminiApiKey;
}

export function setRuntimeGeminiModel(model: string): void {
  runtimeGeminiModel = model.trim() || 'gemini-3-flash-preview';
}

export function getRuntimeGeminiModel(): string {
  return runtimeGeminiModel;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  const prev = localStorage.getItem(AUTH_TOKEN_KEY);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (prev !== token) {
    clearApiCache();
  }
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  clearApiCache();
}

export function getCachedAuthUser<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCachedAuthUser<T>(user: T | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_KEY);
    } else {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedApi<T>(endpoint: string, maxAgeMs = CACHE_TTL_MS): T | null {
  const key = getCacheKey(endpoint);
  const now = Date.now();

  const mem = memoryCache.get(key);
  if (mem) {
    if (now - mem.timestamp <= maxAgeMs) {
      return mem.data as T;
    }
    memoryCache.delete(key);
  }

  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.timestamp !== 'number' || now - parsed.timestamp > maxAgeMs) {
      sessionStorage.removeItem(`${CACHE_STORAGE_PREFIX}${key}`);
      return null;
    }
    memoryCache.set(key, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

export function setCachedApi<T>(endpoint: string, data: T): void {
  const key = getCacheKey(endpoint);
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);

  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${CACHE_STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Ignore sessionStorage quota limits
  }
}

export function invalidateApiCache(prefixes?: string[]): void {
  const normalizedPrefixes = prefixes?.map(normalizePath);
  const scopePrefix = `${getTokenScope()}:`;

  Array.from(memoryCache.keys()).forEach((k) => {
    if (!normalizedPrefixes) {
      memoryCache.delete(k);
      return;
    }
    const pathPart = k.startsWith(scopePrefix) ? k.slice(scopePrefix.length) : k;
    if (normalizedPrefixes.some((p) => pathPart.startsWith(p))) {
      memoryCache.delete(k);
    }
  });

  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const storageKey = sessionStorage.key(i);
      if (!storageKey || !storageKey.startsWith(CACHE_STORAGE_PREFIX)) continue;
      if (!normalizedPrefixes) {
        keysToRemove.push(storageKey);
        continue;
      }
      const cacheKey = storageKey.slice(CACHE_STORAGE_PREFIX.length);
      const pathPart = cacheKey.startsWith(scopePrefix)
        ? cacheKey.slice(scopePrefix.length)
        : cacheKey;
      if (normalizedPrefixes.some((p) => pathPart.startsWith(p))) {
        keysToRemove.push(storageKey);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
}

export function clearApiCache(): void {
  inFlightGets.clear();
  lastPrefetchAt.clear();
  invalidateApiCache();
}

function buildHeaders(options?: RequestInit): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (runtimeGeminiApiKey && !headers['X-Gemini-Api-Key']) {
    headers['X-Gemini-Api-Key'] = runtimeGeminiApiKey;
  }

  if (runtimeGeminiModel && !headers['X-Gemini-Model']) {
    headers['X-Gemini-Model'] = runtimeGeminiModel;
  }

  return headers;
}

async function rawFetch<T>(
  endpoint: string,
  options?: RequestInit,
  trackSlow = true,
): Promise<T> {
  const path = normalizePath(endpoint);
  const url = `${API_BASE_URL}${path}`;
  const headers = buildHeaders(options);
  const reqId = trackSlow ? beginTrackedRequest() : null;

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkErr: unknown) {
      if ((networkErr as { name?: string })?.name === 'AbortError') {
        throw networkErr;
      }
      throw new ApiError(
        'Không thể kết nối máy chủ (server có thể đang khởi động lại, vui lòng thử lại sau vài giây).',
        0,
      );
    }

    if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      clearAuthToken();
      setRuntimeGeminiKey('');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    if (!res.ok) {
      let errorMessage =
        res.status === 429
          ? 'Bạn thao tác quá nhanh, vui lòng đợi vài giây rồi thử lại.'
          : 'Đã có lỗi xảy ra khi gọi API';
      try {
        const errorData = await res.json();
        if (errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message;
        }
      } catch {
        // Fallback
      }
      throw new ApiError(errorMessage, res.status);
    }

    return (await res.json()) as T;
  } finally {
    if (reqId !== null) {
      endTrackedRequest(reqId);
    }
  }
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const path = normalizePath(endpoint);

  // Deduplicate identical concurrent GET requests without custom AbortSignal
  if (method === 'GET' && !options?.signal) {
    const key = getCacheKey(path);
    const existing = inFlightGets.get(key);
    if (existing) {
      return existing as Promise<T>;
    }
    const promise = rawFetch<T>(path, options, true).finally(() => {
      inFlightGets.delete(key);
    });
    inFlightGets.set(key, promise);
    return promise;
  }

  return rawFetch<T>(path, options, true);
}

export async function fetchApiCached<T>(
  endpoint: string,
  options?: RequestInit & { silent?: boolean },
): Promise<T> {
  const path = normalizePath(endpoint);
  const key = getCacheKey(path);

  if (!options?.signal) {
    const existing = inFlightGets.get(key);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const promise = rawFetch<T>(path, options, !options?.silent)
    .then((data) => {
      setCachedApi(path, data);
      return data;
    })
    .finally(() => {
      if (!options?.signal) {
        inFlightGets.delete(key);
      }
    });

  if (!options?.signal) {
    inFlightGets.set(key, promise);
  }
  return promise;
}

export function prefetchApi(endpoint: string): void {
  if (typeof window === 'undefined' || !getAuthToken()) return;
  const path = normalizePath(endpoint);
  const key = getCacheKey(path);
  const now = Date.now();
  const lastAt = lastPrefetchAt.get(key) || 0;
  if (now - lastAt < PREFETCH_COOLDOWN_MS) return;

  // Skip if freshly cached within 20s
  if (getCachedApi(path, PREFETCH_COOLDOWN_MS) !== null) return;

  lastPrefetchAt.set(key, now);
  fetchApiCached(path, { silent: true }).catch(() => {
    // Ignore background prefetch errors
  });
}

export function wakeUpBackend(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastWakeupAt < WAKEUP_COOLDOWN_MS) return;
  lastWakeupAt = now;

  fetch(`${API_BASE_URL}/health`, { method: 'GET', cache: 'no-store' }).catch(() => {
    // Silent best-effort cold-start wake-up
  });
}
