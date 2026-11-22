'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  CheckCircle2,
  Target,
  Compass,
  ArrowRight,
  BookOpen,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';

export interface DailyCoachingFeedback {
  headline?: string;
  strengths?: string;
  areasToImprove?: string;
  tomorrowFocus?: string;
}

export interface DailyStudyLog {
  id: string;
  date: string;
  dayNumber: number;
  level: string;
  minutesSpent: number;
  newWordsLearned: number;
  wordsReviewed: number;
  grammarPracticed?: number;
  score?: number | null;
  aiCoachingFeedback?: DailyCoachingFeedback | string | null;
  createdAt: string;
}

interface DailyFeedbackSectionProps {
  tone: 'peach' | 'sage';
  recentLogs: DailyStudyLog[];
  totalLogs?: number;
  allLogsEndpoint: string;
  studyHref: string;
  loading?: boolean;
}

const TONE_STYLES = {
  peach: {
    iconBox: 'bg-peach-100 text-peach-600 border-peach-200/70',
    countPill: 'bg-peach-100/90 text-peach-700 border-peach-200/70',
    dayBadge: 'bg-gradient-to-b from-peach-400 to-peach-500 text-linen-50 shadow-clay-peach',
    levelPill: 'bg-peach-100/80 text-peach-700 border-peach-200/60',
    expandedCard: 'border-peach-300/60 bg-peach-50/45',
    feedbackBox: 'bg-linen-50/95 border-peach-200/70',
    headlineText: 'text-peach-700',
    tomorrowBox: 'bg-peach-100/70 border-peach-200/70 text-peach-800',
    ctaBtn: 'clay-btn-peach',
  },
  sage: {
    iconBox: 'bg-sage-100 text-sage-600 border-sage-200/70',
    countPill: 'bg-sage-100/90 text-sage-700 border-sage-200/70',
    dayBadge: 'bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 shadow-clay-sage',
    levelPill: 'bg-sage-100/80 text-sage-700 border-sage-200/60',
    expandedCard: 'border-sage-300/60 bg-sage-50/45',
    feedbackBox: 'bg-linen-50/95 border-sage-200/70',
    headlineText: 'text-sage-700',
    tomorrowBox: 'bg-sage-100/75 border-sage-200/70 text-sage-800',
    ctaBtn: 'clay-btn-sage',
  },
} as const;

function formatDateLabel(dateStr: string, createdAt?: string): string {
  const parts = (dateStr || '').split('-');
  const datePart = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  if (!createdAt) return datePart;
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return datePart;
  const timePart = parsed.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart}`;
}

function getScoreBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-sage-100 text-sage-800 border-sage-300/60';
  if (score >= 60) return 'bg-honey-100 text-honey-700 border-honey-200/80';
  return 'bg-berry-100 text-berry-700 border-berry-200/80';
}

function parseFeedback(raw: DailyStudyLog['aiCoachingFeedback']): {
  isString: boolean;
  text?: string;
  headline?: string;
  strengths?: string;
  areasToImprove?: string;
  tomorrowFocus?: string;
} | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? { isString: true, text: trimmed } : null;
  }
  if (typeof raw === 'object') {
    const { headline, strengths, areasToImprove, tomorrowFocus } = raw;
    if (!headline && !strengths && !areasToImprove && !tomorrowFocus) return null;
    return { isString: false, headline, strengths, areasToImprove, tomorrowFocus };
  }
  return null;
}

export default function DailyFeedbackSection({
  tone,
  recentLogs,
  totalLogs,
  allLogsEndpoint,
  studyHref,
  loading = false,
}: DailyFeedbackSectionProps) {
  const styles = TONE_STYLES[tone];
  const [allLogs, setAllLogs] = useState<DailyStudyLog[] | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const userInteractedRef = useRef(false);

  const displayedLogs = allLogs ?? recentLogs;
  const totalCount = Math.max(totalLogs ?? 0, displayedLogs.length);
  const hasMoreLogs = allLogs === null && totalCount > displayedLogs.length;

  useEffect(() => {
    setAllLogs(null);
  }, [recentLogs]);

  useEffect(() => {
    if (!userInteractedRef.current && displayedLogs.length > 0 && expandedIds.size === 0) {
      setExpandedIds(new Set([displayedLogs[0].id]));
    }
  }, [displayedLogs, expandedIds.size]);

  function toggleLog(id: string) {
    userInteractedRef.current = true;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleExpandAll() {
    userInteractedRef.current = true;
    if (expandedIds.size === displayedLogs.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(displayedLogs.map((l) => l.id)));
    }
  }

  async function handleLoadAll() {
    setLoadingAll(true);
    setLoadError(null);
    try {
      const rows = await fetchApi<DailyStudyLog[]>(`${allLogsEndpoint}?limit=100`);
      setAllLogs(rows || []);
    } catch (err: any) {
      setLoadError(err?.message || 'Không thể tải toàn bộ lịch sử nhận xét.');
    } finally {
      setLoadingAll(false);
    }
  }

  const allExpanded = displayedLogs.length > 0 && expandedIds.size === displayedLogs.length;

  return (
    <div className="clay-card p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-[18px] border shadow-clay-sm flex items-center justify-center shrink-0 ${styles.iconBox}`}
          >
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-cocoa-900">
                Kết quả & Nhận xét từng ngày
              </h2>
              {totalCount > 0 && (
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-xs font-extrabold ${styles.countPill}`}
                >
                  {totalCount} buổi học
                </span>
              )}
            </div>
            <p className="text-xs text-cocoa-500 mt-0.5 font-medium">
              Xem lại số từ đã học, điểm luyện viết và nhận xét cá nhân hóa từ AI sau mỗi ngày.
            </p>
          </div>
        </div>

        {displayedLogs.length > 1 && (
          <button
            type="button"
            onClick={toggleExpandAll}
            className="clay-btn-cream px-3.5 py-2 text-xs font-bold self-start sm:self-auto shrink-0"
          >
            {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>
        )}
      </div>

      {loading && displayedLogs.length === 0 ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="clay-shimmer h-20 rounded-[22px]" />
          ))}
        </div>
      ) : displayedLogs.length === 0 ? (
        <div className="clay-inset p-6 text-center space-y-3">
          <p className="text-sm text-cocoa-600 font-semibold max-w-lg mx-auto leading-relaxed">
            Chưa có nhật ký buổi học nào được lưu. Khi hoàn thành phiên học ở Chặng 4, hãy bấm{' '}
            <strong className="text-cocoa-900">Lưu buổi học &amp; Nhận xét AI</strong> để lưu kết quả từng ngày tại đây.
          </p>
          <Link
            href={studyHref}
            className={`${styles.ctaBtn} inline-flex items-center gap-2 px-5 py-2.5 text-xs`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Vào học hôm nay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedLogs.map((log) => {
            const isExpanded = expandedIds.has(log.id);
            const feedback = parseFeedback(log.aiCoachingFeedback);

            return (
              <div
                key={log.id}
                className={`rounded-[24px] border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? `${styles.expandedCard} shadow-clay-sm`
                    : 'bg-linen-100/75 border-cocoa-400/15 hover:bg-linen-100'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleLog(log.id)}
                  className="w-full p-4 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span
                      className={`px-3 py-1.5 rounded-[14px] text-xs font-extrabold shrink-0 ${styles.dayBadge}`}
                    >
                      Ngày {log.dayNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-cocoa-900">
                          {formatDateLabel(log.date, log.createdAt)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[11px] font-extrabold ${styles.levelPill}`}
                        >
                          {log.level}
                        </span>
                      </div>
                      {!isExpanded && feedback && (
                        <p className="text-xs text-cocoa-600 font-medium truncate mt-0.5">
                          {feedback.isString ? feedback.text : feedback.headline || feedback.strengths}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-linen-50/90 border border-cocoa-400/15 text-[11px] font-bold text-cocoa-700 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cocoa-400" />
                      {log.minutesSpent}p
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-linen-50/90 border border-cocoa-400/15 text-[11px] font-bold text-cocoa-700">
                      +{log.newWordsLearned} mới
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-linen-50/90 border border-cocoa-400/15 text-[11px] font-bold text-cocoa-700">
                      Ôn {log.wordsReviewed}
                    </span>
                    {typeof log.score === 'number' && (
                      <span
                        className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${getScoreBadgeClasses(
                          log.score,
                        )}`}
                      >
                        {log.score}/100 điểm
                      </span>
                    )}
                    <span className="p-1.5 rounded-full bg-linen-50/80 text-cocoa-500 border border-cocoa-400/15">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3.5 animate-fade-in">
                    {/* Chỉ số chi tiết buổi học */}
                    <div
                      className={`grid grid-cols-2 ${
                        typeof log.grammarPracticed === 'number' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
                      } gap-2.5`}
                    >
                      <div className="clay-inset px-3.5 py-2.5 flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-cocoa-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-cocoa-500 uppercase">Thời lượng</div>
                          <div className="text-xs font-extrabold text-cocoa-900">
                            {log.minutesSpent} phút
                          </div>
                        </div>
                      </div>
                      <div className="clay-inset px-3.5 py-2.5 flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-sage-600 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-cocoa-500 uppercase">Từ mới</div>
                          <div className="text-xs font-extrabold text-cocoa-900">
                            {log.newWordsLearned} từ
                          </div>
                        </div>
                      </div>
                      <div className="clay-inset px-3.5 py-2.5 flex items-center gap-2.5">
                        <RefreshCw className="w-4 h-4 text-peach-600 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-cocoa-500 uppercase">Ôn tập SRS</div>
                          <div className="text-xs font-extrabold text-cocoa-900">
                            {log.wordsReviewed} từ
                          </div>
                        </div>
                      </div>
                      {typeof log.grammarPracticed === 'number' && (
                        <div className="clay-inset px-3.5 py-2.5 flex items-center gap-2.5">
                          <GraduationCap className="w-4 h-4 text-honey-500 shrink-0" />
                          <div>
                            <div className="text-[10px] font-bold text-cocoa-500 uppercase">Ngữ pháp</div>
                            <div className="text-xs font-extrabold text-cocoa-900">
                              {log.grammarPracticed} điểm
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nhận xét AI Coaching */}
                    {feedback ? (
                      <div
                        className={`p-4 sm:p-5 rounded-[20px] border shadow-clay-sm space-y-2.5 text-xs sm:text-sm text-cocoa-800 ${styles.feedbackBox}`}
                      >
                        {feedback.isString ? (
                          <p className="leading-relaxed">{feedback.text}</p>
                        ) : (
                          <>
                            {feedback.headline && (
                              <div className={`font-extrabold text-sm sm:text-base flex items-center gap-2 ${styles.headlineText}`}>
                                <Sparkles className="w-4 h-4 shrink-0" />
                                <span>{feedback.headline}</span>
                              </div>
                            )}
                            {feedback.strengths && (
                              <div className="flex items-start gap-2 leading-relaxed">
                                <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-cocoa-900">Điểm mạnh:</strong> {feedback.strengths}
                                </div>
                              </div>
                            )}
                            {feedback.areasToImprove && (
                              <div className="flex items-start gap-2 leading-relaxed">
                                <Target className="w-4 h-4 text-honey-500 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-cocoa-900">Cần cải thiện:</strong>{' '}
                                  {feedback.areasToImprove}
                                </div>
                              </div>
                            )}
                            {feedback.tomorrowFocus && (
                              <div
                                className={`p-3 rounded-[14px] border flex items-start gap-2 text-xs font-semibold leading-relaxed ${styles.tomorrowBox}`}
                              >
                                <Compass className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <strong>Chiến lược ngày mai:</strong> {feedback.tomorrowFocus}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="clay-inset p-4 text-xs text-cocoa-500 font-semibold">
                        Buổi học này chưa có nhận xét AI chi tiết.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {loadError && (
        <div className="p-3 rounded-[16px] bg-berry-100/90 border border-berry-200 text-berry-700 text-xs font-bold">
          {loadError}
        </div>
      )}

      {hasMoreLogs && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={handleLoadAll}
            disabled={loadingAll}
            className="clay-btn-cream px-5 py-2.5 text-xs font-extrabold"
          >
            {loadingAll ? 'Đang tải thêm...' : `Xem tất cả ${totalCount} ngày học`}
          </button>
        </div>
      )}
    </div>
  );
}
