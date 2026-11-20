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
  Leaf,
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
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Bento Grid Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 clay-card p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-sage-200/45 blur-2xl pointer-events-none" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-100/90 border border-sage-300/45 text-sage-700 text-xs font-bold shadow-clay-sm">
              <Leaf className="w-3.5 h-3.5" />
              <span>Không gian Tiếng Anh A1 → B2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-cocoa-900 tracking-tight leading-snug">
              English Study Dashboard
            </h1>
            <p className="text-cocoa-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Không gian học Tiếng Anh cá nhân hóa từ cơ bản (A1) đến trung cao cấp (B1–B2) với SRS, Mini-Game và AI Tutor.
            </p>
          </div>

          <div className="relative pt-6 flex flex-wrap gap-3">
            <Link
              href="/english"
              className="clay-btn-sage inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vào học hôm nay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/english/placement"
              className="clay-btn-cream inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <ClipboardCheck className="w-4 h-4 text-sage-600" />
              <span>Test trình độ</span>
            </Link>
          </div>
        </div>

        {/* Bento Side Focus Card */}
        <div className="lg:col-span-5 clay-card-sage p-7 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-linen-50/55 blur-xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-sage-700">
                Hồ sơ trình độ
              </span>
              <h2 className="text-xl font-extrabold text-cocoa-900 mt-1">
                {summary
                  ? `Bậc ${summary.profile.currentLevel} • Ngày ${summary.profile.currentDayNumber}`
                  : 'Lộ trình cá nhân hóa'}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-[20px] bg-linen-50/90 border border-sage-300/45 shadow-clay-sm flex items-center justify-center text-lg font-extrabold text-sage-700 shrink-0">
              {summary?.profile?.currentLevel || 'A1'}
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-3 my-5">
            <div className="bg-linen-50/80 rounded-[20px] p-3.5 border border-sage-200/60 shadow-clay-sm">
              <div className="text-[11px] font-bold text-cocoa-500 uppercase">Thời lượng</div>
              <div className="text-lg font-extrabold text-cocoa-900 mt-0.5">
                {summary?.profile?.dailyMinutesTarget ?? 60} phút/ngày
              </div>
            </div>
            <div className="bg-linen-50/80 rounded-[20px] p-3.5 border border-sage-200/60 shadow-clay-sm">
              <div className="text-[11px] font-bold text-cocoa-500 uppercase">Đầu vào</div>
              <div className="text-lg font-extrabold text-sage-700 mt-0.5">
                {summary?.profile?.placementDone ? `${summary.profile.placementScore ?? 0}%` : 'Chưa test'}
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <Link
              href="/english/games"
              className="flex-1 text-center py-2.5 px-3 rounded-[18px] bg-linen-50/90 hover:bg-linen-50 text-cocoa-800 border border-cocoa-400/15 shadow-clay-sm text-xs font-bold transition inline-flex items-center justify-center gap-1.5"
            >
              <Gamepad2 className="w-4 h-4 text-peach-600" />
              <span>Mini-Game</span>
            </Link>
            <Link
              href="/english/grammar"
              className="flex-1 text-center py-2.5 px-3 rounded-[18px] bg-linen-50/90 hover:bg-linen-50 text-cocoa-800 border border-cocoa-400/15 shadow-clay-sm text-xs font-bold transition inline-flex items-center justify-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-sage-600" />
              <span>Ngữ pháp EN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 thẻ thống kê Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="clay-card-hover p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-cocoa-500">Kho từ vựng (A1–B2)</span>
            <div className="w-11 h-11 rounded-[18px] bg-sage-100 text-sage-600 border border-sage-200/70 shadow-clay-sm flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-4xl font-extrabold text-cocoa-900 tracking-tight">
              {loading ? '...' : summary?.stats?.totalWords ?? 0}
            </div>
            <span className="text-xs font-semibold text-cocoa-500">
              A1: {summary?.stats?.levelCounts?.A1 ?? 0} • A2: {summary?.stats?.levelCounts?.A2 ?? 0} • B1: {summary?.stats?.levelCounts?.B1 ?? 0} • B2: {summary?.stats?.levelCounts?.B2 ?? 0}
            </span>
          </div>
        </div>

        <div className="clay-card-hover clay-card-peach p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-peach-700">Cần ôn hôm nay (SRS)</span>
            <div className="w-11 h-11 rounded-[18px] bg-linen-50/90 text-peach-600 border border-peach-200/70 shadow-clay-sm flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-4xl font-extrabold text-cocoa-900 tracking-tight">
              {loading ? '...' : summary?.stats?.dueReviewCount ?? 0}
            </div>
            <span className="text-xs font-semibold text-peach-700/80">từ vựng đến hạn ôn tập</span>
          </div>
        </div>

        <div className="clay-card-hover clay-card-honey p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-honey-700">Ngữ pháp (A1 → B2)</span>
            <div className="w-11 h-11 rounded-[18px] bg-linen-50/90 text-honey-500 border border-honey-200/70 shadow-clay-sm flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-4xl font-extrabold text-cocoa-900 tracking-tight">
              {loading ? '...' : `${summary?.stats?.grammarMastered ?? 0}/${summary?.stats?.grammarTotal ?? 0}`}
            </div>
            <span className="text-xs font-semibold text-honey-700/80">cấu trúc đã thành thạo</span>
          </div>
        </div>
      </div>

      {/* Banner lộ trình hiện tại */}
      {summary && (
        <div className="rounded-[32px] bg-gradient-to-br from-sage-500 via-sage-500 to-sage-600 text-linen-50 p-6 sm:p-8 shadow-clay-sage border border-sage-300/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-linen-50/15 blur-2xl pointer-events-none" />
          <div className="relative space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linen-50/20 backdrop-blur-sm text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Trình độ hiện tại: {summary.profile.currentLevel} • Ngày thứ {summary.profile.currentDayNumber} ({summary.profile.dailyMinutesTarget} phút/ngày)
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {summary.profile.placementDone
                ? `Lộ trình bậc ${summary.profile.currentLevel} (Điểm đầu vào: ${summary.profile.placementScore ?? 0}%)`
                : 'Chưa kiểm tra trình độ đầu vào (Mặc định A1)'}
            </h2>
            <p className="text-sm text-sage-50/95">
              Học 4 chặng mỗi ngày hoặc chơi Mini-Game để phản xạ từ vựng nhanh hơn.
            </p>
          </div>
          <div className="relative flex gap-2.5 flex-wrap shrink-0">
            <Link
              href="/english"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[20px] bg-linen-50 text-sage-700 hover:bg-sage-50 font-extrabold text-sm shadow-clay-sm transition hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vào học hôm nay</span>
            </Link>
            <Link
              href="/english/games"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-[20px] bg-linen-50/20 hover:bg-linen-50/30 border border-linen-50/25 text-linen-50 font-bold text-sm transition"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Mini-Game</span>
            </Link>
          </div>
        </div>
      )}

      {/* Thao tác nhanh Tiếng Anh */}
      <div className="clay-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-cocoa-900">Thao tác nhanh (Tiếng Anh)</h2>
          <span className="text-xs font-bold text-cocoa-400">Bento Shortcuts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/english/placement"
            className="clay-card-oat hover:bg-peach-50/80 hover:border-peach-300/50 p-4 rounded-[24px] flex items-center justify-between text-cocoa-800 hover:text-peach-700 transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[16px] bg-linen-50 border border-cocoa-400/15 shadow-clay-sm flex items-center justify-center text-peach-600">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Test trình độ A1→B2</div>
                <div className="text-[11px] text-cocoa-500">Xếp bậc chuẩn bằng AI</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          <Link
            href="/english/games"
            className="clay-btn-sage p-4 rounded-[24px] flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[16px] bg-linen-50/20 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm">Chơi Mini-Game nhớ từ</div>
                <div className="text-[11px] text-sage-50/90 font-medium">Nối cặp • Quiz • Nghe gõ</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          <Link
            href="/english/grammar"
            className="clay-card-oat hover:bg-sage-50/80 hover:border-sage-300/50 p-4 rounded-[24px] flex items-center justify-between text-cocoa-800 hover:text-sage-700 transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[16px] bg-linen-50 border border-cocoa-400/15 shadow-clay-sm flex items-center justify-center text-sage-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Ngữ pháp A1→B2</div>
                <div className="text-[11px] text-cocoa-500">Công thức & AI chấm câu</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
