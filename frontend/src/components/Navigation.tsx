'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const isEnglishMode = pathname.startsWith('/english');

  const chineseNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/study', label: 'Lộ trình HSK 2', icon: Sparkles },
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
    <header className="sticky top-0 z-50 pt-3 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto bg-linen-50/88 backdrop-blur-md rounded-[28px] border border-cocoa-400/20 shadow-clay px-4 sm:px-6 py-2.5">
        {/* Hàng 1: Logo + 2 Tab chuyển ngôn ngữ riêng biệt */}
        <div className="h-12 flex items-center justify-between gap-3">
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
                {isEnglishMode ? 'Cozy A1 → B2' : 'Cozy HSK 2 Paper'}
              </span>
            </div>
          </Link>

          {/* 2 Tab chuyển Tiếng Trung / Tiếng Anh (mỗi tab vào Dashboard riêng) */}
          <div className="inline-flex p-1.5 rounded-[22px] bg-linen-200/85 border border-cocoa-400/15 shadow-clay-inset gap-1">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[16px] text-xs sm:text-sm font-bold transition-all duration-200 ${
                !isEnglishMode
                  ? 'bg-gradient-to-b from-peach-400 to-peach-500 text-linen-50 shadow-clay-peach'
                  : 'text-cocoa-600 hover:text-cocoa-900 hover:bg-linen-50/60'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Tiếng Trung (HSK 2)</span>
            </Link>
            <Link
              href="/english/dashboard"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[16px] text-xs sm:text-sm font-bold transition-all duration-200 ${
                isEnglishMode
                  ? 'bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 shadow-clay-sage'
                  : 'text-cocoa-600 hover:text-cocoa-900 hover:bg-linen-50/60'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Tiếng Anh (A1→B2)</span>
            </Link>
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
      </div>
    </header>
  );
}
