'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ClipboardCheck,
  Gamepad2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function EnglishDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<any>('/english/summary')
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          English Study Dashboard (A1 → B2)
        </h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Không gian học Tiếng Anh cá nhân hóa từ cơ bản (A1) đến trung cao cấp (B1–B2) với SRS, Mini-Game và AI Tutor.
        </p>
      </div>

      {/* 3 thẻ thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Kho từ vựng (A1–B2)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : summary?.stats?.totalWords ?? 0}
            </div>
            <span className="text-xs text-slate-500">
              A1: {summary?.stats?.levelCounts?.A1 ?? 0} • A2: {summary?.stats?.levelCounts?.A2 ?? 0} • B1: {summary?.stats?.levelCounts?.B1 ?? 0} • B2: {summary?.stats?.levelCounts?.B2 ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Cần ôn hôm nay (SRS)</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : summary?.stats?.dueReviewCount ?? 0}
            </div>
            <span className="text-xs text-slate-500">từ vựng đến hạn ôn tập</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Ngữ pháp (A1 → B2)</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : `${summary?.stats?.grammarMastered ?? 0}/${summary?.stats?.grammarTotal ?? 0}`}
            </div>
            <span className="text-xs text-slate-500">cấu trúc đã thành thạo</span>
          </div>
        </div>
      </div>

      {/* Banner lộ trình hiện tại */}
      {summary && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Trình độ hiện tại: {summary.profile.currentLevel} • Ngày thứ {summary.profile.currentDayNumber} ({summary.profile.dailyMinutesTarget} phút/ngày)
            </div>
            <h2 className="text-xl font-bold mt-1">
              {summary.profile.placementDone
                ? `Lộ trình bậc ${summary.profile.currentLevel} (Điểm đầu vào: ${summary.profile.placementScore ?? 0}%)`
                : 'Chưa kiểm tra trình độ đầu vào (Mặc định A1)'}
            </h2>
            <p className="text-sm text-emerald-100 mt-1">
              Học 4 chặng mỗi ngày hoặc chơi Mini-Game để phản xạ từ vựng nhanh hơn.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <Link
              href="/english"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vào học hôm nay</span>
            </Link>
            <Link
              href="/english/games"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-500/40 hover:bg-emerald-500/60 text-white font-medium text-sm"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Mini-Game</span>
            </Link>
          </div>
        </div>
      )}

      {/* Thao tác nhanh Tiếng Anh */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Thao tác nhanh (Tiếng Anh)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/english/placement"
            className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 rounded-lg transition font-medium text-sm"
          >
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              <span>Test trình độ A1→B2</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
          </Link>

          <Link
            href="/english/games"
            className="flex items-center justify-between px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium text-sm shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              <span>Chơi Mini-Game nhớ từ</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-75" />
          </Link>

          <Link
            href="/english/grammar"
            className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 rounded-lg transition font-medium text-sm"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Ngữ pháp A1→B2</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
          </Link>
        </div>
      </div>
    </div>
  );
}
