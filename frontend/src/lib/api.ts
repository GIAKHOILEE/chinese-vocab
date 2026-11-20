const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const AUTH_TOKEN_KEY = 'cv_auth_token';

// Chỉ lưu tạm trong RAM của tab trình duyệt (không lưu localStorage/sessionStorage/DB)
let runtimeGeminiApiKey = '';
let runtimeGeminiModel = 'gemini-3-flash-preview';

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
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  if (!res.ok) {
    let errorMessage = 'Đã có lỗi xảy ra khi gọi API';
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
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}
