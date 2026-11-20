'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { GEMINI_MODELS, useGeminiConfig } from '@/components/GeminiProvider';
import { speakChinese } from '@/lib/speech';
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
    currentLevel: string;
    dailyMinutesTarget: number;
    newWordsPerDay: number;
    reviewWordsPerDay: number;
    grammarPerDay: number;
    preferredModel: string;
    currentDayNumber: number;
  };
  activeLevel: string;
  schedule: {
    reviewMinutes: number;
    newWordsMinutes: number;
    grammarMinutes: number;
    mixedPracticeMinutes: number;
  };
  currentTopic?: string;
  availableTopics?: Array<{ topic: string; remainingCount: number }>;
  reviewWords: VocabItem[];
  newWords: (VocabItem & { topic?: string })[];
  grammarPoints: GrammarItem[];
}

interface TopicDialogue {
  dialogueTitle: string;
  context: string;
  topicConnectionNote: string;
  dialogue: Array<{
    speaker: string;
    chinese: string;
    pinyin: string;
    vietnamese: string;
    usedNewWords: string[];
  }>;
  keySentences: Array<{
    chinese: string;
    pinyin: string;
    vietnamese: string;
    usedWords: string[];
  }>;
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

const HSK_LEVELS = ['HSK1', 'HSK2', 'HSK3'] as const;
const HSK_LABELS: Record<string, string> = {
  HSK1: 'HSK 1 (Cơ bản • 500 từ)',
  HSK2: 'HSK 2 (Sơ cấp • 772 từ)',
  HSK3: 'HSK 3 (Trung cấp • 973 từ)',
};

export default function StudyPage() {
  const { model: selectedModel, setModel: setSelectedModel } = useGeminiConfig();
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4>(1);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Phase 1: SRS Review state
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showReviewAnswer, setShowReviewAnswer] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewInput, setReviewInput] = useState('');
  const [reviewCheckResult, setReviewCheckResult] = useState<'correct' | 'pinyin' | 'wrong' | null>(null);

  // Phase 2: New Words state
  const [learnedNewIds, setLearnedNewIds] = useState<Set<string>>(new Set());
  const [deepDives, setDeepDives] = useState<Record<string, DeepDiveResult>>({});
  const [loadingDeepDiveId, setLoadingDeepDiveId] = useState<string | null>(null);
  const [topicDialogue, setTopicDialogue] = useState<TopicDialogue | null>(null);
  const [generatingDialogue, setGeneratingDialogue] = useState(false);
  const [showDialogueHelper, setShowDialogueHelper] = useState(true);

  // Phase 3: Grammar state
  const [grammarDoneIds, setGrammarDoneIds] = useState<Set<string>>(new Set());

  // Phase 4: Mixed Practice + AI Evaluation
  const [mixedData, setMixedData] = useState<MixedExercise | null>(null);
  const [generatingMixed, setGeneratingMixed] = useState(false);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationResult>>({});
  const [evaluatingKey, setEvaluatingKey] = useState<string | null>(null);
  const [batchGrading, setBatchGrading] = useState(false);
  const [batchSummary, setBatchSummary] = useState<{ overallScore: number; overallComment: string } | null>(null);
  const [completingDay, setCompletingDay] = useState(false);
  const [dailyCoachResult, setDailyCoachResult] = useState<any>(null);

  async function loadPlan(topic?: string, level?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (topic) params.set('topic', topic);
      if (level) params.set('level', level);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchApi<TodayPlan>(`/curriculum/today${qs}`);
      setPlan(data);
      setTopicDialogue(null);
    } catch (err: any) {
      setBannerMsg(err.message || 'Không thể tải lộ trình học hôm nay.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLevelChange(level: string) {
    try {
      await fetchApi('/curriculum/profile', {
        method: 'PATCH',
        body: JSON.stringify({ currentLevel: level }),
      });
      setReviewIdx(0);
      setLearnedNewIds(new Set());
      setGrammarDoneIds(new Set());
      setMixedData(null);
      await loadPlan(undefined, level);
    } catch (err: any) {
      setBannerMsg(err.message);
    }
  }

  async function handleGenerateTopicDialogue() {
    if (!plan || plan.newWords.length === 0) return;
    setGeneratingDialogue(true);
    setBannerMsg(null);
    try {
      const res = await fetchApi<TopicDialogue>('/curriculum/topic-dialogue', {
        method: 'POST',
        body: JSON.stringify({
          newWordIds: plan.newWords.map((w) => w.id),
          oldWordIds: plan.reviewWords.map((w) => w.id),
          topic: plan.currentTopic,
          level: plan.activeLevel,
          model: selectedModel,
        }),
      });
      setTopicDialogue(res);
    } catch (err: any) {
      setBannerMsg(err.message);
    } finally {
      setGeneratingDialogue(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, []);

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

  function normalizePinyin(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/v/gi, 'u')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();
  }

  function handleCheckReviewAnswer() {
    if (!currentReviewWord) return;
    const raw = reviewInput.trim();
    if (!raw) {
      setReviewCheckResult(null);
      setShowReviewAnswer(true);
      return;
    }

    const normalizedInputWord = raw.replace(/\s+/g, '');
    const normalizedTargetWord = currentReviewWord.word.trim().replace(/\s+/g, '');

    if (normalizedInputWord === normalizedTargetWord) {
      setReviewCheckResult('correct');
    } else {
      const normInputPinyin = normalizePinyin(raw);
      const pinyinVariants = (currentReviewWord.pinyin || '')
        .split(/[,/;|]/)
        .map((p) => normalizePinyin(p))
        .filter(Boolean);
      if (normInputPinyin.length > 0 && pinyinVariants.includes(normInputPinyin)) {
        setReviewCheckResult('pinyin');
      } else {
        setReviewCheckResult('wrong');
      }
    }
    setShowReviewAnswer(true);
  }

  async function handleSrsSubmit(vocabId: string, quality: 'again' | 'hard' | 'good' | 'easy') {
    try {
      await fetchApi('/curriculum/srs-review', {
        method: 'POST',
        body: JSON.stringify({ vocabularyId: vocabId, quality }),
      });
      setReviewedIds((prev) => new Set(prev).add(vocabId));
      setShowReviewAnswer(false);
      setReviewInput('');
      setReviewCheckResult(null);
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
          level: plan.activeLevel,
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
    if (!mixedData) return;
    const items: Array<{
      key: string;
      promptVietnamese: string;
      referenceChinese?: string;
      targetWords?: string[];
      grammarTitle?: string;
      userChinese: string;
    }> = [];

    mixedData.translationExercises.forEach((ex, i) => {
      const key = `tr-${i}`;
      const val = userInputs[key]?.trim();
      if (val) {
        items.push({
          key,
          promptVietnamese: ex.vietnamese,
          referenceChinese: ex.referenceChinese,
          targetWords: ex.targetWords,
          grammarTitle: ex.grammarHint,
          userChinese: val,
        });
      }
    });

    mixedData.freePrompts.forEach((fp, i) => {
      const key = `fp-${i}`;
      const val = userInputs[key]?.trim();
      if (val) {
        items.push({
          key,
          promptVietnamese: fp.instruction,
          targetWords: fp.targetWords,
          grammarTitle: fp.grammarTitle,
          userChinese: val,
        });
      }
    });

    if (items.length === 0) {
      setBannerMsg('Bạn hãy viết ít nhất 1 câu tiếng Trung trước khi bấm chấm bài nhé!');
      return;
    }

    setBatchGrading(true);
    setBannerMsg(null);
    try {
      const res = await fetchApi<{
        overallScore: number;
        overallComment: string;
        results: Array<EvaluationResult & { key: string }>;
      }>('/curriculum/evaluate-batch', {
        method: 'POST',
        body: JSON.stringify({ items, level: plan?.activeLevel, model: selectedModel }),
      });

      const nextMap: Record<string, EvaluationResult> = {};
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
      <div className="max-w-4xl mx-auto py-12">
          <div className="clay-card p-10 text-center text-cocoa-500 font-semibold">
            Đang chuẩn bị giáo trình HSK 1→3 (3.0) cá nhân hóa cho bạn...
          </div>
        </div>
      );
    }

    if (!plan) return null;

    const currentReviewWord = plan.reviewWords[reviewIdx];

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header & Cấu hình cá nhân (Bento Top Card) */}
        <div className="clay-card p-6 sm:p-7 space-y-5 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-peach-200/30 blur-2xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-peach-100/90 border border-peach-200/70 text-peach-700 text-xs font-extrabold shadow-clay-sm mb-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Giáo trình {plan.activeLevel} (HSK 3.0) • Ngày thứ {plan.profile.currentDayNumber}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-cocoa-900 tracking-tight">
                {HSK_LABELS[plan.activeLevel] || plan.activeLevel} — Lộ trình {plan.profile.dailyMinutesTarget} phút/ngày
              </h1>
              <p className="text-sm text-cocoa-600 mt-1">
                Kết hợp ôn từ cũ + học từ mới {plan.activeLevel} theo chủ đề + ngữ pháp + AI đánh giá cá nhân hóa.
              </p>
            </div>
          </div>

          {/* Thanh chọn cấp độ HSK1-HSK3, thời lượng & Gemini Model */}
          <div className="relative pt-4 border-t border-cocoa-400/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-cocoa-600 font-extrabold text-xs mr-1">Cấp độ:</span>
              {HSK_LEVELS.map((lv) => (
                <button
                  key={lv}
                  onClick={() => handleLevelChange(lv)}
                  className={`px-3.5 py-1.5 rounded-[14px] text-xs font-extrabold transition ${
                    plan.activeLevel === lv
                      ? 'clay-btn-peach'
                      : 'bg-linen-200/80 text-cocoa-600 hover:bg-linen-300/80'
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-cocoa-400" />
              <span className="text-cocoa-600 font-bold text-xs">Thời lượng:</span>
              {[60, 90, 120].map((m) => (
                <button
                  key={m}
                  onClick={() => handleChangeTargetMinutes(m)}
                  className={`px-3.5 py-1.5 rounded-[14px] text-xs font-extrabold transition ${
                    plan.profile.dailyMinutesTarget === m
                      ? 'clay-btn-peach'
                      : 'bg-linen-200/80 text-cocoa-600 hover:bg-linen-300/80'
                  }`}
                >
                  {m}p
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-peach-600" />
              <span className="text-cocoa-600 text-xs font-bold">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="clay-input px-3 py-1.5 text-xs font-semibold"
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
          <div className="relative p-3.5 rounded-[20px] bg-peach-100/80 border border-peach-300/50 text-peach-800 text-sm font-bold shadow-clay-sm">
            {bannerMsg}
          </div>
        )}
      </div>

      {/* 4 Chặng học tập (Bento Grid Tabs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            step: 1 as const,
            title: 'Chặng 1: Ôn từ cũ',
            sub: `${reviewedIds.size}/${plan.reviewWords.length} từ • ~${plan.schedule.reviewMinutes}p`,
            icon: RefreshCw,
          },
          {
            step: 2 as const,
            title: `Chặng 2: Từ mới ${plan.activeLevel}`,
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
              className={`p-4 rounded-[24px] border text-left transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-b from-peach-400 to-peach-500 text-linen-50 border-peach-300/50 shadow-clay-peach -translate-y-0.5'
                  : 'clay-card-hover text-cocoa-700'
              }`}
            >
              <div className="flex items-center gap-2 font-extrabold text-sm">
                <Icon className={`w-4 h-4 ${active ? 'text-linen-50' : 'text-peach-500'}`} />
                <span>{tab.title}</span>
              </div>
              <div className={`text-xs mt-1.5 font-semibold ${active ? 'text-peach-50/90' : 'text-cocoa-500'}`}>
                {tab.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* CHẶNG 1: ÔN TỪ CŨ (SRS) */}
      {activePhase === 1 && (
        <div className="clay-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-cocoa-900">
              Chặng 1: Ôn tập từ cũ (HSK 1 & HSK 2) theo lịch lặp lại ngắt quãng (SRS)
            </h2>
            <span className="px-3.5 py-1 rounded-full bg-linen-200/85 text-cocoa-700 text-xs font-extrabold self-start sm:self-auto">
              Thẻ {Math.min(reviewIdx + 1, plan.reviewWords.length)} / {plan.reviewWords.length}
            </span>
          </div>

          {plan.reviewWords.length === 0 ? (
            <div className="clay-inset text-center py-10 px-4 text-cocoa-500 font-semibold">
              Chưa có từ cũ nào đến hạn ôn tập hôm nay. Hãy học từ mới ở Chặng 2 để bắt đầu lịch SRS!
            </div>
          ) : currentReviewWord ? (
            <div className="max-w-xl mx-auto clay-card-oat p-6 sm:p-8 space-y-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 border border-sage-200/70 text-xs font-extrabold">
                  {currentReviewWord.level || 'HSK'}
                </span>
                {currentReviewWord.partOfSpeech && (
                  <span className="px-3 py-1 rounded-full bg-peach-100 text-peach-700 border border-peach-200/70 text-xs font-bold">
                    {currentReviewWord.partOfSpeech}
                  </span>
                )}
              </div>

              <div className="clay-inset py-5 px-4">
                <p className="text-xs text-cocoa-400 font-bold uppercase tracking-wider mb-1.5">
                  Nhớ lại & nhập thử hoặc viết ra giấy
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold text-cocoa-900">
                  {currentReviewWord.meaning}
                </div>
              </div>

              {currentReviewWord.progress?.lastMistakeNote && (
                <div className="p-3.5 rounded-[20px] bg-honey-100/85 border border-honey-200/80 text-honey-700 text-xs text-left flex items-start gap-2.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-honey-500" />
                  <span>Ghi chú lỗi trước đây: {currentReviewWord.progress.lastMistakeNote}</span>
                </div>
              )}

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
                  placeholder="Nhập chữ Hán hoặc Pinyin để kiểm tra..."
                  className="flex-1 clay-input px-4 py-3 text-center text-base font-bold disabled:opacity-70"
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
                      : reviewCheckResult === 'pinyin'
                      ? 'bg-honey-100/90 border-honey-200 text-honey-700'
                      : 'bg-berry-100/90 border-berry-200 text-berry-700'
                  }`}
                >
                  {reviewCheckResult === 'correct' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Chính xác! Bạn đã gõ đúng chữ Hán.</span>
                    </>
                  ) : reviewCheckResult === 'pinyin' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Đúng Pinyin! Kiểm tra lại mặt chữ Hán bên dưới nhé.</span>
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
                  className="clay-btn-peach px-6 py-3 text-sm"
                >
                  Xem chữ Hán & Pinyin
                </button>
              ) : (
                <div className="space-y-4 pt-4 border-t border-cocoa-400/15 animate-fade-in">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl font-bold text-peach-700 font-chinese">
                      {currentReviewWord.word}
                    </span>
                    <button
                      onClick={() => speakChinese(currentReviewWord.word)}
                      className="p-2.5 rounded-full bg-linen-50 border border-cocoa-400/20 hover:bg-peach-50 text-peach-600 shadow-clay-sm transition"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-base text-cocoa-600 font-bold">{currentReviewWord.pinyin}</div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <button
                      onClick={() => handleSrsSubmit(currentReviewWord.id, 'again')}
                      className="py-2.5 px-2 rounded-[16px] bg-berry-100 hover:bg-berry-200/80 text-berry-700 border border-berry-200 text-xs font-extrabold shadow-clay-sm transition"
                    >
                      Quên (12h)
                    </button>
                    <button
                      onClick={() => handleSrsSubmit(currentReviewWord.id, 'hard')}
                      className="py-2.5 px-2 rounded-[16px] bg-honey-100 hover:bg-honey-200/80 text-honey-700 border border-honey-200 text-xs font-extrabold shadow-clay-sm transition"
                    >
                      Khó (1 ngày)
                    </button>
                    <button
                      onClick={() => handleSrsSubmit(currentReviewWord.id, 'good')}
                      className="py-2.5 px-2 rounded-[16px] bg-sage-100 hover:bg-sage-200/80 text-sage-700 border border-sage-300/60 text-xs font-extrabold shadow-clay-sm transition"
                    >
                      Nhớ (3+ ngày)
                    </button>
                    <button
                      onClick={() => handleSrsSubmit(currentReviewWord.id, 'easy')}
                      className="py-2.5 px-2 rounded-[16px] bg-peach-100 hover:bg-peach-200/80 text-peach-700 border border-peach-300/60 text-xs font-extrabold shadow-clay-sm transition"
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
              className="clay-btn-dark inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <span>Sang Chặng 2: Học từ mới {plan.activeLevel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHẶNG 2: HỌC HIỂU TỪ MỚI */}
      {activePhase === 2 && (
        <div className="space-y-5">
          <div className="clay-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-extrabold text-cocoa-900">
                  Chặng 2: Học hiểu {plan.newWords.length} từ mới {plan.activeLevel} (3.0) theo chủ đề
                </h2>
                {plan.currentTopic && (
                  <span className="px-3 py-1 rounded-full bg-peach-100 text-peach-700 border border-peach-200/70 text-xs font-extrabold">
                    {plan.currentTopic}
                  </span>
                )}
              </div>
              <p className="text-xs text-cocoa-500 mt-1.5">
                Các từ mới được gom theo cùng chủ đề để dễ tạo hội thoại & tái sử dụng từ cũ lặp lại nhiều lần cho dễ nhớ.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {plan.availableTopics && plan.availableTopics.length > 0 && (
                <select
                  value={plan.currentTopic || ''}
                  onChange={(e) => loadPlan(e.target.value, plan.activeLevel)}
                  className="clay-input px-3.5 py-2.5 text-xs font-bold"
                >
                  {plan.availableTopics.map((t) => (
                    <option key={t.topic} value={t.topic}>
                      {t.topic} ({t.remainingCount} từ)
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setActivePhase(3)}
                className="clay-btn-dark inline-flex items-center gap-1.5 px-5 py-2.5 text-sm"
              >
                <span>Sang Chặng 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hội thoại & Mẫu câu gắn kết từ mới + từ cũ */}
          {plan.newWords.length > 0 && (
            <div className="clay-card-peach p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-cocoa-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-peach-600" />
                    <span>Hội thoại & Mẫu câu theo chủ đề (Từ mới + Từ cũ)</span>
                  </h3>
                  <p className="text-xs text-cocoa-600 mt-0.5">
                    Đọc & nghe đoạn hội thoại lồng ghép {plan.newWords.length} từ mới hôm nay cùng các từ cũ đã học để nhớ sâu tự nhiên.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {topicDialogue && (
                    <button
                      onClick={() => setShowDialogueHelper((v) => !v)}
                      className="clay-btn-cream px-3.5 py-2 text-xs"
                    >
                      {showDialogueHelper ? 'Ẩn Pinyin & Nghĩa' : 'Hiện Pinyin & Nghĩa'}
                    </button>
                  )}
                  <button
                    onClick={handleGenerateTopicDialogue}
                    disabled={generatingDialogue}
                    className="clay-btn-peach inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {generatingDialogue
                        ? 'AI đang tạo hội thoại...'
                        : topicDialogue
                          ? 'Tạo hội thoại khác'
                          : 'Tạo hội thoại & mẫu câu (AI)'}
                    </span>
                  </button>
                </div>
              </div>

              {topicDialogue && (
                <div className="space-y-4 pt-3 border-t border-peach-300/40 animate-fade-in">
                  <div className="bg-linen-50/90 rounded-[22px] p-4 border border-peach-200/60 shadow-clay-sm space-y-1.5">
                    <div className="font-extrabold text-cocoa-900 text-base">{topicDialogue.dialogueTitle}</div>
                    <p className="text-xs text-cocoa-600">{topicDialogue.context}</p>
                    {topicDialogue.topicConnectionNote && (
                      <p className="text-xs text-peach-800 bg-peach-100/75 px-3 py-2 rounded-[14px] mt-1.5">
                        <strong>Mẹo liên kết cụm từ:</strong> {topicDialogue.topicConnectionNote}
                      </p>
                    )}
                  </div>

                  {/* Đoạn hội thoại */}
                  <div className="space-y-2.5">
                    {topicDialogue.dialogue.map((line, idx) => (
                      <div
                        key={idx}
                        className="bg-linen-50/95 rounded-[22px] p-4 border border-cocoa-400/15 shadow-clay-sm flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-peach-500 text-linen-50 text-xs font-extrabold">
                              {line.speaker}
                            </span>
                            <span className="text-base font-bold text-cocoa-900 font-chinese">
                              {line.chinese}
                            </span>
                            {line.usedNewWords?.length > 0 && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 border border-sage-200/70 font-bold">
                                Từ mới: {line.usedNewWords.join(', ')}
                              </span>
                            )}
                          </div>
                          {showDialogueHelper && (
                            <>
                              <div className="text-xs text-peach-600 font-bold">{line.pinyin}</div>
                              <div className="text-xs text-cocoa-600">{line.vietnamese}</div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => speakChinese(line.chinese)}
                          className="p-2 rounded-full bg-linen-100 border border-cocoa-400/15 hover:bg-peach-100 text-peach-600 shadow-clay-sm shrink-0 transition"
                          title="Nghe câu thoại"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Mẫu câu ngắn dễ nhớ */}
                  {topicDialogue.keySentences?.length > 0 && (
                    <div className="bg-linen-50/90 rounded-[22px] p-4 border border-cocoa-400/15 shadow-clay-sm space-y-3">
                      <div className="text-xs font-extrabold text-cocoa-700 uppercase tracking-wider">
                        Mẫu câu giao tiếp ngắn (Lặp lại từ mới + từ cũ)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {topicDialogue.keySentences.map((s, idx) => (
                          <div
                            key={idx}
                            className="clay-inset p-3.5 flex items-start justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-cocoa-900 text-sm font-chinese">{s.chinese}</div>
                              {showDialogueHelper && (
                                <>
                                  <div className="text-xs text-peach-600 font-semibold">{s.pinyin}</div>
                                  <div className="text-xs text-cocoa-600">{s.vietnamese}</div>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => speakChinese(s.chinese)}
                              className="p-1.5 rounded-full bg-linen-50 border border-cocoa-400/15 text-peach-600 hover:bg-peach-50 shrink-0 shadow-clay-sm"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {plan.newWords.length === 0 ? (
            <div className="clay-card p-10 text-center text-cocoa-500 font-semibold">
              Bạn đã hoàn thành tất cả từ mới {plan.activeLevel}! Hãy chuyển sang cấp độ tiếp theo ở thanh chọn cấp độ bên trên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {plan.newWords.map((w) => {
                const learned = learnedNewIds.has(w.id);
                const deep = deepDives[w.id];
                const isLoadingDeep = loadingDeepDiveId === w.id;

                return (
                  <div
                    key={w.id}
                    className={`p-6 space-y-3.5 ${
                      learned ? 'clay-card-sage' : 'clay-card-hover'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl font-bold text-cocoa-900 font-chinese">{w.word}</span>
                          <button
                            onClick={() => speakChinese(w.word)}
                            className="p-2 rounded-full bg-peach-100/90 hover:bg-peach-200/80 text-peach-600 shadow-clay-sm transition"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-peach-600 font-bold mt-0.5">{w.pinyin}</div>
                        <div className="text-sm text-cocoa-700 mt-1 font-bold">{w.meaning}</div>
                      </div>
                      {w.partOfSpeech && (
                        <span className="px-3 py-1 rounded-full bg-linen-200/90 text-cocoa-600 text-xs font-bold">
                          {w.partOfSpeech}
                        </span>
                      )}
                    </div>

                    {deep && (
                      <div className="p-4 rounded-[20px] bg-peach-50/90 border border-peach-200/70 text-xs space-y-2 text-cocoa-700 shadow-clay-sm">
                        <div>
                          <span className="font-extrabold text-peach-700">Bộ thủ / Cấu tạo: </span>
                          {deep.deepDive.radicalAnalysis}
                        </div>
                        <div>
                          <span className="font-extrabold text-peach-700">Mẹo nhớ sâu: </span>
                          {deep.deepDive.memoryHook}
                        </div>
                        {deep.deepDive.collocations?.length > 0 && (
                          <div>
                            <span className="font-extrabold text-peach-700">Cụm từ hay dùng: </span>
                            {deep.deepDive.collocations
                              .map((c) => `${c.phrase} (${c.pinyin}: ${c.meaning})`)
                              .join(' • ')}
                          </div>
                        )}
                        {deep.examples?.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-peach-200/60">
                            <span className="font-extrabold text-peach-700">Ví dụ:</span>
                            {deep.examples.map((ex, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-cocoa-900 font-chinese">{ex.chinese}</div>
                                  <div className="text-cocoa-500">
                                    {ex.pinyin} — {ex.vietnamese}
                                  </div>
                                </div>
                                <button
                                  onClick={() => speakChinese(ex.chinese)}
                                  className="p-1.5 text-peach-600 hover:bg-peach-100 rounded-full"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-cocoa-400/15">
                      <button
                        onClick={() => handleDeepDive(w.id)}
                        disabled={isLoadingDeep}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-peach-600 hover:text-peach-800 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isLoadingDeep ? 'AI đang phân tích...' : deep ? 'Đã phân tích' : 'Phân tích nhớ sâu (AI)'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleMarkNewWordLearned(w.id)}
                        disabled={learned}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[16px] text-xs font-extrabold transition ${
                          learned
                            ? 'bg-sage-100 text-sage-700 border border-sage-300/60'
                            : 'clay-btn-dark'
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
        <div className="space-y-5">
          <div className="clay-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-cocoa-900">
                Chặng 3: Ngữ pháp trọng tâm {plan.activeLevel} (3.0) hôm nay
              </h2>
              <p className="text-xs text-cocoa-500 mt-1">
                Đọc kỹ công thức, lưu ý lỗi sai thường gặp để áp dụng ngay ở Chặng 4.
              </p>
            </div>
            <button
              onClick={() => setActivePhase(4)}
              className="clay-btn-dark inline-flex items-center gap-1.5 px-5 py-2.5 text-sm self-start sm:self-auto"
            >
              <span>Sang Chặng 4: Luyện viết AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {plan.grammarPoints.map((g) => (
            <div key={g.id} className="clay-card p-6 sm:p-7 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-peach-100 text-peach-700 border border-peach-200/70">
                    Unit {g.unitNumber}
                  </span>
                  <h3 className="text-lg font-extrabold text-cocoa-900 mt-2">{g.title}</h3>
                </div>
                <button
                  onClick={() => handleMarkGrammar(g.id, 'mastered')}
                  className={`px-4 py-2 rounded-[16px] text-xs font-extrabold transition ${
                    grammarDoneIds.has(g.id)
                      ? 'bg-sage-100 text-sage-700 border border-sage-300/60 shadow-clay-sm'
                      : 'clay-btn-peach'
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
                  <div>
                    <span className="font-extrabold">Lỗi hay gặp: </span>
                    {g.commonMistakes}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="text-xs font-extrabold text-cocoa-500 uppercase tracking-wider">
                  Ví dụ minh họa
                </div>
                {(g.examples || []).map((ex, idx) => (
                  <div
                    key={idx}
                    className="clay-inset p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-cocoa-900 text-base font-chinese">{ex.chinese}</div>
                      <div className="text-xs text-peach-600 font-bold">{ex.pinyin}</div>
                      <div className="text-xs text-cocoa-600 mt-0.5">{ex.vietnamese}</div>
                    </div>
                    <button
                      onClick={() => speakChinese(ex.chinese)}
                      className="p-2 rounded-full bg-linen-50 border border-cocoa-400/20 hover:bg-peach-50 text-peach-600 shadow-clay-sm shrink-0"
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
          <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-cocoa-900">
                Chặng 4: Luyện viết kết hợp (Từ mới + Từ cũ + Ngữ pháp) & AI Đánh giá
              </h2>
              <p className="text-xs text-cocoa-500 mt-1">
                Viết ra giấy trước, rồi gõ câu tiếng Trung vào ô bên dưới để Gemini chấm điểm & nhận xét cá nhân hóa.
              </p>
            </div>
            <button
              onClick={handleGenerateMixed}
              disabled={generatingMixed}
              className="clay-btn-peach inline-flex items-center gap-2 px-5 py-3 text-sm shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {generatingMixed ? 'AI đang soạn đề...' : mixedData ? 'Tạo bộ câu mới' : 'Tạo bài tập kết hợp'}
              </span>
            </button>
          </div>

          {mixedData && (
            <div className="space-y-4">
              {batchSummary && (
                <div className="rounded-[28px] bg-gradient-to-br from-peach-500 to-peach-600 text-linen-50 p-6 shadow-clay-peach border border-peach-300/40 space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-peach-100">
                    Kết quả chấm toàn bài (AI)
                  </div>
                  <div className="text-3xl font-extrabold">Điểm tổng: {batchSummary.overallScore}/100</div>
                  <p className="text-sm text-peach-50">{batchSummary.overallComment}</p>
                </div>
              )}

              {mixedData.translationExercises.map((ex, i) => {
                const key = `tr-${i}`;
                const evalRes = evaluations[key];
                return (
                  <div key={key} className="clay-card p-6 space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-peach-600 uppercase tracking-wider">
                          Câu dịch {i + 1}
                        </span>
                        <div className="text-base font-extrabold text-cocoa-900 mt-1">{ex.vietnamese}</div>
                        <div className="text-xs text-cocoa-500 mt-1 font-semibold">
                          Từ mục tiêu: {ex.targetWords.join(', ')} • Gợi ý: {ex.grammarHint}
                        </div>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={userInputs[key] || ''}
                      onChange={(e) => setUserInputs((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="Nhập câu tiếng Trung bạn viết..."
                      className="w-full clay-input px-4 py-3 text-sm font-chinese"
                    />

                    {evalRes && (
                      <div className="clay-inset p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-3 py-1 rounded-full font-extrabold ${
                              evalRes.score >= 80
                                ? 'bg-sage-100 text-sage-800'
                                : evalRes.score >= 60
                                  ? 'bg-honey-100 text-honey-700'
                                  : 'bg-berry-100 text-berry-700'
                            }`}
                          >
                            Điểm: {evalRes.score}/100
                          </span>
                          <button
                            onClick={() => speakChinese(evalRes.correctedChinese)}
                            className="inline-flex items-center gap-1 text-peach-600 font-bold hover:text-peach-800"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe câu chuẩn</span>
                          </button>
                        </div>
                        <div className="text-sm font-extrabold text-peach-700 font-chinese">
                          Câu chuẩn: {evalRes.correctedChinese}{' '}
                          <span className="font-sans font-semibold text-cocoa-500">
                            ({evalRes.correctedPinyin})
                          </span>
                        </div>
                        <div>
                          <strong>Ngữ pháp:</strong> {evalRes.grammarFeedback}
                        </div>
                        <div>
                          <strong>Từ vựng:</strong> {evalRes.vocabFeedback}
                        </div>
                        <div className="p-2.5 rounded-[14px] bg-peach-100/75 text-peach-800 font-semibold">
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
                  <div key={key} className="clay-card-sage p-6 space-y-3.5">
                    <div>
                      <span className="text-xs font-extrabold text-sage-700 uppercase tracking-wider">
                        Đặt câu tự do {i + 1}
                      </span>
                      <div className="text-base font-extrabold text-cocoa-900 mt-1">{fp.instruction}</div>
                      <div className="text-xs text-cocoa-600 mt-1 font-semibold">
                        Từ bắt buộc: {fp.targetWords.join(', ')} • Ngữ pháp: {fp.grammarTitle}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={userInputs[key] || ''}
                      onChange={(e) => setUserInputs((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="Tự đặt câu tiếng Trung của bạn..."
                      className="w-full clay-input-sage px-4 py-3 text-sm font-chinese"
                    />
                    {evalRes && (
                      <div className="bg-linen-50/90 rounded-[20px] p-4 border border-sage-200/70 space-y-2 text-xs">
                        <div className="font-extrabold text-sage-700 text-sm">
                          Điểm: {evalRes.score}/100 • Gợi ý chuẩn: {evalRes.correctedChinese} ({evalRes.correctedPinyin})
                        </div>
                        <div>
                          <strong>Ngữ pháp:</strong> {evalRes.grammarFeedback}
                        </div>
                        <div>
                          <strong>Từ vựng:</strong> {evalRes.vocabFeedback}
                        </div>
                        <div className="p-2.5 rounded-[14px] bg-sage-100/80 text-sage-800 font-semibold">
                          <strong>Lời khuyên:</strong> {evalRes.personalizedTip}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="sticky bottom-4 bg-linen-50/95 backdrop-blur-md border border-peach-300/50 rounded-[26px] p-4 sm:p-5 shadow-clay flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-cocoa-700 font-bold">
                  Đã viết:{' '}
                  <span className="font-extrabold text-peach-700">
                    {Object.values(userInputs).filter((v) => v?.trim()).length} /{' '}
                    {mixedData.translationExercises.length + mixedData.freePrompts.length}
                  </span>{' '}
                  câu
                </div>
                <button
                  onClick={handleEvaluateAll}
                  disabled={batchGrading}
                  className="clay-btn-peach inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{batchGrading ? 'AI đang chấm toàn bộ bài...' : 'AI Chấm tất cả các câu'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tổng kết buổi học */}
          <div className="clay-card-honey p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-cocoa-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-honey-500" />
                  <span>Hoàn thành buổi học Ngày {plan.profile.currentDayNumber}</span>
                </h3>
                <p className="text-xs text-cocoa-600 mt-1">
                  Lưu tiến độ và để Gemini tổng kết cá nhân hóa cho buổi học ngày mai.
                </p>
              </div>
              <button
                onClick={handleCompleteDay}
                disabled={completingDay}
                className="clay-btn-sage px-5 py-3 text-sm"
              >
                {completingDay ? 'Đang tổng kết...' : 'Lưu buổi học & Nhận xét AI'}
              </button>
            </div>

            {dailyCoachResult && (
              <div className="p-5 rounded-[22px] bg-linen-50/95 border border-sage-300/60 space-y-2 text-sm text-cocoa-800 shadow-clay-sm">
                <div className="font-extrabold text-base text-sage-700">{dailyCoachResult.headline}</div>
                <div>
                  <strong>Điểm mạnh:</strong> {dailyCoachResult.strengths}
                </div>
                <div>
                  <strong>Cần cải thiện:</strong> {dailyCoachResult.areasToImprove}
                </div>
                <div>
                  <strong>Chiến lược ngày mai:</strong> {dailyCoachResult.tomorrowFocus}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
