'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import {
  BookOpen,
  PenTool,
  History,
  PlusCircle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Gamepad2,
  Feather,
} from 'lucide-react';

interface Stats {
  vocabularyCount: number;
  practiceSetCount: number;
  questionsPracticed: number;
}

interface CurriculumSummary {
  profile: {
    currentLevel: string;
    dailyMinutesTarget: number;
    currentDayNumber: number;
  };
  stats: {
    hsk1Count: number;
    hsk2Count: number;
    hsk3Count: number;
    hsk1Target: number;
    hsk2Target: number;
    hsk3Target: number;
    levelBreakdowns?: Record<string, Record<string, number>>;
    dueReviewCount: number;
    grammarTotal: number;
    grammarMastered: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    vocabularyCount: 0,
    practiceSetCount: 0,
    questionsPracticed: 0,
  });
  const [curriculum, setCurriculum] = useState<CurriculumSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [data, curr] = await Promise.all([
          fetchApi<Stats>('/practice/stats/dashboard'),
          fetchApi<CurriculumSummary>('/curriculum/summary').catch(() => null),
        ]);
        setStats(data);
        setCurriculum(curr);
      } catch (err) {
        console.error('Không thể tải thống kê Dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Bento Grid Top Row: Hero Welcome (7 cols) + Quick Focus Tile (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 clay-card p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-peach-200/35 blur-2xl pointer-events-none" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-peach-100/90 border border-peach-300/40 text-peach-700 text-xs font-bold shadow-clay-sm">
              <Feather className="w-3.5 h-3.5" />
              <span>Góc luyện viết tay ấm áp</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-cocoa-900 tracking-tight leading-snug">
              Chinese Writing Practice
            </h1>
            <p className="text-cocoa-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Hệ thống luyện viết tiếng Trung cá nhân kết hợp AI Google Gemini – tập trung viết tay ra giấy, nhớ sâu từng nét chữ Hán.
            </p>
          </div>

          <div className="relative pt-6 flex flex-wrap gap-3">
            <Link
              href="/study"
              className="clay-btn-peach inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vào lộ trình hôm nay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/practice/new"
              className="clay-btn-cream inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <PenTool className="w-4 h-4 text-peach-600" />
              <span>Tạo bài luyện viết</span>
            </Link>
          </div>
        </div>

        {/* Bento Side Focus Card */}
        <div className="lg:col-span-5 clay-card-peach p-7 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-linen-50/50 blur-xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-peach-700">
                Nhịp học của {user?.displayName || user?.username}
              </span>
              <h2 className="text-xl font-extrabold text-cocoa-900 mt-1">
                {curriculum
                  ? `Ngày ${curriculum.profile.currentDayNumber} • ${curriculum.profile.currentLevel || 'HSK1'} (3.0)`
                  : 'Sẵn sàng viết hôm nay'}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-[20px] bg-linen-50/90 border border-peach-300/40 shadow-clay-sm flex items-center justify-center font-chinese text-2xl font-bold text-peach-600 shrink-0">
              习
            </div>
          </div>

          {curriculum ? (
            <div className="relative grid grid-cols-2 gap-3 my-5">
              <div className="bg-linen-50/80 rounded-[20px] p-3.5 border border-peach-200/50 shadow-clay-sm">
                <div className="text-[11px] font-bold text-cocoa-500 uppercase">Mục tiêu</div>
                <div className="text-lg font-extrabold text-cocoa-900 mt-0.5">
                  {curriculum.profile.dailyMinutesTarget} phút/ngày
                </div>
              </div>
              <div className="bg-linen-50/80 rounded-[20px] p-3.5 border border-peach-200/50 shadow-clay-sm">
                <div className="text-[11px] font-bold text-cocoa-500 uppercase">Cần ôn SRS</div>
                <div className="text-lg font-extrabold text-peach-700 mt-0.5">
                  {curriculum.stats.dueReviewCount} từ
                </div>
              </div>
            </div>
          ) : (
            <p className="relative text-sm text-cocoa-600 my-5">
              Chuẩn bị giấy bút và bắt đầu phiên luyện viết hoặc chơi mini-game phản xạ từ vựng.
            </p>
          )}

          <div className="relative flex items-center gap-2">
            <Link
              href="/games"
              className="flex-1 text-center py-2.5 px-3 rounded-[18px] bg-linen-50/90 hover:bg-linen-50 text-cocoa-800 border border-cocoa-400/15 shadow-clay-sm text-xs font-bold transition inline-flex items-center justify-center gap-1.5"
            >
              <Gamepad2 className="w-4 h-4 text-peach-600" />
              <span>Mini-Game</span>
            </Link>
            <Link
              href="/grammar"
              className="flex-1 text-center py-2.5 px-3 rounded-[18px] bg-linen-50/90 hover:bg-linen-50 text-cocoa-800 border border-cocoa-400/15 shadow-clay-sm text-xs font-bold transition inline-flex items-center justify-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-sage-600" />
              <span>Ngữ pháp</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Stats Row: 3 Warm Tinted Clay Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="clay-card-hover p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-cocoa-500">Vocabulary</span>
            <div className="w-11 h-11 rounded-[18px] bg-peach-100 text-peach-600 border border-peach-200/60 shadow-clay-sm flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-4xl font-extrabold text-cocoa-900 tracking-tight">
              {loading ? '...' : `${stats.vocabularyCount}`}
            </div>
            <span className="text-xs font-semibold text-cocoa-500">từ vựng đã lưu trong sổ tay</span>
          </div>
        </div>

        <div className="clay-card-hover clay-card-sage p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-sage-700">Practice sets</span>
            <div className="w-11 h-11 rounded-[18px] bg-linen-50/90 text-sage-600 border border-sage-200/70 shadow-clay-sm flex items-center justify-center">
              <PenTool className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-4xl font-extrabold text-cocoa-900 tracking-tight">
              {loading ? '...' : `${stats.practiceSetCount}`}
            </div>
            <span className="text-xs font-semibold text-sage-700/80">bộ bài tập viết đã tạo</span>
          </div>
        </div>

        <div className="clay-card-hover clay-card-honey p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-honey-700">Questions practiced</span>
            <div className="w-11 h-11 rounded-[18px] bg-linen-50/90 text-honey-500 border border-honey-200/70 shadow-clay-sm flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-4xl font-extrabold text-cocoa-900 tracking-tight">
              {loading ? '...' : `${stats.questionsPracticed}`}
            </div>
            <span className="text-xs font-semibold text-honey-700/80">câu đã luyện viết tay</span>
          </div>
        </div>
      </div>

      {/* Bento Roadmap Showcase */}
      {curriculum && (
        <div className="rounded-[32px] bg-gradient-to-br from-peach-500 via-peach-500 to-peach-600 text-linen-50 p-6 sm:p-8 shadow-clay-peach border border-peach-300/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-honey-100/20 blur-2xl pointer-events-none" />
          <div className="relative space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linen-50/20 backdrop-blur-sm text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Tiếng Trung • Ngày {curriculum.profile.currentDayNumber} ({curriculum.profile.dailyMinutesTarget} phút/ngày)
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Lộ trình HSK 1 → 3 (Bản 3.0)</h2>
            <p className="text-sm text-peach-50/95 leading-relaxed">
              HSK 1: <strong>{curriculum.stats.hsk1Count}</strong> từ (đã học{' '}
              <strong>
                {(curriculum.stats.levelBreakdowns?.HSK1?.learning || 0) +
                  (curriculum.stats.levelBreakdowns?.HSK1?.review || 0) +
                  (curriculum.stats.levelBreakdowns?.HSK1?.mastered || 0)}
              </strong>
              ) • HSK 2: <strong>{curriculum.stats.hsk2Count}</strong> từ • HSK 3:{' '}
              <strong>{curriculum.stats.hsk3Count}</strong> từ • Cần ôn:{' '}
              <strong>{curriculum.stats.dueReviewCount}</strong> từ • Ngữ pháp:{' '}
              <strong>
                {curriculum.stats.grammarMastered}/{curriculum.stats.grammarTotal}
              </strong>
            </p>
          </div>

          <div className="relative flex gap-2.5 flex-wrap shrink-0">
            <Link
              href="/study"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[20px] bg-linen-50 text-peach-700 hover:bg-peach-50 font-extrabold text-sm shadow-clay-sm transition hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vào học hôm nay</span>
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-[20px] bg-linen-50/20 hover:bg-linen-50/30 border border-linen-50/25 text-linen-50 font-bold text-sm transition"
            >
              <span>Mini-Game</span>
            </Link>
            <Link
              href="/grammar"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-[20px] bg-linen-50/20 hover:bg-linen-50/30 border border-linen-50/25 text-linen-50 font-bold text-sm transition"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Ngữ pháp</span>
            </Link>
          </div>
        </div>
      )}

      {/* Bento Quick Actions */}
      <div className="clay-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-cocoa-900">Thao tác nhanh</h2>
          <span className="text-xs font-bold text-cocoa-400">Bento Shortcuts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/vocabulary"
            className="clay-card-oat hover:bg-peach-50/80 hover:border-peach-300/50 p-4 rounded-[24px] flex items-center justify-between text-cocoa-800 hover:text-peach-700 transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[16px] bg-linen-50 border border-cocoa-400/15 shadow-clay-sm flex items-center justify-center text-peach-600">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Add vocabulary</div>
                <div className="text-[11px] text-cocoa-500">Thêm từ mới vào sổ</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          <Link
            href="/practice/new"
            className="clay-btn-peach p-4 rounded-[24px] flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[16px] bg-linen-50/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm">Generate practice</div>
                <div className="text-[11px] text-peach-50/90 font-medium">AI sinh đề luyện viết</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          <Link
            href="/practice"
            className="clay-card-oat hover:bg-sage-50/80 hover:border-sage-300/50 p-4 rounded-[24px] flex items-center justify-between text-cocoa-800 hover:text-sage-700 transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[16px] bg-linen-50 border border-cocoa-400/15 shadow-clay-sm flex items-center justify-center text-sage-600">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Continue practice</div>
                <div className="text-[11px] text-cocoa-500">Mở lại bài tập đã lưu</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
