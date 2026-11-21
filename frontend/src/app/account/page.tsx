'use client';

import { useEffect, useState } from 'react';
import { fetchApi, setAuthToken } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import {
  User,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  BookOpen,
} from 'lucide-react';

interface AccountMeResponse {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string | null;
  progressOverview?: {
    chinese: { mastered: number; active: number };
    english: { mastered: number; active: number };
  };
}

export default function AccountSettingsPage() {
  const { refreshUser, logout } = useAuth();
  const [profile, setProfile] = useState<AccountMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [revokingAll, setRevokingAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchApi<AccountMeResponse>('/auth/me')
      .then((me) => {
        setProfile(me);
        setDisplayName(me.displayName || '');
        setEmail(me.email || '');
      })
      .catch((err: any) => setErrorMsg(err.message || 'Không thể tải thông tin tài khoản.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdateInfo(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSavingInfo(true);
    try {
      const payload: { displayName?: string; email?: string } = {};
      if (displayName.trim()) payload.displayName = displayName.trim();
      if (email.trim()) payload.email = email.trim();
      await fetchApi('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await refreshUser();
      setSuccessMsg('Đã cập nhật thông tin tài khoản thành công!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể cập nhật thông tin.');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetchApi<{ accessToken?: string }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.accessToken) {
        setAuthToken(res.accessToken);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(
        'Đã đổi mật khẩu thành công! Mọi phiên đăng nhập cũ trên thiết bị khác đã tự động hết hiệu lực.',
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể đổi mật khẩu.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogoutAll() {
    if (!confirm('Tất cả thiết bị đang đăng nhập (bao gồm trình duyệt này) sẽ phải đăng nhập lại. Tiếp tục?')) {
      return;
    }
    setRevokingAll(true);
    setErrorMsg('');
    try {
      await fetchApi('/auth/logout-all', { method: 'POST' });
      logout();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể thu hồi phiên đăng nhập.');
      setRevokingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="clay-card p-10 text-center text-cocoa-500 font-semibold">
          Đang tải hồ sơ tài khoản...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cocoa-900 flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/70 shadow-clay-sm flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span>Tài khoản & Bảo mật</span>
          </h1>
          <p className="text-sm text-cocoa-600 mt-1.5">
            Cập nhật hồ sơ cá nhân, đổi mật khẩu và kiểm soát các phiên đăng nhập đang hoạt động.
          </p>
        </div>

        {profile && (
          <div className="text-xs text-cocoa-500 font-semibold space-y-1 sm:text-right">
            <div>
              Tài khoản: <strong className="text-cocoa-900">@{profile.username}</strong>
            </div>
            {profile.lastLoginAt && (
              <div>
                Đăng nhập gần nhất:{' '}
                {new Date(profile.lastLoginAt).toLocaleString('vi-VN')}
              </div>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-[22px] bg-berry-100/90 border border-berry-200 text-berry-700 text-sm font-bold flex items-center gap-2.5 shadow-clay-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-[22px] bg-sage-100/90 border border-sage-200 text-sage-800 text-sm font-bold flex items-center gap-2.5 shadow-clay-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-sage-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tổng quan tiến độ tài khoản */}
      {profile?.progressOverview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="clay-card-peach p-5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-peach-700 uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Tiến độ Tiếng Trung (HSK 1→3)</span>
            </div>
            <div className="text-2xl font-extrabold text-cocoa-900">
              {profile.progressOverview.chinese.mastered} đã thuộc
            </div>
            <div className="text-xs text-cocoa-600 font-semibold">
              {profile.progressOverview.chinese.active} từ đang ôn tập SRS
            </div>
          </div>

          <div className="clay-card-sage p-5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-sage-700 uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Tiến độ Tiếng Anh (A1→B2)</span>
            </div>
            <div className="text-2xl font-extrabold text-cocoa-900">
              {profile.progressOverview.english.mastered} đã thuộc
            </div>
            <div className="text-xs text-cocoa-600 font-semibold">
              {profile.progressOverview.english.active} từ đang ôn tập SRS
            </div>
          </div>
        </div>
      )}

      {/* Cập nhật tên & email */}
      <form onSubmit={handleUpdateInfo} className="clay-card p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-extrabold text-cocoa-900 flex items-center gap-2">
          <User className="w-4 h-4 text-peach-600" />
          <span>Thông tin cá nhân</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Tên hiển thị</label>
            <input
              type="text"
              required
              maxLength={60}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full clay-input px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Email (Tùy chọn)</label>
            <input
              type="email"
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full clay-input px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingInfo}
            className="clay-btn-sage inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{savingInfo ? 'Đang lưu...' : 'Lưu thông tin'}</span>
          </button>
        </div>
      </form>

      {/* Đổi mật khẩu */}
      <form onSubmit={handleChangePassword} className="clay-card p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-extrabold text-cocoa-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-peach-600" />
          <span>Đổi mật khẩu</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Mật khẩu hiện tại</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full clay-input px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={6}
              maxLength={128}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full clay-input px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={6}
              maxLength={128}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full clay-input px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-cocoa-400/15">
          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={revokingAll}
            className="clay-btn-cream inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-berry-700"
          >
            <LogOut className="w-4 h-4" />
            <span>{revokingAll ? 'Đang thu hồi...' : 'Đăng xuất khỏi tất cả thiết bị'}</span>
          </button>

          <button
            type="submit"
            disabled={savingPassword}
            className="clay-btn-peach inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{savingPassword ? 'Đang đổi...' : 'Cập nhật mật khẩu'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
