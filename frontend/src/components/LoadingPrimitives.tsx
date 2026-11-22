'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Server } from 'lucide-react';
import { SlowApiState, subscribeApiSlowState } from '@/lib/api';

export function useAiProgressStep(active: boolean, steps: string[], intervalMs = 2400): string | null {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active || steps.length === 0) {
      setStepIndex(0);
      return;
    }
    setStepIndex(0);
    const timer = setInterval(() => {
      setStepIndex((idx) => (idx < steps.length - 1 ? idx + 1 : idx));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [active, steps.length, intervalMs]);

  if (!active || steps.length === 0) return null;
  return steps[Math.min(stepIndex, steps.length - 1)];
}

export function SlowServerBanner() {
  const [slowState, setSlowState] = useState<SlowApiState>({
    slow: false,
    verySlow: false,
    activeCount: 0,
    startedAt: null,
  });
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    return subscribeApiSlowState(setSlowState);
  }, []);

  useEffect(() => {
    if (!slowState.slow || !slowState.startedAt) {
      setProgress(18);
      return;
    }

    const update = () => {
      const elapsedSec = Math.max(0, (Date.now() - (slowState.startedAt || Date.now())) / 1000);
      // Smooth Zeno curve: advances briskly early on, then asymptotically approaches 92%
      const next = Math.min(92, Math.round(18 + 74 * (1 - Math.exp(-elapsedSec / 12))));
      setProgress(next);
    };
    update();
    const timer = setInterval(update, 350);
    return () => clearInterval(timer);
  }, [slowState.slow, slowState.startedAt]);

  if (!slowState.slow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs sm:max-w-sm w-[calc(100vw-2rem)] pointer-events-none animate-fade-in">
      <div className="clay-card p-4 border-peach-300/60 bg-linen-50/95 backdrop-blur-md space-y-2.5 shadow-clay">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-[12px] bg-peach-100 text-peach-600 flex items-center justify-center shrink-0">
            <Server className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-extrabold text-cocoa-900">
              {slowState.verySlow
                ? 'Server miễn phí đang đánh thức...'
                : 'Đang đồng bộ dữ liệu máy chủ...'}
            </div>
            <p className="text-[11px] text-cocoa-600 mt-0.5 leading-snug">
              {slowState.verySlow
                ? 'Render vừa nghỉ nên cần ~20–40 giây để khởi động lại. Bạn đừng tải lại trang nhé!'
                : 'Kết nối qua dịch vụ miễn phí đang hơi chậm, vui lòng đợi trong giây lát.'}
            </p>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-linen-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-peach-400 to-sage-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function SyncingPill({
  syncing,
  tone = 'peach',
  label = 'Đang đồng bộ...',
}: {
  syncing: boolean;
  tone?: 'peach' | 'sage';
  label?: string;
}) {
  if (!syncing) return null;
  const toneClass =
    tone === 'sage'
      ? 'bg-sage-100/90 text-sage-700 border-sage-300/50'
      : 'bg-peach-100/90 text-peach-700 border-peach-300/50';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold shadow-clay-sm ${toneClass}`}
    >
      <RefreshCw className="w-3 h-3 animate-spin" />
      <span>{label}</span>
    </span>
  );
}

export function StudyPlanSkeleton({ label }: { label: string }) {
  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10 animate-fade-in">
      <div className="clay-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="h-6 w-48 rounded-full clay-shimmer" />
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cocoa-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-peach-500" />
            <span>{label}</span>
          </span>
        </div>
        <div className="h-7 w-2/3 rounded-[14px] clay-shimmer" />
        <div className="h-4 w-1/2 rounded-[12px] clay-shimmer" />
        <div className="pt-3 border-t border-cocoa-400/15 flex gap-2">
          <div className="h-8 w-16 rounded-[14px] clay-shimmer" />
          <div className="h-8 w-16 rounded-[14px] clay-shimmer" />
          <div className="h-8 w-16 rounded-[14px] clay-shimmer" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="clay-card p-4 space-y-2">
            <div className="h-4 w-28 rounded-[10px] clay-shimmer" />
            <div className="h-3 w-20 rounded-[10px] clay-shimmer" />
          </div>
        ))}
      </div>

      <div className="clay-card p-6 sm:p-8 space-y-5">
        <div className="h-6 w-56 rounded-[12px] clay-shimmer mx-auto" />
        <div className="h-32 w-full rounded-[24px] clay-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-10 rounded-[16px] clay-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 4, label }: { count?: number; label?: string }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {label && (
        <div className="flex items-center gap-2 text-xs font-bold text-cocoa-500 px-1">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-peach-500" />
          <span>{label}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="clay-card p-6 space-y-3">
            <div className="h-5 w-24 rounded-full clay-shimmer" />
            <div className="h-6 w-3/4 rounded-[12px] clay-shimmer" />
            <div className="h-16 w-full rounded-[16px] clay-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
