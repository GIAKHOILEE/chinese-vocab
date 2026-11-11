'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, PenTool, History, LayoutDashboard } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/vocabulary', label: 'Từ vựng', icon: BookOpen },
    { href: '/practice/new', label: 'Tạo bài tập', icon: PenTool },
    { href: '/practice', label: 'Lịch sử', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-800 text-lg hover:text-indigo-600 transition">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-chinese text-lg">
            写
          </div>
          <span>Chinese Writing Practice</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/practice' ? true : pathname === item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
