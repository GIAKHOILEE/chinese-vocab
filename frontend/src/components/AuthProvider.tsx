'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ApiError,
  clearAuthToken,
  fetchApi,
  getAuthToken,
  getCachedAuthUser,
  prefetchApi,
  setAuthToken,
  setCachedAuthUser,
  setRuntimeGeminiKey,
  wakeUpBackend,
} from '@/lib/api';

export interface UserAccount {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: string;
  createdAt?: string;
  lastLoginAt?: string | null;
}

interface AuthContextValue {
  user: UserAccount | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    password: string;
    displayName?: string;
    email?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    wakeUpBackend();

    const token = getAuthToken();
    if (!token) {
      setCachedAuthUser(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Optimistic Auth Shell: mở thẳng giao diện nếu đã có user snapshot trong localStorage
    const cachedUser = getCachedAuthUser<UserAccount>();
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    }

    try {
      const me = await fetchApi<UserAccount>('/auth/me');
      setCachedAuthUser(me);
      setUser(me);
    } catch (err) {
      // Chỉ đăng xuất khi server xác nhận 401/403 (token hết hạn/không hợp lệ),
      // không văng đăng nhập nếu Render đang cold start hoặc rớt mạng tạm thời.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearAuthToken();
        setUser(null);
      } else if (!cachedUser) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setRuntimeGeminiKey('');
      setCachedAuthUser(null);
      setUser(null);
      if (pathname !== '/login') {
        router.replace('/login');
      }
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [pathname, router]);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    } else if (!loading && user && pathname === '/login') {
      router.replace('/');
    }
  }, [loading, user, pathname, router]);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await fetchApi<{ accessToken: string; user: UserAccount }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAuthToken(res.accessToken);
      setCachedAuthUser(res.user);
      setUser(res.user);
      prefetchApi('/practice/stats/dashboard');
      prefetchApi('/curriculum/summary');
      router.replace('/');
    },
    [router],
  );

  const register = useCallback(
    async (payload: { username: string; password: string; displayName?: string; email?: string }) => {
      const res = await fetchApi<{ accessToken: string; user: UserAccount }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(res.accessToken);
      setCachedAuthUser(res.user);
      setUser(res.user);
      prefetchApi('/practice/stats/dashboard');
      prefetchApi('/curriculum/summary');
      router.replace('/');
    },
    [router],
  );

  const logout = useCallback(() => {
    clearAuthToken();
    setRuntimeGeminiKey('');
    setUser(null);
    router.replace('/login');
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="clay-card p-8 text-center space-y-2.5 max-w-sm w-full">
          <div className="w-12 h-12 mx-auto rounded-[18px] bg-gradient-to-b from-peach-400 to-peach-500 text-linen-50 flex items-center justify-center font-chinese text-2xl font-bold shadow-clay-peach">
            习
          </div>
          <p className="text-sm font-bold text-cocoa-700">Đang kiểm tra phiên đăng nhập...</p>
          <p className="text-xs text-cocoa-500">
            Đang kết nối máy chủ để khôi phục dữ liệu học tập của bạn.
          </p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
