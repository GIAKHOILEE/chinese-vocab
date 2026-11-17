'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { speakChinese } from '@/lib/speech';
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
} from 'lucide-react';

interface VocabItem {
  id: string;
  word: string;
  meaning: string;
  pinyin: string;
  partOfSpeech: string;
  level: string;
  progress?: {
    status: string;
    srsLevel: number;
    wrongCount: number;
    lastMistakeNote?: string | null;
  } | null;
}

interface GrammarItem {
  id: string;
  unitNumber: number;
  title: string;
  pattern: string;
  explanation: string;
  commonMistakes?: string | null;
  status: string;
  examples: Array<{ chinese: string; pinyin: string; vietnamese: string }>;
}

interface TodayPlan {
  profile: {
    dailyMinutesTarget: number;
    newWordsPerDay: number;
    reviewWordsPerDay: number;
    grammarPerDay: number;
    preferredModel: string;
    currentDayNumber: number;
  };
  schedule: {
    reviewMinutes: number;
    newWordsMinutes: number;
    grammarMinutes: number;
    mixedPracticeMinutes: number;
  };
  reviewWords: VocabItem[];
  newWords: VocabItem[];
  grammarPoints: GrammarItem[];
}

interface DeepDiveResult {
  deepDive: {
    radicalAnalysis: string;
    memoryHook: string;
    collocations: Array<{ phrase: string; pinyin: string; meaning: string }>;
    distinguish: string;
  };
  examples: Array<{ chinese: string; pinyin: string; vietnamese: string }>;
}

interface MixedExercise {
  translationExercises: Array<{
    vietnamese: string;
    referenceChinese: string;
    referencePinyin: string;
    targetWords: string[];
    grammarHint: string;
  }>;
  freePrompts: Array<{
    instruction: string;
    targetWords: string[];
    grammarTitle: string;
  }>;
}

interface EvaluationResult {
  score: number;
  isCorrect: boolean;
  correctedChinese: string;
  correctedPinyin: string;
  grammarFeedback: string;
  vocabFeedback: string;
  naturalnessFeedback: string;
  personalizedTip: string;
  weakWordsDetected?: string[];
}

const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Nhanh & Ổn định)' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Chấm sâu)' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
];

export default function StudyPage() {
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4>(1);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [syncing, setSyncing] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Phase 1: SRS Review state
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showReviewAnswer, setShowReviewAnswer] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // Phase 2: New Words state
  const [learnedNewIds, setLearnedNewIds] = useState<Set<string>>(new Set());
  const [deepDives, setDeepDives] = useState<Record<string, DeepDiveResult>>({});
  const [loadingDeepDiveId, setLoadingDeepDiveId] = useState<string | null>(null);

  // Phase 3: Grammar state
  const [grammarDoneIds, setGrammarDoneIds] = useState<Set<string>>(new Set());

  // Phase 4: Mixed Practice + AI Evaluation
  const [mixedData, setMixedData] = useState<MixedExercise | null>(null);
  const [generatingMixed, setGeneratingMixed] = useState(false);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationResult>>({});
  const [evaluatingKey, setEvaluatingKey] = useState<string | null>(null);
  const [completingDay, setCompletingDay] = useState(false);
  const [dailyCoachResult, setDailyCoachResult] = useState<any>(null);

  async function loadPlan() {
    setLoading(true);
    try {
      const data = await fetchApi<TodayPlan>('/curriculum/today');
      setPlan(data);
      if (data.profile?.preferredModel) {
        setSelectedModel(data.profile.preferredModel);
      }
    } catch (err: any) {
      setBannerMsg(err.message || 'Không thể tải lộ trình học hôm nay.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, []);

  async function handleSyncHsk2() {
    setSyncing(true);
    setBannerMsg(null);
    try {
      const res = await fetchApi<{ message: string }>('/curriculum/sync-hsk2', { method: 'POST' });
      setBannerMsg(res.message);
      await loadPlan();
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleAiExpand() {
    setExpanding(true);
    setBannerMsg(null);
    try {
      const res = await fetchApi<{ addedCount: number }>('/curriculum/ai-expand-hsk2', {
        method: 'POST',
        body: JSON.stringify({ count: 25, model: selectedModel }),
      });
      setBannerMsg(`AI vừa bổ sung thêm ${res.addedCount} từ HSK 2 (3.0) mới vào kho từ vựng của bạn!`);
      await loadPlan();
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setExpanding(false);
    }
  }

  async function handleChangeTargetMinutes(minutes: number) {
    const newWordsPerDay = minutes <= 60 ? 10 : minutes <= 90 ? 15 : 20;
    const reviewWordsPerDay = minutes <= 60 ? 18 : minutes <= 90 ? 25 : 35;
    const grammarPerDay = minutes >= 120 ? 2 : 1;
    try {
      await fetchApi('/curriculum/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          dailyMinutesTarget: minutes,
          newWordsPerDay,
          reviewWordsPerDay,
          grammarPerDay,
          preferredModel: selectedModel,
        }),
      });
      await loadPlan();
    } catch (err: any) {
      setBannerMsg(err.message);
    }
  }

  async function handleModelChange(model: string) {
    setSelectedModel(model);
    try {
      await fetchApi('/curriculum/profile', {
        method: 'PATCH',
        body: JSON.stringify({ preferredModel: model }),
      });
    } catch {
      // Non-critical
    }
  }

  async function handleSrsSubmit(vocabId: string, quality: 'again' | 'hard' | 'good' | 'easy') {
    try {
      await fetchApi('/curriculum/srs-review', {
        method: 'POST',
        body: JSON.stringify({ vocabularyId: vocabId, quality }),
      });
      setReviewedIds((prev) => new Set(prev).add(vocabId));
      setShowReviewAnswer(false);
      if (plan && reviewIdx < plan.reviewWords.length - 1) {
        setReviewIdx((i) => i + 1);
      }
    } catch (err: any) {
      setBannerMsg(err.message);
    }
  }

  async function handleDeepDive(vocabId: string) {
    setLoadingDeepDiveId(vocabId);
    try {
      const res = await fetchApi<DeepDiveResult>('/curriculum/word-deep-dive', {
        method: 'POST',
        body: JSON.stringify({ vocabularyId: vocabId, model: selectedModel }),
      });
      setDeepDives((prev) => ({ ...prev, [vocabId]: res }));
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setLoadingDeepDiveId(null);
    }
  }

  async function handleMarkNewWordLearned(vocabId: string) {
    try {
      await fetchApi('/curriculum/srs-review', {
        method: 'POST',
        body: JSON.stringify({ vocabularyId: vocabId, quality: 'good' }),
      });
      setLearnedNewIds((prev) => new Set(prev).add(vocabId));
    } catch (err: any) {
      setBannerMsg(err.message);
    }
  }

  async function handleMarkGrammar(grammarId: string, status: 'learning' | 'mastered') {
    try {
      await fetchApi(`/curriculum/grammar/${grammarId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setGrammarDoneIds((prev) => new Set(prev).add(grammarId));
    } catch (err: any) {
      setBannerMsg(err.message);
    }
  }

  async function handleGenerateMixed() {
    if (!plan) return;
    setGeneratingMixed(true);
    setBannerMsg(null);
    try {
      const res = await fetchApi<MixedExercise>('/curriculum/mixed-practice', {
        method: 'POST',
        body: JSON.stringify({
          newWordIds: plan.newWords.map((w) => w.id),
          reviewWordIds: plan.reviewWords.map((w) => w.id),
          grammarIds: plan.grammarPoints.map((g) => g.id),
          model: selectedModel,
        }),
      });
      setMixedData(res);
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setGeneratingMixed(false);
    }
  }

  async function handleEvaluate(
    key: string,
    promptVietnamese: string,
    referenceChinese: string | undefined,
    targetWords: string[],
    grammarTitle: string | undefined,
  ) {
    const userChinese = userInputs[key]?.trim();
    if (!userChinese) return;
    setEvaluatingKey(key);
    try {
      const res = await fetchApi<EvaluationResult>('/curriculum/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          promptVietnamese,
          referenceChinese,
          targetWords,
          grammarTitle,
          userChinese,
          model: selectedModel,
        }),
      });
      setEvaluations((prev) => ({ ...prev, [key]: res }));
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setEvaluatingKey(null);
    }
  }

  async function handleCompleteDay() {
    if (!plan) return;
    setCompletingDay(true);
    const evalValues = Object.values(evaluations);
    const avgScore =
      evalValues.length > 0
        ? Math.round(evalValues.reduce((sum, e) => sum + e.score, 0) / evalValues.length)
        : undefined;
    const weakWords = Array.from(
      new Set(evalValues.flatMap((e) => e.weakWordsDetected || [])),
    );

    try {
      const res = await fetchApi<any>('/curriculum/complete-day', {
        method: 'POST',
        body: JSON.stringify({
          minutesSpent: plan.profile.dailyMinutesTarget,
          newWordsLearned: learnedNewIds.size || plan.newWords.length,
          wordsReviewed: reviewedIds.size || plan.reviewWords.length,
          grammarPracticed: grammarDoneIds.size || plan.grammarPoints.length,
          averageScore: avgScore,
          weakWords,
          model: selectedModel,
        }),
      });
      setDailyCoachResult(res.aiCoachingFeedback);
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setCompletingDay(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        Đang chuẩn bị giáo trình HSK 2 (3.0) cá nhân hóa cho bạn...
      </div>
    );
  }

  if (!plan) return null;

  const currentReviewWord = plan.reviewWords[reviewIdx];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header & Cấu hình cá nhân */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Giáo trình HSK 2 (3.0) • Ngày thứ {plan.profile.currentDayNumber}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Lộ trình học hiểu & ôn tập sâu ({plan.profile.dailyMinutesTarget} phút/ngày)
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Kết hợp từ cũ (HSK 1 & 2) + từ mới HSK 2 (3.0) + ngữ pháp + AI đánh giá cá nhân hóa.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSyncHsk2}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Đang đồng bộ...' : 'Đồng bộ kho HSK 2 (3.0)'}</span>
            </button>
            <button
              onClick={handleAiExpand}
              disabled={expanding}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-medium transition disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{expanding ? 'AI đang tìm từ...' : 'AI Bổ sung +25 từ HSK 2'}</span>
            </button>
          </div>
        </div>

        {/* Thanh cấu hình thời lượng & Gemini Model */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 font-medium">Thời lượng hôm nay:</span>
            {[60, 90, 120].map((m) => (
              <button
                key={m}
                onClick={() => handleChangeTargetMinutes(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  plan.profile.dailyMinutesTarget === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m} phút
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            <span className="text-slate-600 text-xs font-medium">Gemini Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="border border-slate-200 rounded-md px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm">
            {bannerMsg}
          </div>
        )}
      </div>

      {/* 4 Chặng học tập */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            step: 1 as const,
            title: 'Chặng 1: Ôn từ cũ',
            sub: `${reviewedIds.size}/${plan.reviewWords.length} từ • ~${plan.schedule.reviewMinutes}p`,
            icon: RefreshCw,
          },
          {
            step: 2 as const,
            title: 'Chặng 2: Từ mới HSK 2',
            sub: `${learnedNewIds.size}/${plan.newWords.length} từ • ~${plan.schedule.newWordsMinutes}p`,
            icon: BookOpen,
          },
          {
            step: 3 as const,
            title: 'Chặng 3: Ngữ pháp',
            sub: `${grammarDoneIds.size}/${plan.grammarPoints.length} điểm • ~${plan.schedule.grammarMinutes}p`,
            icon: GraduationCap,
          },
          {
            step: 4 as const,
            title: 'Chặng 4: AI Chấm bài',
            sub: `Kết hợp mới+cũ • ~${plan.schedule.mixedPracticeMinutes}p`,
            icon: PenTool,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activePhase === tab.step;
          return (
            <button
              key={tab.step}
              onClick={() => setActivePhase(tab.step)}
              className={`p-3.5 rounded-xl border text-left transition ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </div>
              <div className={`text-xs mt-1 ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                {tab.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* CHẶNG 1: ÔN TỪ CŨ (SRS) */}
      {activePhase === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Chặng 1: Ôn tập từ cũ (HSK 1 & HSK 2) theo lịch lặp lại ngắt quãng (SRS)
            </h2>
            <span className="text-xs font-medium text-slate-500">
              Thẻ {Math.min(reviewIdx + 1, plan.reviewWords.length)} / {plan.reviewWords.length}
            </span>
          </div>

          {plan.reviewWords.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Chưa có từ cũ nào trong kho. Hãy bấm &quot;Đồng bộ kho HSK 2 (3.0)&quot; ở trên!
            </div>
          ) : currentReviewWord ? (
            <div className="max-w-xl mx-auto border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-semibold">
                  {currentReviewWord.level || 'HSK'}
                </span>
                {currentReviewWord.partOfSpeech && (
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs font-medium">
                    {currentReviewWord.partOfSpeech}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nhớ lại & viết ra giấy</p>
                <div className="text-2xl font-bold text-slate-900">{currentReviewWord.meaning}</div>
              </div>

              {currentReviewWord.progress?.lastMistakeNote && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Ghi chú lỗi trước đây: {currentReviewWord.progress.lastMistakeNote}</span>
                </div>
              )}

              {!showReviewAnswer ? (
                <button
                  onClick={() => setShowReviewAnswer(true)}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition"
                >
                  Xem chữ Hán & Pinyin
                </button>
              ) : (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl font-bold text-indigo-700 font-chinese">
                      {currentReviewWord.word}
                    </span>
                    <button
                      onClick={() => speakChinese(currentReviewWord.word)}
                      className="p-2 rounded-full bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-base text-slate-600 font-medium">{currentReviewWord.pinyin}</div>

                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <button
                      onClick={() => handleSrsSubmit(currentReviewWord.id, 'again')}
                      className="py-2 px-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold"
                    >
                      Quên (12h)
                    </button>
                    <button
                      onClick={() => handleSrsSubmit(currentReviewWord.id, 'hard')}
                      className="py-2 px-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold"
                    >
                      Khó (1 ngày)
                    </button>
                    <button
                      onClick={() => handleSrsSubmit(currentReviewWord.id, 'good')}
                      className="py-2 px-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold"
                    >
                      Nhớ (3+ ngày)
                    </button>
                    <button
                      onClick={() => handleSrsSubmit(currentReviewWord.id, 'easy')}
                      className="py-2 px-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-semibold"
                    >
                      Quá dễ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              onClick={() => setActivePhase(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium"
            >
              <span>Sang Chặng 2: Học từ mới HSK 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHẶNG 2: HỌC HIỂU TỪ MỚI HSK 2 (3.0) */}
      {activePhase === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Chặng 2: Học hiểu {plan.newWords.length} từ mới HSK 2 (3.0) hôm nay
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bấm &quot;Phân tích nhớ sâu (AI)&quot; để xem bộ thủ, mẹo nhớ, cụm từ đi kèm và câu ví dụ.
              </p>
            </div>
            <button
              onClick={() => setActivePhase(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium"
            >
              <span>Sang Chặng 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {plan.newWords.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Bạn đã học hết các từ HSK 2 hiện có ở trạng thái mới! Hãy bấm &quot;Đồng bộ kho HSK 2 (3.0)&quot; hoặc &quot;AI Bổ sung +25 từ HSK 2&quot; ở trên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.newWords.map((w) => {
                const learned = learnedNewIds.has(w.id);
                const deep = deepDives[w.id];
                const isLoadingDeep = loadingDeepDiveId === w.id;

                return (
                  <div
                    key={w.id}
                    className={`bg-white rounded-xl border p-5 shadow-sm space-y-3 ${
                      learned ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-slate-900 font-chinese">{w.word}</span>
                          <button
                            onClick={() => speakChinese(w.word)}
                            className="p-1.5 rounded-full bg-slate-100 hover:bg-indigo-100 text-indigo-600"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-indigo-600 font-medium">{w.pinyin}</div>
                        <div className="text-sm text-slate-700 mt-1 font-medium">{w.meaning}</div>
                      </div>
                      {w.partOfSpeech && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                          {w.partOfSpeech}
                        </span>
                      )}
                    </div>

                    {deep && (
                      <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs space-y-2 text-slate-700">
                        <div>
                          <span className="font-semibold text-indigo-800">Bộ thủ / Cấu tạo: </span>
                          {deep.deepDive.radicalAnalysis}
                        </div>
                        <div>
                          <span className="font-semibold text-indigo-800">Mẹo nhớ sâu: </span>
                          {deep.deepDive.memoryHook}
                        </div>
                        {deep.deepDive.collocations?.length > 0 && (
                          <div>
                            <span className="font-semibold text-indigo-800">Cụm từ hay dùng: </span>
                            {deep.deepDive.collocations
                              .map((c) => `${c.phrase} (${c.pinyin}: ${c.meaning})`)
                              .join(' • ')}
                          </div>
                        )}
                        {deep.examples?.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-indigo-100">
                            <span className="font-semibold text-indigo-800">Ví dụ:</span>
                            {deep.examples.map((ex, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-medium text-slate-900">{ex.chinese}</div>
                                  <div className="text-slate-500">{ex.pinyin} — {ex.vietnamese}</div>
                                </div>
                                <button
                                  onClick={() => speakChinese(ex.chinese)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleDeepDive(w.id)}
                        disabled={isLoadingDeep}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isLoadingDeep ? 'AI đang phân tích...' : deep ? 'Đã phân tích' : 'Phân tích nhớ sâu (AI)'}</span>
                      </button>

                      <button
                        onClick={() => handleMarkNewWordLearned(w.id)}
                        disabled={learned}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          learned
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-900 hover:bg-indigo-600 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{learned ? 'Đã học hôm nay' : 'Đã hiểu từ này'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CHẶNG 3: NGỮ PHÁP TRỌNG TÂM */}
      {activePhase === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Chặng 3: Ngữ pháp trọng tâm HSK 2 (3.0) hôm nay
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đọc kỹ công thức, lưu ý lỗi sai thường gặp để áp dụng ngay ở Chặng 4.
              </p>
            </div>
            <button
              onClick={() => setActivePhase(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium"
            >
              <span>Sang Chặng 4: Luyện viết AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {plan.grammarPoints.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Unit {g.unitNumber}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{g.title}</h3>
                </div>
                <button
                  onClick={() => handleMarkGrammar(g.id, 'mastered')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    grammarDoneIds.has(g.id)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {grammarDoneIds.has(g.id) ? 'Đã nắm vững ✓' : 'Đánh dấu đã hiểu'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 text-amber-300 font-mono text-sm">
                {g.pattern}
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{g.explanation}</p>

              {g.commonMistakes && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Lỗi hay gặp: </span>
                    {g.commonMistakes}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase">Ví dụ minh họa</div>
                {(g.examples || []).map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-base">{ex.chinese}</div>
                      <div className="text-xs text-indigo-600">{ex.pinyin}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{ex.vietnamese}</div>
                    </div>
                    <button
                      onClick={() => speakChinese(ex.chinese)}
                      className="p-2 rounded-full bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHẶNG 4: LUYỆN VIẾT KẾT HỢP & AI CHẤM BÀI CÁ NHÂN HÓA */}
      {activePhase === 4 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Chặng 4: Luyện viết kết hợp (Từ mới + Từ cũ + Ngữ pháp) & AI Đánh giá
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Viết ra giấy trước, rồi gõ câu tiếng Trung vào ô bên dưới để Gemini chấm điểm & nhận xét cá nhân hóa.
              </p>
            </div>
            <button
              onClick={handleGenerateMixed}
              disabled={generatingMixed}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generatingMixed ? 'AI đang soạn đề...' : mixedData ? 'Tạo bộ câu mới' : 'Tạo bài tập kết hợp'}</span>
            </button>
          </div>

          {mixedData && (
            <div className="space-y-4">
              {mixedData.translationExercises.map((ex, i) => {
                const key = `tr-${i}`;
                const evalRes = evaluations[key];
                return (
                  <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-indigo-600">Câu dịch {i + 1}</span>
                        <div className="text-base font-bold text-slate-900 mt-0.5">{ex.vietnamese}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Từ mục tiêu: {ex.targetWords.join(', ')} • Gợi ý: {ex.grammarHint}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={userInputs[key] || ''}
                        onChange={(e) => setUserInputs((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="Nhập câu tiếng Trung bạn viết..."
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() =>
                          handleEvaluate(key, ex.vietnamese, ex.referenceChinese, ex.targetWords, ex.grammarHint)
                        }
                        disabled={evaluatingKey === key || !userInputs[key]?.trim()}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold transition disabled:opacity-50"
                      >
                        {evaluatingKey === key ? 'Đang chấm...' : 'AI Đánh giá'}
                      </button>
                    </div>

                    {evalRes && (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold ${
                              evalRes.score >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : evalRes.score >= 60
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            Điểm: {evalRes.score}/100
                          </span>
                          <button
                            onClick={() => speakChinese(evalRes.correctedChinese)}
                            className="inline-flex items-center gap-1 text-indigo-600 font-medium"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe câu chuẩn</span>
                          </button>
                        </div>
                        <div className="text-sm font-bold text-indigo-700">
                          Câu chuẩn: {evalRes.correctedChinese}{' '}
                          <span className="font-normal text-slate-500">({evalRes.correctedPinyin})</span>
                        </div>
                        <div><strong>Ngữ pháp:</strong> {evalRes.grammarFeedback}</div>
                        <div><strong>Từ vựng:</strong> {evalRes.vocabFeedback}</div>
                        <div><strong>Độ tự nhiên:</strong> {evalRes.naturalnessFeedback}</div>
                        <div className="p-2 rounded bg-indigo-50 text-indigo-900">
                          <strong>Mẹo cá nhân hóa:</strong> {evalRes.personalizedTip}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {mixedData.freePrompts.map((fp, i) => {
                const key = `fp-${i}`;
                const evalRes = evaluations[key];
                return (
                  <div key={key} className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-emerald-700">Đặt câu tự do {i + 1}</span>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{fp.instruction}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Từ bắt buộc: {fp.targetWords.join(', ')} • Ngữ pháp: {fp.grammarTitle}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={userInputs[key] || ''}
                        onChange={(e) => setUserInputs((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="Tự đặt câu tiếng Trung của bạn..."
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() =>
                          handleEvaluate(key, fp.instruction, undefined, fp.targetWords, fp.grammarTitle)
                        }
                        disabled={evaluatingKey === key || !userInputs[key]?.trim()}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50"
                      >
                        {evaluatingKey === key ? 'Đang chấm...' : 'AI Chấm câu'}
                      </button>
                    </div>
                    {evalRes && (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="font-bold text-indigo-700">
                          Điểm: {evalRes.score}/100 • Gợi ý chuẩn: {evalRes.correctedChinese} ({evalRes.correctedPinyin})
                        </div>
                        <div><strong>Ngữ pháp:</strong> {evalRes.grammarFeedback}</div>
                        <div><strong>Từ vựng:</strong> {evalRes.vocabFeedback}</div>
                        <div className="p-2 rounded bg-indigo-50 text-indigo-900">
                          <strong>Lời khuyên:</strong> {evalRes.personalizedTip}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tổng kết buổi học */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Hoàn thành buổi học Ngày {plan.profile.currentDayNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lưu tiến độ và để Gemini tổng kết cá nhân hóa cho buổi học ngày mai.
                </p>
              </div>
              <button
                onClick={handleCompleteDay}
                disabled={completingDay}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {completingDay ? 'Đang tổng kết...' : 'Lưu buổi học & Nhận xét AI'}
              </button>
            </div>

            {dailyCoachResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-sm text-emerald-950">
                <div className="font-bold text-base">{dailyCoachResult.headline}</div>
                <div><strong>Điểm mạnh:</strong> {dailyCoachResult.strengths}</div>
                <div><strong>Cần cải thiện:</strong> {dailyCoachResult.areasToImprove}</div>
                <div><strong>Chiến lược ngày mai:</strong> {dailyCoachResult.tomorrowFocus}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
