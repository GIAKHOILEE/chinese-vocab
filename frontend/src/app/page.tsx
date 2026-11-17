'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { BookOpen, PenTool, History, PlusCircle, ArrowRight, Sparkles, GraduationCap } from 'lucide-react';

interface Stats {
  vocabularyCount: number;
  practiceSetCount: number;
  questionsPracticed: number;
}

interface CurriculumSummary {
  profile: {
    dailyMinutesTarget: number;
    currentDayNumber: number;
  };
  stats: {
    hsk1Count: number;
    hsk2Count: number;
    hsk2Target: number;
    dueReviewCount: number;
    grammarTotal: number;
    grammarMastered: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    vocabularyCount: 0,
    practiceSetCount: 0,
    questionsPracticed: 0,
  });
  const [curriculum, setCurriculum] = useState<CurriculumSummary | null>(null);
  const [englishSummary, setEnglishSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [data, curr, eng] = await Promise.all([
          fetchApi<Stats>('/practice/stats/dashboard'),
          fetchApi<CurriculumSummary>('/curriculum/summary').catch(() => null),
          fetchApi<any>('/english/summary').catch(() => null),
        ]);
        setStats(data);
        setCurriculum(curr);
        setEnglishSummary(eng);
      } catch (err) {
        console.error('Không thể tải thống kê Dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Tiêu đề trang chủ */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Chinese Writing Practice
        </h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Hệ thống luyện viết tiếng Trung cá nhân kết hợp AI Google Gemini – Tập trung viết tay ra giấy.
        </p>
      </div>

      {/* Thẻ thống kê 3 cột */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Vocabulary</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : `${stats.vocabularyCount}`}
            </div>
            <span className="text-xs text-slate-500">từ vựng đã lưu</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Practice sets</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <PenTool className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : `${stats.practiceSetCount}`}
            </div>
            <span className="text-xs text-slate-500">bộ bài tập đã tạo</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Questions practiced</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : `${stats.questionsPracticed}`}
            </div>
            <span className="text-xs text-slate-500">câu đã luyện tập</span>
          </div>
        </div>
      </div>

      {/* 2 Lộ trình học song song: Tiếng Trung & Tiếng Anh */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {curriculum && (
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-6 rounded-xl shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
                Tiếng Trung • Ngày {curriculum.profile.currentDayNumber} ({curriculum.profile.dailyMinutesTarget}p/ngày)
              </div>
              <h2 className="text-xl font-bold mt-1">HSK 2 (Bản 3.0)</h2>
              <p className="text-xs sm:text-sm text-indigo-100 mt-1.5">
                HSK 1: {curriculum.stats.hsk1Count} từ • HSK 2: {curriculum.stats.hsk2Count}/{curriculum.stats.hsk2Target} từ • Ngữ pháp: {curriculum.stats.grammarMastered}/{curriculum.stats.grammarTotal}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/study"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm shadow-sm transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Vào học Tiếng Trung</span>
              </Link>
              <Link
                href="/grammar"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/40 hover:bg-indigo-500/60 text-white font-medium text-sm transition"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Ngữ pháp</span>
              </Link>
            </div>
          </div>
        )}

        {englishSummary && (
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-6 rounded-xl shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                Tiếng Anh • Bậc {englishSummary.profile.currentLevel} • Ngày {englishSummary.profile.currentDayNumber}
              </div>
              <h2 className="text-xl font-bold mt-1">English Roadmap (A1 → B2)</h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1.5">
                Kho từ: {englishSummary.stats.totalWords} từ (A1–B2) • Ngữ pháp: {englishSummary.stats.grammarMastered}/{englishSummary.stats.grammarTotal}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/english"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm shadow-sm transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Vào học Tiếng Anh</span>
              </Link>
              <Link
                href="/english/placement"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/40 hover:bg-emerald-500/60 text-white font-medium text-sm transition"
              >
                <span>Test trình độ</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Các nút hành động nhanh */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Thao tác nhanh</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/vocabulary"
            className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-lg transition font-medium text-sm group"
          >
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
              <span>Add vocabulary</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
          </Link>

          <Link
            href="/practice/new"
            className="flex items-center justify-between px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium text-sm shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Generate practice</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-75 group-hover:opacity-100" />
          </Link>

          <Link
            href="/practice"
            className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition font-medium text-sm group"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Continue practice</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
          </Link>
        </div>
      </div>
    </div>
  );
}
