'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi, fetchApiCached, getCachedApi, invalidateApiCache } from '@/lib/api';
import { GEMINI_MODELS, useGeminiConfig } from '@/components/GeminiProvider';
import { StudyPlanSkeleton, SyncingPill, useAiProgressStep } from '@/components/LoadingPrimitives';
import { speakEnglish } from '@/lib/speech';
import {
  Sparkles,
  Volume2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  BookOpen,
  GraduationCap,
  PenTool,
  Brain,
  Clock,
  ArrowRight,
  AlertTriangle,
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

export default function EnglishStudyPage() {
  const { model: selectedModel, setModel: setSelectedModel } = useGeminiConfig();
  const [plan, setPlan] = useState<EnglishTodayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4>(1);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Phase 1
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showReviewAnswer, setShowReviewAnswer] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewInput, setReviewInput] = useState('');
  const [reviewCheckResult, setReviewCheckResult] = useState<'correct' | 'wrong' | null>(null);

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

  const dialogueStepLabel = useAiProgressStep(generatingDlg, [
    'Đang gửi từ vựng cho Gemini...',
    'Đang tạo hội thoại ngữ cảnh tự nhiên...',
    'Đang dịch & hoàn thiện mẫu câu...',
  ]);
  const mixedStepLabel = useAiProgressStep(generatingMixed, [
    'Đang tổng hợp từ mới, từ cũ & ngữ pháp...',
    'AI đang thiết kế câu dịch & bài viết...',
  ]);
  const batchGradeStepLabel = useAiProgressStep(batchGrading, [
    'Đang gửi bài viết lên Gemini...',
    'AI đang chấm ngữ pháp & độ tự nhiên...',
    'Đang tổng hợp nhận xét cá nhân hóa...',
  ]);

  async function loadPlan(topic?: string, level?: string) {
    const params = new URLSearchParams();
    if (topic) params.set('topic', topic);
    if (level) params.set('level', level);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const endpoint = `/english/today${qs}`;

    const cached = getCachedApi<EnglishTodayPlan>(endpoint);
    if (cached) {
      setPlan(cached);
      setLoading(false);
      setSyncing(true);
    } else if (!plan) {
      setLoading(true);
    } else {
      setSyncing(true);
    }

    try {
      const data = await fetchApiCached<EnglishTodayPlan>(endpoint);
      setPlan(data);
      if (topic !== undefined || level !== undefined) {
        setDialogue(null);
      }
    } catch (err: any) {
      if (!cached) {
        setBannerMsg(err.message || 'Không thể tải lộ trình tiếng Anh.');
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, []);

  async function handleLevelChange(level: string) {
    setReviewIdx(0);
    setLearnedNewIds(new Set());
    setGrammarDoneIds(new Set());
    setMixedData(null);
    setEvaluations({});
    setBatchSummary(null);
    setPlan((prev) => (prev ? { ...prev, activeLevel: level } : prev));
    invalidateApiCache(['/english/today', '/english/summary']);
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
    setPlan((prev) =>
      prev
        ? { ...prev, profile: { ...prev.profile, dailyMinutesTarget: minutes, newWordsPerDay, reviewWordsPerDay } }
        : prev,
    );
    invalidateApiCache(['/english/today', '/english/summary']);
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

  function handleCheckReviewAnswer() {
    if (!currentReview) return;
    const raw = reviewInput.trim();
    if (!raw) {
      setReviewCheckResult(null);
      setShowReviewAnswer(true);
      return;
    }
    const normalizedInput = raw.replace(/\s+/g, ' ').toLowerCase();
    const normalizedTarget = currentReview.word.trim().replace(/\s+/g, ' ').toLowerCase();
    setReviewCheckResult(normalizedInput === normalizedTarget ? 'correct' : 'wrong');
    setShowReviewAnswer(true);
  }

  async function handleSrs(id: string, quality: 'again' | 'hard' | 'good' | 'easy') {
    const prevIdx = reviewIdx;
    setReviewedIds((p) => new Set(p).add(id));
    setShowReviewAnswer(false);
    setReviewInput('');
    setReviewCheckResult(null);
    if (plan && reviewIdx < plan.reviewWords.length - 1) setReviewIdx((i) => i + 1);
    invalidateApiCache(['/english/today', '/english/summary']);
    try {
      await fetchApi('/english/srs-review', {
        method: 'POST',
        body: JSON.stringify({ id, quality }),
      });
    } catch (err: any) {
      setReviewedIds((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
      setReviewIdx(prevIdx);
      setBannerMsg(err.message || 'Không thể lưu tiến độ ôn tập.');
    }
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
    setLearnedNewIds((p) => new Set(p).add(id));
    invalidateApiCache(['/english/today', '/english/summary']);
    try {
      await fetchApi('/english/srs-review', {
        method: 'POST',
        body: JSON.stringify({ id, quality: 'good' }),
      });
    } catch (err: any) {
      setLearnedNewIds((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
      setBannerMsg(err.message || 'Không thể đánh dấu từ mới.');
    }
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
    setGrammarDoneIds((p) => new Set(p).add(id));
    invalidateApiCache(['/english/today', '/english/summary', '/english/grammar']);
    try {
      await fetchApi(`/english/grammar/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'mastered' }),
      });
    } catch (err: any) {
      setGrammarDoneIds((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
      setBannerMsg(err.message);
    }
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

  if (loading && !plan) {
    return <StudyPlanSkeleton label="Đang chuẩn bị lộ trình Tiếng Anh cá nhân hóa cho bạn..." />;
  }

  if (!plan) return null;
  const currentReview = plan.reviewWords[reviewIdx];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Banner nhắc test đầu vào nếu chưa làm */}
      {!plan.profile.placementDone && (
        <div className="clay-card-honey p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-honey-700">
            <strong>Bạn chưa kiểm tra trình độ đầu vào!</strong> Làm bài test nhanh 3 phút (A1 → B2) để hệ thống xếp đúng bậc xuất phát cho bạn.
          </div>
          <Link
            href="/english/placement"
            className="clay-btn-peach inline-flex items-center gap-1.5 px-4 py-2.5 text-xs shrink-0"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Test trình độ ngay</span>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="clay-card p-6 sm:p-7 space-y-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-sage-200/40 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-100/90 border border-sage-200/70 text-sage-700 text-xs font-extrabold shadow-clay-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>English Roadmap (A1 → B2) • Ngày thứ {plan.profile.currentDayNumber}</span>
              </div>
              <SyncingPill syncing={syncing} tone="sage" label="Đang cập nhật lộ trình..." />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-cocoa-900 tracking-tight">
              Lộ trình Tiếng Anh cá nhân hóa — Bậc {LEVEL_LABELS[plan.activeLevel] || plan.activeLevel}
            </h1>
            <p className="text-sm text-cocoa-600 mt-1">
              Đi từ nền tảng A1 đến giao tiếp & viết tự tin ở B1–B2. Kết hợp từ cũ + từ mới theo chủ đề + ngữ pháp + AI chấm bài.
            </p>
          </div>
        </div>

        {/* Chọn cấp độ A1-B2, thời lượng & Gemini Model */}
        <div className="relative pt-4 border-t border-cocoa-400/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-cocoa-600 font-extrabold mr-1">Trình độ:</span>
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => handleLevelChange(lv)}
                className={`px-3.5 py-1.5 rounded-[14px] font-extrabold transition ${
                  plan.activeLevel === lv
                    ? 'clay-btn-sage'
                    : 'bg-linen-200/80 text-cocoa-600 hover:bg-linen-300/80'
                }`}
              >
                {lv}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Clock className="w-4 h-4 text-cocoa-400" />
            <span className="text-cocoa-600 font-extrabold">Thời lượng:</span>
            {[60, 90, 120].map((m) => (
              <button
                key={m}
                onClick={() => handleDurationChange(m)}
                className={`px-3 py-1.5 rounded-[14px] font-extrabold transition ${
                  plan.profile.dailyMinutesTarget === m
                    ? 'bg-cocoa-800 text-linen-50 shadow-clay-dark'
                    : 'bg-linen-200/80 text-cocoa-600 hover:bg-linen-300/80'
                }`}
              >
                {m}p
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-sage-600" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="clay-input-sage px-3 py-1.5 text-xs font-semibold"
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
          <div className="relative p-3.5 rounded-[20px] bg-sage-100/85 border border-sage-300/60 text-sage-800 text-sm font-bold shadow-clay-sm">
            {bannerMsg}
          </div>
        )}
      </div>

      {/* 4 Chặng (Bento Grid Tabs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
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
              className={`p-4 rounded-[24px] border text-left transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 border-sage-300/50 shadow-clay-sage -translate-y-0.5'
                  : 'clay-card-hover text-cocoa-700'
              }`}
            >
              <div className="flex items-center gap-2 font-extrabold text-sm">
                <Icon className={`w-4 h-4 ${active ? 'text-linen-50' : 'text-sage-600'}`} />
                <span>{tab.title}</span>
              </div>
              <div className={`text-xs mt-1.5 font-semibold ${active ? 'text-sage-50/90' : 'text-cocoa-500'}`}>
                {tab.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* CHẶNG 1: ÔN TỪ CŨ */}
      {activePhase === 1 && (
        <div className="clay-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-cocoa-900">Chặng 1: Ôn tập từ cũ theo lịch SRS</h2>
            <span className="px-3.5 py-1 rounded-full bg-linen-200/85 text-cocoa-700 text-xs font-extrabold self-start sm:self-auto">
              {plan.reviewWords.length > 0 ? `Thẻ ${Math.min(reviewIdx + 1, plan.reviewWords.length)} / ${plan.reviewWords.length}` : 'Chưa có từ cần ôn'}
            </span>
          </div>

          {plan.reviewWords.length === 0 ? (
            <div className="clay-inset text-center py-10 px-4 text-cocoa-500 text-sm font-semibold">
              Hôm nay bạn chưa có từ cũ đến hạn ôn. Hãy sang Chặng 2 để học từ mới {plan.activeLevel} nhé!
            </div>
          ) : currentReview ? (
            <div className="max-w-xl mx-auto clay-card-oat p-6 sm:p-8 space-y-5 text-center">
              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 border border-sage-200/70 text-xs font-extrabold">
                  {currentReview.cefrLevel}
                </span>
                <span className="px-3 py-1 rounded-full bg-peach-100 text-peach-700 border border-peach-200/70 text-xs font-bold">
                  {currentReview.partOfSpeech}
                </span>
              </div>
              <div className="clay-inset py-5 px-4">
                <p className="text-xs text-cocoa-400 font-bold uppercase tracking-wider mb-1.5">
                  Nhớ lại & nhập thử từ tiếng Anh
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold text-cocoa-900">{currentReview.meaning}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !showReviewAnswer && reviewInput.trim()) {
                      handleCheckReviewAnswer();
                    }
                  }}
                  disabled={showReviewAnswer}
                  placeholder="Nhập từ tiếng Anh để kiểm tra..."
                  className="flex-1 clay-input-sage px-4 py-3 text-center text-base font-bold disabled:opacity-70"
                />
                {!showReviewAnswer && (
                  <button
                    type="button"
                    onClick={handleCheckReviewAnswer}
                    disabled={!reviewInput.trim()}
                    className="clay-btn-sage px-5 py-3 text-sm shrink-0"
                  >
                    Kiểm tra
                  </button>
                )}
              </div>

              {reviewCheckResult && (
                <div
                  className={`p-3 rounded-[18px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border ${
                    reviewCheckResult === 'correct'
                      ? 'bg-sage-100/90 border-sage-300/60 text-sage-800'
                      : 'bg-berry-100/90 border-berry-200 text-berry-700'
                  }`}
                >
                  {reviewCheckResult === 'correct' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Chính xác!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Chưa khớp ({reviewInput.trim()}). Hãy đối chiếu đáp án bên dưới!</span>
                    </>
                  )}
                </div>
              )}

              {!showReviewAnswer ? (
                <button
                  onClick={handleCheckReviewAnswer}
                  className="clay-btn-dark px-6 py-3 text-sm"
                >
                  Xem từ tiếng Anh & IPA
                </button>
              ) : (
                <div className="space-y-4 pt-4 border-t border-cocoa-400/15 animate-fade-in">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-extrabold text-sage-700">{currentReview.word}</span>
                    <button
                      onClick={() => speakEnglish(currentReview.word)}
                      className="p-2.5 rounded-full bg-linen-50 border border-cocoa-400/20 text-sage-600 hover:bg-sage-50 shadow-clay-sm transition"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm text-cocoa-500 font-bold">{currentReview.ipa}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button onClick={() => handleSrs(currentReview.id, 'again')} className="py-2.5 rounded-[16px] bg-berry-100 hover:bg-berry-200/80 text-berry-700 border border-berry-200 text-xs font-extrabold shadow-clay-sm transition">Quên</button>
                    <button onClick={() => handleSrs(currentReview.id, 'hard')} className="py-2.5 rounded-[16px] bg-honey-100 hover:bg-honey-200/80 text-honey-700 border border-honey-200 text-xs font-extrabold shadow-clay-sm transition">Khó</button>
                    <button onClick={() => handleSrs(currentReview.id, 'good')} className="py-2.5 rounded-[16px] bg-sage-100 hover:bg-sage-200/80 text-sage-700 border border-sage-300/60 text-xs font-extrabold shadow-clay-sm transition">Nhớ</button>
                    <button onClick={() => handleSrs(currentReview.id, 'easy')} className="py-2.5 rounded-[16px] bg-peach-100 hover:bg-peach-200/80 text-peach-700 border border-peach-300/60 text-xs font-extrabold shadow-clay-sm transition">Quá dễ</button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button onClick={() => setActivePhase(2)} className="clay-btn-dark inline-flex items-center gap-2 px-5 py-3 text-sm">
              <span>Sang Chặng 2: Học từ mới {plan.activeLevel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHẶNG 2: TỪ MỚI THEO CHỦ ĐỀ + HỘI THOẠI */}
      {activePhase === 2 && (
        <div className="space-y-5">
          <div className="clay-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-extrabold text-cocoa-900">
                  Chặng 2: Học hiểu {plan.newWords.length} từ mới ({plan.activeLevel})
                </h2>
                <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 border border-sage-200/70 text-xs font-extrabold">
                  {plan.currentTopic}
                </span>
              </div>
              <p className="text-xs text-cocoa-500 mt-1.5">
                Gom theo chủ đề + tạo hội thoại kết hợp từ cũ lặp lại nhiều để dễ nhớ.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {plan.availableTopics.length > 0 && (
                <select
                  value={plan.currentTopic}
                  onChange={(e) => loadPlan(e.target.value, plan.activeLevel)}
                  className="clay-input-sage px-3.5 py-2.5 text-xs font-bold"
                >
                  {plan.availableTopics.map((t) => (
                    <option key={t.topic} value={t.topic}>
                      {t.topic} ({t.remainingCount})
                    </option>
                  ))}
                </select>
              )}
              <button onClick={() => setActivePhase(3)} className="clay-btn-dark inline-flex items-center gap-1.5 px-5 py-2.5 text-sm">
                <span>Sang Chặng 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hội thoại & Mẫu câu AI */}
          {plan.newWords.length > 0 && (
            <div className="clay-card-sage p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-cocoa-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sage-600" />
                    <span>Hội thoại & Mẫu câu chủ đề (Từ mới + Từ cũ)</span>
                  </h3>
                  <p className="text-xs text-cocoa-600 mt-0.5">
                    Nghe & đọc hội thoại thực tế chứa các từ mới hôm nay để nhớ ngữ cảnh ngay lập tức.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {dialogue && (
                    <button
                      onClick={() => setShowDlgHelper((v) => !v)}
                      className="clay-btn-cream px-3.5 py-2 text-xs"
                    >
                      {showDlgHelper ? 'Ẩn nghĩa Việt' : 'Hiện nghĩa Việt'}
                    </button>
                  )}
                  <button
                    onClick={handleGenerateDialogue}
                    disabled={generatingDlg}
                    className="clay-btn-sage inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{generatingDlg ? dialogueStepLabel || 'AI đang tạo...' : dialogue ? 'Tạo hội thoại khác' : 'Tạo hội thoại & mẫu câu (AI)'}</span>
                  </button>
                </div>
              </div>

              {dialogue && (
                <div className="space-y-3.5 pt-3 border-t border-sage-300/45 animate-fade-in">
                  <div className="bg-linen-50/90 p-4 rounded-[22px] border border-sage-200/70 shadow-clay-sm text-xs space-y-1">
                    <div className="font-extrabold text-sm text-cocoa-900">{dialogue.dialogueTitle}</div>
                    <div className="text-cocoa-600">{dialogue.context}</div>
                  </div>
                  <div className="space-y-2.5">
                    {(dialogue.dialogue || []).map((line: any, idx: number) => (
                      <div key={idx} className="bg-linen-50/95 p-4 rounded-[22px] border border-cocoa-400/15 shadow-clay-sm flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-sage-500 text-linen-50 text-xs font-extrabold">{line.speaker}</span>
                            <span className="text-sm font-bold text-cocoa-900">{line.english}</span>
                          </div>
                          {showDlgHelper && <div className="text-xs text-cocoa-600">{line.vietnamese}</div>}
                        </div>
                        <button onClick={() => speakEnglish(line.english)} className="p-2 rounded-full bg-linen-100 border border-cocoa-400/15 text-sage-600 hover:bg-sage-100 shadow-clay-sm shrink-0 transition">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {dialogue.keySentences?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {dialogue.keySentences.map((s: any, idx: number) => (
                        <div key={idx} className="bg-linen-50/90 p-3.5 rounded-[20px] border border-cocoa-400/15 shadow-clay-sm flex items-start justify-between gap-2 text-xs">
                          <div>
                            <div className="font-bold text-cocoa-900">{s.english}</div>
                            {showDlgHelper && <div className="text-cocoa-600 mt-0.5">{s.vietnamese}</div>}
                          </div>
                          <button onClick={() => speakEnglish(s.english)} className="p-1.5 rounded-full bg-linen-100 text-sage-600 shrink-0 shadow-clay-sm">
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
            <div className="clay-card p-10 text-center text-cocoa-500 text-sm font-semibold">
              Bạn đã hoàn thành toàn bộ từ mới ở bậc {plan.activeLevel}! Hãy chuyển trình độ sang bậc tiếp theo ở thanh trên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {plan.newWords.map((w) => {
                const learned = learnedNewIds.has(w.id);
                const deep = deepDives[w.id];
                return (
                  <div key={w.id} className={`p-6 space-y-3.5 ${learned ? 'clay-card-sage' : 'clay-card-hover'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl font-extrabold text-cocoa-900">{w.word}</span>
                          <button onClick={() => speakEnglish(w.word)} className="p-2 rounded-full bg-sage-100 hover:bg-sage-200/80 text-sage-600 shadow-clay-sm transition">
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-sage-700 font-bold mt-0.5">{w.ipa}</div>
                        <div className="text-sm text-cocoa-800 font-bold mt-1">{w.meaning}</div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-linen-200/90 text-cocoa-600 text-xs font-bold">{w.partOfSpeech}</span>
                    </div>

                    {w.exampleEn && (
                      <div className="clay-inset p-3.5 text-xs flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-cocoa-800">{w.exampleEn}</div>
                          <div className="text-cocoa-500 mt-0.5">{w.exampleVi}</div>
                        </div>
                        <button onClick={() => speakEnglish(w.exampleEn!)} className="p-1.5 text-sage-600 hover:bg-sage-100 rounded-full shrink-0">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {deep && (
                      <div className="p-4 rounded-[20px] bg-sage-50/95 border border-sage-200/70 text-xs space-y-1.5 text-cocoa-700 shadow-clay-sm">
                        <div><strong>Phát âm:</strong> {deep.pronunciationTip}</div>
                        <div><strong>Mẹo nhớ / Gốc từ:</strong> {deep.memoryHook}</div>
                        <div><strong>Bẫy hay gặp:</strong> {deep.commonTrap}</div>
                        {deep.collocations?.length > 0 && (
                          <div><strong>Cụm từ hay dùng:</strong> {deep.collocations.map((c: any) => `${c.phrase} (${c.meaning})`).join(' • ')}</div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-cocoa-400/15">
                      <button
                        onClick={() => handleDeepDive(w.id)}
                        disabled={loadingDeepId === w.id}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sage-700 hover:text-sage-800"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{loadingDeepId === w.id ? 'Đang phân tích...' : deep ? 'Đã phân tích' : 'Phân tích nhớ sâu (AI)'}</span>
                      </button>
                      <button
                        onClick={() => handleMarkNewLearned(w.id)}
                        disabled={learned}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[16px] text-xs font-extrabold transition ${
                          learned ? 'bg-sage-100 text-sage-700 border border-sage-300/60' : 'clay-btn-dark'
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
        <div className="space-y-5">
          <div className="clay-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-cocoa-900">Chặng 3: Ngữ pháp trọng tâm ({plan.activeLevel})</h2>
              <p className="text-xs text-cocoa-500 mt-1">Nắm công thức & tránh lỗi người Việt hay mắc trước khi vào Chặng 4.</p>
            </div>
            <button onClick={() => setActivePhase(4)} className="clay-btn-dark inline-flex items-center gap-1.5 px-5 py-2.5 text-sm self-start sm:self-auto">
              <span>Sang Chặng 4</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {plan.grammarPoints.map((g) => (
            <div key={g.id} className="clay-card p-6 sm:p-7 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 border border-sage-200/70 text-xs font-extrabold">{g.cefrLevel}</span>
                  <h3 className="text-lg font-extrabold text-cocoa-900 mt-2">{g.title}</h3>
                </div>
                <button
                  onClick={() => handleMarkGrammar(g.id)}
                  className={`px-4 py-2 rounded-[16px] text-xs font-extrabold transition ${
                    grammarDoneIds.has(g.id) ? 'bg-sage-100 text-sage-700 border border-sage-300/60 shadow-clay-sm' : 'clay-btn-sage'
                  }`}
                >
                  {grammarDoneIds.has(g.id) ? 'Đã nắm vững ✓' : 'Đánh dấu đã hiểu'}
                </button>
              </div>
              <div className="clay-formula">{g.pattern}</div>
              <p className="text-sm text-cocoa-700 leading-relaxed">{g.explanation}</p>
              {g.commonMistakes && (
                <div className="p-3.5 rounded-[20px] bg-honey-100/85 border border-honey-200/80 text-honey-700 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-honey-500" />
                  <span><strong>Lỗi hay gặp:</strong> {g.commonMistakes}</span>
                </div>
              )}
              <div className="space-y-2.5">
                {(g.examples || []).map((ex, i) => (
                  <div key={i} className="clay-inset p-3.5 flex items-center justify-between gap-3">
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-cocoa-900 text-sm">{ex.english}</div>
                      <div className="text-cocoa-600">{ex.vietnamese}</div>
                    </div>
                    <button onClick={() => speakEnglish(ex.english)} className="p-2 rounded-full bg-linen-50 border border-cocoa-400/20 text-sage-600 hover:bg-sage-50 shadow-clay-sm shrink-0">
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
          <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-cocoa-900">Chặng 4: Luyện viết kết hợp & AI Chấm bài cá nhân hóa</h2>
              <p className="text-xs text-cocoa-500 mt-1">Viết câu tiếng Anh kết hợp từ mới + từ cũ + ngữ pháp, Gemini sẽ sửa chuẩn như người bản xứ.</p>
            </div>
            <button
              onClick={handleGenerateMixed}
              disabled={generatingMixed}
              className="clay-btn-sage inline-flex items-center gap-2 px-5 py-3 text-sm shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generatingMixed ? mixedStepLabel || 'Đang soạn đề...' : mixedData ? 'Tạo đề mới' : 'Tạo bài tập kết hợp'}</span>
            </button>
          </div>

          {mixedData && (
            <div className="space-y-4">
              {batchSummary && (
                <div className="rounded-[28px] bg-gradient-to-br from-sage-500 to-sage-600 text-linen-50 p-6 shadow-clay-sage border border-sage-300/40 space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-sage-100">
                    Kết quả chấm toàn bài (AI)
                  </div>
                  <div className="text-3xl font-extrabold">Điểm tổng: {batchSummary.overallScore}/100</div>
                  <p className="text-sm text-sage-50">{batchSummary.overallComment}</p>
                </div>
              )}

              {(mixedData.translationExercises || []).map((ex: any, i: number) => {
                const key = `en-tr-${i}`;
                const ev = evaluations[key];
                return (
                  <div key={key} className="clay-card p-6 space-y-3.5">
                    <div>
                      <span className="text-xs font-extrabold text-sage-700 uppercase tracking-wider">Câu dịch {i + 1}</span>
                      <div className="text-base font-extrabold text-cocoa-900 mt-1">{ex.vietnamese}</div>
                      <div className="text-xs text-cocoa-500 mt-1 font-semibold">Từ mục tiêu: {(ex.targetWords || []).join(', ')} • {ex.grammarHint}</div>
                    </div>
                    <input
                      type="text"
                      value={userInputs[key] || ''}
                      onChange={(e) => setUserInputs((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="Nhập câu tiếng Anh của bạn..."
                      className="w-full clay-input-sage px-4 py-3 text-sm"
                    />
                    {ev && (
                      <div className="clay-inset p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-800 font-extrabold">Điểm: {ev.score}/100</span>
                          <button onClick={() => speakEnglish(ev.correctedEnglish)} className="inline-flex items-center gap-1 text-sage-700 font-bold">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe câu chuẩn</span>
                          </button>
                        </div>
                        <div className="text-sm font-extrabold text-sage-800">Câu chuẩn: {ev.correctedEnglish}</div>
                        <div><strong>Ngữ pháp:</strong> {ev.grammarFeedback}</div>
                        <div><strong>Từ vựng:</strong> {ev.vocabFeedback}</div>
                        <div className="p-2.5 rounded-[14px] bg-sage-100/80 text-sage-800 font-semibold"><strong>Lời khuyên:</strong> {ev.personalizedTip}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {(mixedData.freePrompts || []).map((fp: any, i: number) => {
                const key = `en-fp-${i}`;
                const ev = evaluations[key];
                return (
                  <div key={key} className="clay-card-peach p-6 space-y-3.5">
                    <div>
                      <span className="text-xs font-extrabold text-peach-700 uppercase tracking-wider">Đặt câu tự do {i + 1}</span>
                      <div className="text-base font-extrabold text-cocoa-900 mt-1">{fp.instruction}</div>
                      <div className="text-xs text-cocoa-600 mt-1 font-semibold">Từ bắt buộc: {(fp.targetWords || []).join(', ')} • {fp.grammarTitle}</div>
                    </div>
                    <input
                      type="text"
                      value={userInputs[key] || ''}
                      onChange={(e) => setUserInputs((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="Tự đặt câu tiếng Anh của bạn..."
                      className="w-full clay-input px-4 py-3 text-sm"
                    />
                    {ev && (
                      <div className="bg-linen-50/90 rounded-[20px] p-4 border border-peach-200/70 space-y-2 text-xs">
                        <div className="font-extrabold text-sage-800 text-sm">Điểm: {ev.score}/100 • Câu chuẩn: {ev.correctedEnglish}</div>
                        <div><strong>Ngữ pháp:</strong> {ev.grammarFeedback}</div>
                        <div><strong>Từ vựng:</strong> {ev.vocabFeedback}</div>
                        <div className="p-2.5 rounded-[14px] bg-sage-100/80 text-sage-800 font-semibold"><strong>Lời khuyên:</strong> {ev.personalizedTip}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="sticky bottom-4 bg-linen-50/95 backdrop-blur-md border border-sage-300/50 rounded-[26px] p-4 sm:p-5 shadow-clay flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-cocoa-700 font-bold">
                  Đã viết:{' '}
                  <span className="font-extrabold text-sage-700">
                    {Object.values(userInputs).filter((v) => v?.trim()).length} /{' '}
                    {(mixedData.translationExercises?.length || 0) + (mixedData.freePrompts?.length || 0)}
                  </span>{' '}
                  câu
                </div>
                <button
                  onClick={handleEvaluateAll}
                  disabled={batchGrading}
                  className="clay-btn-sage inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{batchGrading ? batchGradeStepLabel || 'AI đang chấm toàn bộ bài...' : 'AI Chấm tất cả các câu'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="clay-card-honey p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-extrabold text-cocoa-900">
                <Award className="w-5 h-5 text-honey-500" />
                <span>Hoàn thành Ngày {plan.profile.currentDayNumber} ({plan.activeLevel})</span>
              </div>
              <button
                onClick={handleCompleteDay}
                disabled={completingDay}
                className="clay-btn-sage px-5 py-3 text-sm"
              >
                {completingDay ? 'Đang lưu...' : 'Lưu buổi học & Nhận xét AI'}
              </button>
            </div>
            {coachResult && (
              <div className="p-5 rounded-[22px] bg-linen-50/95 border border-sage-300/60 space-y-1.5 text-sm text-cocoa-800 shadow-clay-sm">
                <div className="font-extrabold text-base text-sage-700">{coachResult.headline}</div>
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
