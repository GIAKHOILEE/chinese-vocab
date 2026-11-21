'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { GEMINI_MODELS, useGeminiConfig } from '@/components/GeminiProvider';
import {
  BookOpen,
  PenTool,
  History,
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  Languages,
  ClipboardCheck,
  Gamepad2,
  LogOut,
  User,
  KeyRound,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { apiKey, setApiKey, clearApiKey, model, setModel } = useGeminiConfig();
  const [showKey, setShowKey] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  if (pathname === '/login' || !user) {
    return null;
  }

  const isEnglishMode = pathname.startsWith('/english');
  const hasKey = apiKey.trim().length > 0;

  const chineseNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/study', label: 'Lộ trình HSK 1→3', icon: Sparkles },
    { href: '/games', label: 'Mini-Game', icon: Gamepad2 },
    { href: '/grammar', label: 'Ngữ pháp', icon: GraduationCap },
    { href: '/vocabulary', label: 'Từ vựng', icon: BookOpen },
    { href: '/practice/new', label: 'Tạo bài tập', icon: PenTool },
    { href: '/practice', label: 'Lịch sử', icon: History },
  ];

  const englishNavItems = [
    { href: '/english/dashboard', label: 'Dashboard EN', icon: LayoutDashboard },
    { href: '/english', label: 'Lộ trình A1→B2', icon: Sparkles },
    { href: '/english/games', label: 'Mini-Game', icon: Gamepad2 },
    { href: '/english/placement', label: 'Test trình độ', icon: ClipboardCheck },
    { href: '/english/grammar', label: 'Ngữ pháp EN', icon: GraduationCap },
  ];

  const navItems = isEnglishMode ? englishNavItems : chineseNavItems;

  return (
    <>
      <header className="sticky top-0 z-50 pt-3 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto bg-linen-50/88 backdrop-blur-md rounded-[28px] border border-cocoa-400/20 shadow-clay px-4 sm:px-6 py-2.5">
          {/* Hàng 1: Logo + 2 Tab chuyển ngôn ngữ + Tài khoản */}
          <div className="min-h-12 flex flex-wrap items-center justify-between gap-2.5">
            <Link
              href={isEnglishMode ? '/english/dashboard' : '/'}
              className="flex items-center gap-2.5 font-extrabold text-cocoa-800 text-base sm:text-lg hover:text-peach-600 transition shrink-0 group"
            >
              <div
                className={`w-10 h-10 rounded-[18px] text-linen-50 flex items-center justify-center font-extrabold text-sm transition-transform duration-200 group-hover:scale-105 ${
                  isEnglishMode
                    ? 'bg-gradient-to-b from-sage-400 to-sage-500 shadow-clay-sage'
                    : 'bg-gradient-to-b from-peach-400 to-peach-500 shadow-clay-peach'
                }`}
              >
                {isEnglishMode ? 'EN' : <span className="font-chinese text-base">写</span>}
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="tracking-tight">
                  {isEnglishMode ? 'English Studio' : 'Chinese Studio'}
                </span>
                <span className="text-[11px] font-semibold text-cocoa-400">
                  {isEnglishMode ? 'Cozy A1 → B2' : 'Cozy HSK 1→3 (3.0)'}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              {/* 2 Tab chuyển Tiếng Trung / Tiếng Anh */}
              <div className="inline-flex p-1.5 rounded-[22px] bg-linen-200/85 border border-cocoa-400/15 shadow-clay-inset gap-1">
                <Link
                  href="/"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[16px] text-xs sm:text-sm font-bold transition-all duration-200 ${
                    !isEnglishMode
                      ? 'bg-gradient-to-b from-peach-400 to-peach-500 text-linen-50 shadow-clay-peach'
                      : 'text-cocoa-600 hover:text-cocoa-900 hover:bg-linen-50/60'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Tiếng Trung (HSK 1→3)</span>
                </Link>
                <Link
                  href="/english/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[16px] text-xs sm:text-sm font-bold transition-all duration-200 ${
                    isEnglishMode
                      ? 'bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 shadow-clay-sage'
                      : 'text-cocoa-600 hover:text-cocoa-900 hover:bg-linen-50/60'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Tiếng Anh (A1→B2)</span>
                </Link>
              </div>

              {/* Badge người dùng hiện tại + Cài đặt tài khoản + Đăng xuất */}
              <div className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-[20px] bg-linen-100/90 border border-cocoa-400/20 shadow-clay-sm">
                <Link
                  href="/account"
                  title="Quản lý tài khoản & Đổi mật khẩu"
                  className="inline-flex items-center gap-1.5 hover:text-peach-600 transition"
                >
                  <User className="w-3.5 h-3.5 text-peach-600" />
                  <span className="text-xs font-extrabold text-cocoa-800 max-w-[110px] truncate hover:text-peach-700">
                    {user.displayName || user.username}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearApiKey();
                    logout();
                  }}
                  title="Đăng xuất / Đổi tài khoản"
                  className="p-1.5 rounded-full text-cocoa-500 hover:text-berry-700 hover:bg-berry-100/80 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Hàng 2: Menu chức năng theo tab đang chọn */}
          <nav className="flex items-center gap-1.5 pt-2.5 mt-2 border-t border-cocoa-400/15 overflow-x-auto pb-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/' &&
                  item.href !== '/english' &&
                  item.href !== '/english/dashboard' &&
                  item.href !== '/practice' &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? isEnglishMode
                        ? 'bg-sage-100/95 text-sage-700 border border-sage-300/50 shadow-clay-sm'
                        : 'bg-peach-100/95 text-peach-700 border border-peach-300/50 shadow-clay-sm'
                      : 'text-cocoa-600 hover:text-cocoa-900 hover:bg-linen-200/70 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Hàng 3: 1 dòng nhập Google AI Studio Gemini API Key (chỉ giữ trong phiên) */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 pt-2.5 mt-2 border-t border-cocoa-400/15 text-xs">
            <div className="flex items-center gap-2 shrink-0">
              <KeyRound className={`w-3.5 h-3.5 ${hasKey ? 'text-sage-600' : 'text-honey-500'}`} />
              <span className="font-extrabold text-cocoa-700">Gemini API Key:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${
                  hasKey
                    ? 'bg-sage-100 text-sage-700 border-sage-300/60'
                    : 'bg-honey-100 text-honey-700 border-honey-200'
                }`}
              >
                {hasKey ? 'Đã nhập (chỉ giữ phiên này)' : 'Chưa nhập key'}
              </span>
            </div>

            <div className="flex-1 flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  autoComplete="off"
                  name="gemini-session-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Dán API Key lấy từ Google AI Studio (AIza...) — web không lưu key, tải lại trang sẽ nhập lại"
                  className="w-full clay-input pl-3 pr-16 py-1.5 text-xs font-mono"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    title={showKey ? 'Ẩn key' : 'Hiện key'}
                    className="p-1 text-cocoa-400 hover:text-cocoa-700 rounded-full"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {hasKey && (
                    <button
                      type="button"
                      onClick={clearApiKey}
                      title="Xóa key"
                      className="p-1 text-cocoa-400 hover:text-berry-700 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                title="Chọn Gemini Model"
                className="hidden sm:block clay-input px-2.5 py-1.5 text-xs font-semibold max-w-[185px]"
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="clay-btn-cream inline-flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold text-peach-700 shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Hướng dẫn lấy key</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal hướng dẫn lấy Key Google AI Studio */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 bg-cocoa-900/45 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="clay-modal max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cocoa-400/15 bg-linen-100/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[14px] bg-peach-100 text-peach-600 border border-peach-200/70 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-cocoa-900 text-base">
                    Hướng dẫn lấy Gemini API Key (Google AI Studio)
                  </h3>
                  <p className="text-xs text-cocoa-500">Miễn phí, chỉ mất 30 giây bằng tài khoản Gmail</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="p-2 rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-linen-200/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-cocoa-700">
              <div className="p-3.5 rounded-[18px] bg-honey-100/85 border border-honey-200/80 text-honey-800 text-xs flex items-start gap-2.5 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-honey-600" />
                <span>
                  Chỉ dùng API Key tạo từ <strong>Google AI Studio</strong> (bắt đầu bằng{' '}
                  <code className="font-mono bg-linen-50 px-1 py-0.5 rounded">AIza...</code>). Không dùng key của OpenAI/ChatGPT, Claude hay dịch vụ AI khác.
                </span>
              </div>

              <ol className="space-y-3 text-xs sm:text-sm leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-peach-500 text-linen-50 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Truy cập trang <strong>Google AI Studio</strong> và đăng nhập bằng Gmail cá nhân của bạn:{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-extrabold text-peach-600 hover:text-peach-800 underline"
                    >
                      <span>aistudio.google.com/apikey</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-peach-500 text-linen-50 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    Nhấn nút <strong>&quot;Create API key&quot;</strong> (nếu lần đầu vào, tích đồng ý điều khoản và chọn <em>Create API key in new project</em>).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-peach-500 text-linen-50 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    Nhấn biểu tượng <strong>Copy</strong> mã khóa (dạng <code className="font-mono bg-linen-200 px-1.5 py-0.5 rounded">AIzaSy...</code>).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-sage-500 text-linen-50 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    Dán vào ô <strong>&quot;Gemini API Key&quot;</strong> ngay trên thanh đầu trang web. Khi thấy nhãn xanh <strong className="text-sage-700">Đã nhập</strong> là sẵn sàng dùng AI chấm bài, tạo hội thoại, phân tích từ!
                  </div>
                </li>
              </ol>

              <div className="p-3.5 rounded-[18px] bg-sage-50 border border-sage-200/80 text-sage-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-sage-600" />
                <span>
                  <strong>Bảo mật:</strong> Key chỉ nằm tạm trong phiên làm việc hiện tại của bạn, <strong>không lưu lên máy chủ hay trình duyệt</strong>. Mỗi lần tải lại trang hoặc mở lại web bạn chỉ cần dán lại key. Các phần học thẻ SRS, Mini-Game, Ngữ pháp và Từ vựng không cần key vẫn hoạt động bình thường.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn-peach inline-flex items-center gap-1.5 px-4 py-2.5 text-xs"
                >
                  <span>Mở Google AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="clay-btn-cream px-4 py-2.5 text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
