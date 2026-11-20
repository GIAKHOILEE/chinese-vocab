'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { BookOpen, Sparkles, UserPlus, LogIn, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register({
          username: username.trim(),
          password,
          displayName: displayName.trim() || undefined,
          email: email.trim() || undefined,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Không thể xác thực tài khoản.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-peach-100 border border-peach-300/40 text-peach-700 text-xs font-extrabold shadow-clay-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chinese HSK 1→3 & English A1→B2 Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-cocoa-900 tracking-tight">
            {mode === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản học mới'}
          </h1>
          <p className="text-sm text-cocoa-600">
            Mỗi người dùng có lộ trình, lịch ôn tập SRS, từ cá nhân và bài luyện viết hoàn toàn độc lập.
          </p>
        </div>

        <div className="clay-card p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-2 p-1.5 rounded-[20px] bg-linen-200/80 border border-cocoa-400/15 shadow-clay-inset gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2.5 rounded-[16px] text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                mode === 'login'
                  ? 'bg-gradient-to-b from-peach-400 to-peach-500 text-linen-50 shadow-clay-peach'
                  : 'text-cocoa-600 hover:text-cocoa-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2.5 rounded-[16px] text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                mode === 'register'
                  ? 'bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 shadow-clay-sage'
                  : 'text-cocoa-600 hover:text-cocoa-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký mới</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-[18px] bg-berry-100 border border-berry-200 text-berry-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-cocoa-700 mb-1.5">
                {mode === 'login' ? 'Tên đăng nhập hoặc Email' : 'Tên đăng nhập (*)'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'username hoặc email' : 'vd: minh_anh (chữ, số, _)'}
                className="w-full clay-input px-4 py-2.5 text-sm"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-cocoa-700 mb-1.5">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ví dụ: Minh Anh"
                    className="w-full clay-input px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cocoa-700 mb-1.5">
                    Email (Không bắt buộc)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full clay-input px-4 py-2.5 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Mật khẩu (*)</label>
              <input
                type="password"
                required
                minLength={mode === 'register' ? 6 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'}
                className="w-full clay-input px-4 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 text-sm flex items-center justify-center gap-2 ${
                mode === 'login' ? 'clay-btn-peach' : 'clay-btn-sage'
              }`}
            >
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>
                {submitting
                  ? 'Đang xử lý...'
                  : mode === 'login'
                    ? 'Đăng nhập vào góc học tập'
                    : 'Tạo tài khoản & Bắt đầu học'}
              </span>
            </button>
          </form>

          <div className="pt-3 border-t border-cocoa-400/15 flex items-center gap-2 text-xs text-cocoa-500">
            <ShieldCheck className="w-4 h-4 text-sage-600 shrink-0" />
            <span>
              Kho từ chuẩn HSK 1–3 (2.200+ từ) và Oxford A1–B2 (3.650+ từ) đã được nạp sẵn cho mọi tài khoản mới.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
