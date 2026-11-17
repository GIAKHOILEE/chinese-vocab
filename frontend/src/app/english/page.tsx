'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { speakEnglish } from '@/lib/speech';
import {
  Sparkles,
  Volume2,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  PenTool,
  Brain,
  Clock,
  ArrowRight,
  AlertTriangle,
  PlusCircle,
  Award,
  ClipboardCheck,
} from 'lucide-react';

interface EnglishVocabItem {
  id: string;
  word: string;
  ipa?: string;
  meaning: string;
  partOfSpeech: string;
  cefrLevel: string;
  topic: string;
  exampleEn?: string;
  exampleVi?: string;
  lastMistakeNote?: string | null;
}

interface EnglishGrammarItem {
  id: string;
  cefrLevel: string;
  title: string;
  pattern: string;
  explanation: string;
  commonMistakes?: string | null;
  status: string;
  examples: Array<{ english: string; vietnamese: string }>;
}

interface EnglishTodayPlan {
  profile: {
    currentLevel: string;
    placementDone: boolean;
    placementScore?: number | null;
    dailyMinutesTarget: number;
    newWordsPerDay: number;
    reviewWordsPerDay: number;
    grammarPerDay: number;
    preferredModel: string;
    currentDayNumber: number;
  };
  activeLevel: string;
  currentTopic: string;
  availableTopics: Array<{ topic: string; remainingCount: number }>;
  schedule: {
    reviewMinutes: number;
    newWordsMinutes: number;
    grammarMinutes: number;
    mixedPracticeMinutes: number;
  };
  reviewWords: EnglishVocabItem[];
  newWords: EnglishVocabItem[];
  grammarPoints: EnglishGrammarItem[];
}

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
const LEVEL_LABELS: Record<string, string> = {
  A1: 'A1 (Cơ bản nhất)',
  A2: 'A2 (Sơ trung cấp)',
  B1: 'B1 (Trung cấp)',
  B2: 'B2 (Trung cao cấp)',
};

const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Nhanh)' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Chấm sâu)' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
];

export default function EnglishStudyPage() {
  const [plan, setPlan] = useState<EnglishTodayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4>(1);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [expanding, setExpanding] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Phase 1
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showReviewAnswer, setShowReviewAnswer] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // Phase 2
  const [learnedNewIds, setLearnedNewIds] = useState<Set<string>>(new Set());
  const [deepDives, setDeepDives] = useState<Record<string, any>>({});
  const [loadingDeepId, setLoadingDeepId] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<any>(null);
  const [generatingDlg, setGeneratingDlg] = useState(false);
  const [showDlgHelper, setShowDlgHelper] = useState(true);

  // Phase 3
  const [grammarDoneIds, setGrammarDoneIds] = useState<Set<string>>(new Set());

  // Phase 4
  const [mixedData, setMixedData] = useState<any>(null);
  const [generatingMixed, setGeneratingMixed] = useState(false);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [evaluatingKey, setEvaluatingKey] = useState<string | null>(null);
  const [batchGrading, setBatchGrading] = useState(false);
  const [batchSummary, setBatchSummary] = useState<{ overallScore: number; overallComment: string } | null>(null);
  const [completingDay, setCompletingDay] = useState(false);
  const [coachResult, setCoachResult] = useState<any>(null);

  async function loadPlan(topic?: string, level?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (topic) params.set('topic', topic);
      if (level) params.set('level', level);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchApi<EnglishTodayPlan>(`/english/today${qs}`);
      setPlan(data);
      setDialogue(null);
      if (data.profile?.preferredModel) setSelectedModel(data.profile.preferredModel);
    } catch (err: any) {
      setBannerMsg(err.message || 'Không thể tải lộ trình tiếng Anh.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, []);

  async function handleLevelChange(level: string) {
    try {
      await fetchApi('/english/profile', {
        method: 'PATCH',
        body: JSON.stringify({ currentLevel: level }),
      });
      await loadPlan(undefined, level);
    } catch (err: any) {
      setBannerMsg(err.message);
    }
  }

  async function handleDurationChange(minutes: number) {
    const newWordsPerDay = minutes <= 60 ? 12 : minutes <= 90 ? 15 : 20;
    const reviewWordsPerDay = minutes <= 60 ? 18 : minutes <= 90 ? 25 : 30;
    try {
      await fetchApi('/english/profile', {
        method: 'PATCH',
        body: JSON.stringify({ dailyMinutesTarget: minutes, newWordsPerDay, reviewWordsPerDay }),
      });
      await loadPlan();
    } catch (err: any) {
      setBannerMsg(err.message);
    }
  }

  async function handleAiExpand() {
    if (!plan) return;
    setExpanding(true);
    setBannerMsg(null);
    try {
      const res = await fetchApi<{ addedCount: number; level: string }>('/english/ai-expand', {
        method: 'POST',
        body: JSON.stringify({ cefrLevel: plan.activeLevel, count: 20, model: selectedModel }),
      });
      setBannerMsg(`AI đã bổ sung +${res.addedCount} từ tiếng Anh trình độ ${res.level}!`);
      await loadPlan(undefined, plan.activeLevel);
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setExpanding(false);
    }
  }

  async function handleSrs(id: string, quality: 'again' | 'hard' | 'good' | 'easy') {
    await fetchApi('/english/srs-review', {
      method: 'POST',
      body: JSON.stringify({ id, quality }),
    });
    setReviewedIds((p) => new Set(p).add(id));
    setShowReviewAnswer(false);
    if (plan && reviewIdx < plan.reviewWords.length - 1) setReviewIdx((i) => i + 1);
  }

  async function handleDeepDive(id: string) {
    setLoadingDeepId(id);
    try {
      const res = await fetchApi<any>('/english/word-deep-dive', {
        method: 'POST',
        body: JSON.stringify({ id, model: selectedModel }),
      });
      setDeepDives((p) => ({ ...p, [id]: res.deepDive }));
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setLoadingDeepId(null);
    }
  }

  async function handleMarkNewLearned(id: string) {
    await fetchApi('/english/srs-review', {
      method: 'POST',
      body: JSON.stringify({ id, quality: 'good' }),
    });
    setLearnedNewIds((p) => new Set(p).add(id));
  }

  async function handleGenerateDialogue() {
    if (!plan || plan.newWords.length === 0) return;
    setGeneratingDlg(true);
    setBannerMsg(null);
    try {
      const res = await fetchApi<any>('/english/topic-dialogue', {
        method: 'POST',
        body: JSON.stringify({
          newWordIds: plan.newWords.map((w) => w.id),
          oldWordIds: plan.reviewWords.map((w) => w.id),
          topic: plan.currentTopic,
          cefrLevel: plan.activeLevel,
          model: selectedModel,
        }),
      });
      setDialogue(res);
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setGeneratingDlg(false);
    }
  }

  async function handleMarkGrammar(id: string) {
    await fetchApi(`/english/grammar/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'mastered' }),
    });
    setGrammarDoneIds((p) => new Set(p).add(id));
  }

  async function handleGenerateMixed() {
    if (!plan) return;
    setGeneratingMixed(true);
    try {
      const res = await fetchApi<any>('/english/mixed-practice', {
        method: 'POST',
        body: JSON.stringify({
          newWordIds: plan.newWords.map((w) => w.id),
          reviewWordIds: plan.reviewWords.map((w) => w.id),
          grammarIds: plan.grammarPoints.map((g) => g.id),
          cefrLevel: plan.activeLevel,
          model: selectedModel,
        }),
      });
      setMixedData(res);
      setEvaluations({});
      setBatchSummary(null);
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setGeneratingMixed(false);
    }
  }

  async function handleEvaluateAll() {
    if (!mixedData || !plan) return;
    const items: Array<{
      key: string;
      promptVietnamese: string;
      referenceEnglish?: string;
      targetWords?: string[];
      grammarTitle?: string;
      userEnglish: string;
    }> = [];

    (mixedData.translationExercises || []).forEach((ex: any, i: number) => {
      const key = `en-tr-${i}`;
      const val = userInputs[key]?.trim();
      if (val) {
        items.push({
          key,
          promptVietnamese: ex.vietnamese,
          referenceEnglish: ex.referenceEnglish,
          targetWords: ex.targetWords,
          grammarTitle: ex.grammarHint,
          userEnglish: val,
        });
      }
    });

    (mixedData.freePrompts || []).forEach((fp: any, i: number) => {
      const key = `en-fp-${i}`;
      const val = userInputs[key]?.trim();
      if (val) {
        items.push({
          key,
          promptVietnamese: fp.instruction,
          targetWords: fp.targetWords,
          grammarTitle: fp.grammarTitle,
          userEnglish: val,
        });
      }
    });

    if (items.length === 0) {
      setBannerMsg('Bạn hãy viết ít nhất 1 câu tiếng Anh trước khi bấm chấm bài nhé!');
      return;
    }

    setBatchGrading(true);
    setBannerMsg(null);
    try {
      const res = await fetchApi<any>('/english/evaluate-batch', {
        method: 'POST',
        body: JSON.stringify({ items, cefrLevel: plan.activeLevel, model: selectedModel }),
      });
      const nextMap: Record<string, any> = {};
      for (const r of res.results || []) {
        nextMap[r.key] = r;
      }
      setEvaluations(nextMap);
      setBatchSummary({ overallScore: res.overallScore, overallComment: res.overallComment });
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setBatchGrading(false);
    }
  }

  async function handleEvaluate(
    key: string,
    promptVietnamese: string,
    referenceEnglish: string | undefined,
    targetWords: string[],
    grammarTitle: string | undefined,
  ) {
    const userEnglish = userInputs[key]?.trim();
    if (!userEnglish || !plan) return;
    setEvaluatingKey(key);
    try {
      const res = await fetchApi<any>('/english/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          promptVietnamese,
          referenceEnglish,
          targetWords,
          grammarTitle,
          userEnglish,
          cefrLevel: plan.activeLevel,
          model: selectedModel,
        }),
      });
      setEvaluations((p) => ({ ...p, [key]: res }));
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setEvaluatingKey(null);
    }
  }

  async function handleCompleteDay() {
    if (!plan) return;
    setCompletingDay(true);
    const evals = Object.values(evaluations);
    const avgScore =
      evals.length > 0 ? Math.round(evals.reduce((s, e) => s + e.score, 0) / evals.length) : undefined;
    try {
      const res = await fetchApi<any>('/english/complete-day', {
        method: 'POST',
        body: JSON.stringify({
          minutesSpent: plan.profile.dailyMinutesTarget,
          newWordsLearned: learnedNewIds.size || plan.newWords.length,
          wordsReviewed: reviewedIds.size || plan.reviewWords.length,
          averageScore: avgScore,
          model: selectedModel,
        }),
      });
      setCoachResult(res.aiCoachingFeedback);
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setCompletingDay(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        Đang chuẩn bị lộ trình Tiếng Anh cá nhân hóa cho bạn...
      </div>
    );
  }

  if (!plan) return null;
  const currentReview = plan.reviewWords[reviewIdx];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Banner nhắc test đầu vào nếu chưa làm */}
      {!plan.profile.placementDone && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-amber-900">
            <strong>Bạn chưa kiểm tra trình độ đầu vào!</strong> Làm bài test nhanh 3 phút (A1 → B2) để hệ thống xếp đúng bậc xuất phát cho bạn.
          </div>
          <Link
            href="/english/placement"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Test trình độ ngay</span>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>English Roadmap (A1 → B2) • Ngày thứ {plan.profile.currentDayNumber}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Lộ trình Tiếng Anh cá nhân hóa — Bậc {LEVEL_LABELS[plan.activeLevel] || plan.activeLevel}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Đi từ nền tảng A1 đến giao tiếp & viết tự tin ở B1–B2. Kết hợp từ cũ + từ mới theo chủ đề + ngữ pháp + AI chấm bài.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAiExpand}
              disabled={expanding}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium transition disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{expanding ? 'AI đang tạo từ...' : `AI Bổ sung +20 từ ${plan.activeLevel}`}</span>
            </button>
          </div>
        </div>

        {/* Chọn cấp độ A1-B2, thời lượng & Gemini Model */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-600 font-semibold mr-1">Trình độ:</span>
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => handleLevelChange(lv)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  plan.activeLevel === lv
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lv}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 font-semibold">Thời lượng:</span>
            {[60, 90, 120].map((m) => (
              <button
                key={m}
                onClick={() => handleDurationChange(m)}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  plan.profile.dailyMinutesTarget === m
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m}p
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-600" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="border border-slate-200 rounded-md px-2.5 py-1 bg-white text-slate-700"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {bannerMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {bannerMsg}
          </div>
        )}
      </div>

      {/* 4 Chặng */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { step: 1 as const, title: 'Chặng 1: Ôn từ cũ', sub: `${reviewedIds.size}/${plan.reviewWords.length} từ • ~${plan.schedule.reviewMinutes}p`, icon: RefreshCw },
          { step: 2 as const, title: `Chặng 2: Từ mới ${plan.activeLevel}`, sub: `${learnedNewIds.size}/${plan.newWords.length} từ • ~${plan.schedule.newWordsMinutes}p`, icon: BookOpen },
          { step: 3 as const, title: 'Chặng 3: Ngữ pháp', sub: `${grammarDoneIds.size}/${plan.grammarPoints.length} điểm • ~${plan.schedule.grammarMinutes}p`, icon: GraduationCap },
          { step: 4 as const, title: 'Chặng 4: AI Chấm bài', sub: `Viết câu • ~${plan.schedule.mixedPracticeMinutes}p`, icon: PenTool },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activePhase === tab.step;
          return (
            <button
              key={tab.step}
              onClick={() => setActivePhase(tab.step)}
              className={`p-3.5 rounded-xl border text-left transition ${
                active
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </div>
              <div className={`text-xs mt-1 ${active ? 'text-emerald-100' : 'text-slate-500'}`}>
                {tab.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* CHẶNG 1: ÔN TỪ CŨ */}
      {activePhase === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Chặng 1: Ôn tập từ cũ theo lịch SRS</h2>
            <span className="text-xs text-slate-500">
              {plan.reviewWords.length > 0 ? `Thẻ ${Math.min(reviewIdx + 1, plan.reviewWords.length)} / ${plan.reviewWords.length}` : 'Chưa có từ cần ôn'}
            </span>
          </div>

          {plan.reviewWords.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Hôm nay bạn chưa có từ cũ đến hạn ôn. Hãy sang Chặng 2 để học từ mới {plan.activeLevel} nhé!
            </div>
          ) : currentReview ? (
            <div className="max-w-xl mx-auto border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4 text-center">
              <div className="flex justify-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">{currentReview.cefrLevel}</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs">{currentReview.partOfSpeech}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{currentReview.meaning}</div>
              {!showReviewAnswer ? (
                <button
                  onClick={() => setShowReviewAnswer(true)}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                >
                  Xem từ tiếng Anh & IPA
                </button>
              ) : (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-emerald-700">{currentReview.word}</span>
                    <button
                      onClick={() => speakEnglish(currentReview.word)}
                      className="p-2 rounded-full bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm text-slate-500">{currentReview.ipa}</div>
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => handleSrs(currentReview.id, 'again')} className="py-2 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold">Quên</button>
                    <button onClick={() => handleSrs(currentReview.id, 'hard')} className="py-2 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold">Khó</button>
                    <button onClick={() => handleSrs(currentReview.id, 'good')} className="py-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">Nhớ</button>
                    <button onClick={() => handleSrs(currentReview.id, 'easy')} className="py-2 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-semibold">Quá dễ</button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button onClick={() => setActivePhase(2)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium">
              <span>Sang Chặng 2: Học từ mới {plan.activeLevel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHẶNG 2: TỪ MỚI THEO CHỦ ĐỀ + HỘI THOẠI */}
      {activePhase === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-800">
                  Chặng 2: Học hiểu {plan.newWords.length} từ mới ({plan.activeLevel})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  {plan.currentTopic}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gom theo chủ đề + tạo hội thoại kết hợp từ cũ lặp lại nhiều để dễ nhớ.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {plan.availableTopics.length > 0 && (
                <select
                  value={plan.currentTopic}
                  onChange={(e) => loadPlan(e.target.value, plan.activeLevel)}
                  className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700"
                >
                  {plan.availableTopics.map((t) => (
                    <option key={t.topic} value={t.topic}>
                      {t.topic} ({t.remainingCount})
                    </option>
                  ))}
                </select>
              )}
              <button onClick={() => setActivePhase(3)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium">
                <span>Sang Chặng 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hội thoại & Mẫu câu AI */}
          {plan.newWords.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-xl border border-emerald-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Hội thoại & Mẫu câu chủ đề (Từ mới + Từ cũ)</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Nghe & đọc hội thoại thực tế chứa các từ mới hôm nay để nhớ ngữ cảnh ngay lập tức.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {dialogue && (
                    <button
                      onClick={() => setShowDlgHelper((v) => !v)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700"
                    >
                      {showDlgHelper ? 'Ẩn nghĩa Việt' : 'Hiện nghĩa Việt'}
                    </button>
                  )}
                  <button
                    onClick={handleGenerateDialogue}
                    disabled={generatingDlg}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{generatingDlg ? 'AI đang tạo...' : dialogue ? 'Tạo hội thoại khác' : 'Tạo hội thoại & mẫu câu (AI)'}</span>
                  </button>
                </div>
              </div>

              {dialogue && (
                <div className="space-y-3 pt-2 border-t border-emerald-200">
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-100 text-xs space-y-1">
                    <div className="font-bold text-sm text-slate-900">{dialogue.dialogueTitle}</div>
                    <div className="text-slate-600">{dialogue.context}</div>
                  </div>
                  <div className="space-y-2">
                    {(dialogue.dialogue || []).map((line: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs font-bold">{line.speaker}</span>
                            <span className="text-sm font-semibold text-slate-900">{line.english}</span>
                          </div>
                          {showDlgHelper && <div className="text-xs text-slate-600">{line.vietnamese}</div>}
                        </div>
                        <button onClick={() => speakEnglish(line.english)} className="p-2 rounded-full bg-slate-50 border border-slate-200 text-emerald-600 hover:bg-emerald-50 shrink-0">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {dialogue.keySentences?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {dialogue.keySentences.map((s: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex items-start justify-between gap-2 text-xs">
                          <div>
                            <div className="font-semibold text-slate-900">{s.english}</div>
                            {showDlgHelper && <div className="text-slate-600 mt-0.5">{s.vietnamese}</div>}
                          </div>
                          <button onClick={() => speakEnglish(s.english)} className="p-1.5 rounded-full bg-slate-50 text-emerald-600 shrink-0">
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {plan.newWords.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Bạn đã học hết từ mới ở bậc {plan.activeLevel}! Hãy bấm &quot;AI Bổ sung +20 từ {plan.activeLevel}&quot; ở trên hoặc nâng cấp độ lên bậc tiếp theo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.newWords.map((w) => {
                const learned = learnedNewIds.has(w.id);
                const deep = deepDives[w.id];
                return (
                  <div key={w.id} className={`bg-white rounded-xl border p-5 shadow-sm space-y-3 ${learned ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-slate-900">{w.word}</span>
                          <button onClick={() => speakEnglish(w.word)} className="p-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-emerald-600">
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-emerald-700 font-medium">{w.ipa}</div>
                        <div className="text-sm text-slate-800 font-medium mt-1">{w.meaning}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">{w.partOfSpeech}</span>
                    </div>

                    {w.exampleEn && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-800">{w.exampleEn}</div>
                          <div className="text-slate-500">{w.exampleVi}</div>
                        </div>
                        <button onClick={() => speakEnglish(w.exampleEn!)} className="p-1 text-emerald-600 shrink-0">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {deep && (
                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs space-y-1.5 text-slate-700">
                        <div><strong>Phát âm:</strong> {deep.pronunciationTip}</div>
                        <div><strong>Mẹo nhớ / Gốc từ:</strong> {deep.memoryHook}</div>
                        <div><strong>Bẫy hay gặp:</strong> {deep.commonTrap}</div>
                        {deep.collocations?.length > 0 && (
                          <div><strong>Cụm từ hay dùng:</strong> {deep.collocations.map((c: any) => `${c.phrase} (${c.meaning})`).join(' • ')}</div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleDeepDive(w.id)}
                        disabled={loadingDeepId === w.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{loadingDeepId === w.id ? 'Đang phân tích...' : deep ? 'Đã phân tích' : 'Phân tích nhớ sâu (AI)'}</span>
                      </button>
                      <button
                        onClick={() => handleMarkNewLearned(w.id)}
                        disabled={learned}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          learned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{learned ? 'Đã học' : 'Đã hiểu từ này'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CHẶNG 3: NGỮ PHÁP */}
      {activePhase === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Chặng 3: Ngữ pháp trọng tâm ({plan.activeLevel})</h2>
              <p className="text-xs text-slate-500">Nắm công thức & tránh lỗi người Việt hay mắc trước khi vào Chặng 4.</p>
            </div>
            <button onClick={() => setActivePhase(4)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium">
              <span>Sang Chặng 4</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {plan.grammarPoints.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">{g.cefrLevel}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{g.title}</h3>
                </div>
                <button
                  onClick={() => handleMarkGrammar(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    grammarDoneIds.has(g.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {grammarDoneIds.has(g.id) ? 'Đã nắm vững ✓' : 'Đánh dấu đã hiểu'}
                </button>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 text-amber-300 font-mono text-sm">{g.pattern}</div>
              <p className="text-sm text-slate-700">{g.explanation}</p>
              {g.commonMistakes && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Lỗi hay gặp:</strong> {g.commonMistakes}</span>
                </div>
              )}
              <div className="space-y-2">
                {(g.examples || []).map((ex, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900 text-sm">{ex.english}</div>
                      <div className="text-slate-600">{ex.vietnamese}</div>
                    </div>
                    <button onClick={() => speakEnglish(ex.english)} className="p-2 rounded-full bg-white border border-slate-200 text-emerald-600">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHẶNG 4: LUYỆN VIẾT & AI CHẤM BÀI */}
      {activePhase === 4 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Chặng 4: Luyện viết kết hợp & AI Chấm bài cá nhân hóa</h2>
              <p className="text-xs text-slate-500 mt-1">Viết câu tiếng Anh kết hợp từ mới + từ cũ + ngữ pháp, Gemini sẽ sửa chuẩn như người bản xứ.</p>
            </div>
            <button
              onClick={handleGenerateMixed}
              disabled={generatingMixed}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generatingMixed ? 'Đang soạn đề...' : mixedData ? 'Tạo đề mới' : 'Tạo bài tập kết hợp'}</span>
            </button>
          </div>

          {mixedData && (
            <div className="space-y-4">
              {batchSummary && (
                <div className="bg-emerald-600 text-white rounded-xl p-5 shadow-sm space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                    Kết quả chấm toàn bài (1 lần gọi AI)
                  </div>
                  <div className="text-2xl font-extrabold">Điểm tổng: {batchSummary.overallScore}/100</div>
                  <p className="text-sm text-emerald-50">{batchSummary.overallComment}</p>
                </div>
              )}

              {(mixedData.translationExercises || []).map((ex: any, i: number) => {
                const key = `en-tr-${i}`;
                const ev = evaluations[key];
                return (
                  <div key={key} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-emerald-700">Câu dịch {i + 1}</span>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{ex.vietnamese}</div>
                      <div className="text-xs text-slate-500 mt-1">Từ mục tiêu: {(ex.targetWords || []).join(', ')} • {ex.grammarHint}</div>
                    </div>
                    <input
                      type="text"
                      value={userInputs[key] || ''}
                      onChange={(e) => setUserInputs((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="Nhập câu tiếng Anh của bạn..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {ev && (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Điểm: {ev.score}/100</span>
                          <button onClick={() => speakEnglish(ev.correctedEnglish)} className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe câu chuẩn</span>
                          </button>
                        </div>
                        <div className="text-sm font-bold text-emerald-800">Câu chuẩn: {ev.correctedEnglish}</div>
                        <div><strong>Ngữ pháp:</strong> {ev.grammarFeedback}</div>
                        <div><strong>Từ vựng:</strong> {ev.vocabFeedback}</div>
                        <div className="p-2 rounded bg-emerald-50 text-emerald-900"><strong>Lời khuyên:</strong> {ev.personalizedTip}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {(mixedData.freePrompts || []).map((fp: any, i: number) => {
                const key = `en-fp-${i}`;
                const ev = evaluations[key];
                return (
                  <div key={key} className="bg-white rounded-xl border border-emerald-200 p-5 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-teal-700">Đặt câu tự do {i + 1}</span>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{fp.instruction}</div>
                      <div className="text-xs text-slate-500 mt-1">Từ bắt buộc: {(fp.targetWords || []).join(', ')} • {fp.grammarTitle}</div>
                    </div>
                    <input
                      type="text"
                      value={userInputs[key] || ''}
                      onChange={(e) => setUserInputs((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="Tự đặt câu tiếng Anh của bạn..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {ev && (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="font-bold text-emerald-800">Điểm: {ev.score}/100 • Câu chuẩn: {ev.correctedEnglish}</div>
                        <div><strong>Ngữ pháp:</strong> {ev.grammarFeedback}</div>
                        <div><strong>Từ vựng:</strong> {ev.vocabFeedback}</div>
                        <div className="p-2 rounded bg-emerald-50 text-emerald-900"><strong>Lời khuyên:</strong> {ev.personalizedTip}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="sticky bottom-4 bg-white/95 backdrop-blur border border-emerald-200 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-slate-700 font-medium">
                  Đã viết:{' '}
                  <span className="font-bold text-emerald-700">
                    {Object.values(userInputs).filter((v) => v?.trim()).length} /{' '}
                    {(mixedData.translationExercises?.length || 0) + (mixedData.freePrompts?.length || 0)}
                  </span>{' '}
                  câu
                </div>
                <button
                  onClick={handleEvaluateAll}
                  disabled={batchGrading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{batchGrading ? 'AI đang chấm toàn bộ bài...' : 'AI Chấm tất cả các câu (1 lần gọi)'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Hoàn thành Ngày {plan.profile.currentDayNumber} ({plan.activeLevel})</span>
              </div>
              <button
                onClick={handleCompleteDay}
                disabled={completingDay}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {completingDay ? 'Đang lưu...' : 'Lưu buổi học & Nhận xét AI'}
              </button>
            </div>
            {coachResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-sm text-emerald-950">
                <div className="font-bold">{coachResult.headline}</div>
                <div><strong>Điểm mạnh:</strong> {coachResult.strengths}</div>
                <div><strong>Cần cải thiện:</strong> {coachResult.areasToImprove}</div>
                <div><strong>Ngày mai:</strong> {coachResult.tomorrowFocus}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
