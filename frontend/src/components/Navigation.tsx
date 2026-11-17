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
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const isEnglishMode = pathname.startsWith('/english');

  const chineseNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/study', label: 'Lộ trình HSK 2', icon: Sparkles },
    { href: '/grammar', label: 'Ngữ pháp', icon: GraduationCap },
    { href: '/vocabulary', label: 'Từ vựng', icon: BookOpen },
    { href: '/practice/new', label: 'Tạo bài tập', icon: PenTool },
    { href: '/practice', label: 'Lịch sử', icon: History },
  ];

  const englishNavItems = [
    { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/english', label: 'Lộ trình A1→B2', icon: Sparkles },
    { href: '/english/placement', label: 'Test trình độ', icon: ClipboardCheck },
    { href: '/english/grammar', label: 'Ngữ pháp EN', icon: GraduationCap },
  ];

  const navItems = isEnglishMode ? englishNavItems : chineseNavItems;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        {/* Hàng 1: Logo + 2 Tab chuyển ngôn ngữ rõ ràng */}
        <div className="h-14 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-slate-800 text-base sm:text-lg hover:text-indigo-600 transition shrink-0"
          >
            <div
              className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm ${
                isEnglishMode ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
            >
              {isEnglishMode ? 'EN' : '写'}
            </div>
            <span className="hidden sm:inline">Language Studio</span>
          </Link>

          {/* 2 Tab chuyển Tiếng Trung / Tiếng Anh */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            <Link
              href="/study"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                !isEnglishMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Tiếng Trung (HSK 2)</span>
            </Link>
            <Link
              href="/english"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                isEnglishMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Tiếng Anh (A1→B2)</span>
            </Link>
          </div>
        </div>

        {/* Hàng 2: Menu chức năng theo tab đang chọn */}
        <nav className="flex items-center gap-1 sm:gap-2 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' &&
                item.href !== '/english' &&
                item.href !== '/practice' &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? isEnglishMode
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
