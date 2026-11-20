'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { speakChinese } from '@/lib/speech';
import { GraduationCap, Volume2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface GrammarPoint {
  id: string;
  level: string;
  unitNumber: number;
  orderIndex: number;
  title: string;
  pattern: string;
  explanation: string;
  commonMistakes?: string | null;
  status: 'new' | 'learning' | 'mastered';
  practiceCount: number;
  examples: Array<{ chinese: string; pinyin: string; vietnamese: string }>;
}

export default function GrammarPage() {
  const [list, setList] = useState<GrammarPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'HSK1' | 'HSK2' | 'HSK3'>('ALL');
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [evals, setEvals] = useState<Record<string, any>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  async function loadGrammar() {
    setLoading(true);
    try {
      const data = await fetchApi<GrammarPoint[]>('/curriculum/grammar');
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrammar();
  }, []);

  async function handleStatus(id: string, status: 'new' | 'learning' | 'mastered') {
    await fetchApi(`/curriculum/grammar/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setList((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
  }

  async function handlePractice(g: GrammarPoint) {
    const userChinese = inputs[g.id]?.trim();
    if (!userChinese) return;
    setEvaluatingId(g.id);
    try {
      const res = await fetchApi<any>('/curriculum/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          promptVietnamese: `Đặt 1 câu sử dụng ngữ pháp: ${g.title} (${g.pattern})`,
          grammarTitle: g.title,
          level: g.level,
          userChinese,
        }),
      });
      setEvals((p) => ({ ...p, [g.id]: res }));
      if (res.isCorrect && g.status === 'new') {
        await handleStatus(g.id, 'learning');
      }
    } finally {
      setEvaluatingId(null);
    }
  }

  const byLevel = levelFilter === 'ALL' ? list : list.filter((g) => g.level === levelFilter);
  const filtered = filter === 'all' ? byLevel : byLevel.filter((g) => g.status === filter);
  const masteredCount = byLevel.filter((g) => g.status === 'mastered').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="clay-card p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-cocoa-900 flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/70 shadow-clay-sm flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span>Ngữ pháp Tiếng Trung HSK 1 → 3 (3.0)</span>
            </h1>
            <p className="text-sm text-cocoa-600 mt-1.5">
              Tổng hợp {byLevel.length} cấu trúc ngữ pháp • Đã nắm vững:{' '}
              <strong className="text-sage-700">
                {masteredCount}/{byLevel.length}
              </strong>
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'HSK1', 'HSK2', 'HSK3'] as const).map((lv) => (
              <button
                key={lv}
                onClick={() => setLevelFilter(lv)}
                className={`px-3.5 py-2 rounded-[16px] text-xs font-extrabold transition ${
                  levelFilter === lv ? 'clay-btn-peach' : 'clay-btn-cream'
                }`}
              >
                {lv === 'ALL' ? 'Tất cả cấp' : lv}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap pt-3 border-t border-cocoa-400/15">
          {[
            { key: 'all', label: 'Tất cả trạng thái' },
            { key: 'new', label: 'Chưa học' },
            { key: 'learning', label: 'Đang luyện' },
            { key: 'mastered', label: 'Thành thạo' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-[14px] text-xs font-bold transition ${
                filter === f.key ? 'clay-btn-sage' : 'bg-linen-200/80 text-cocoa-600 hover:bg-linen-300/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="clay-card p-10 text-center text-cocoa-500 font-semibold">
          Đang tải danh sách ngữ pháp...
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((g) => {
            const ev = evals[g.id];
            return (
              <div key={g.id} className="clay-card p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-sage-100 text-sage-700 border border-sage-200/70">
                        {g.level}
                      </span>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-peach-100 text-peach-700 border border-peach-200/60">
                        Unit {g.unitNumber} • #{g.orderIndex}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-cocoa-900 mt-2">{g.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatus(g.id, g.status === 'mastered' ? 'learning' : 'mastered')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[16px] text-xs font-bold transition ${
                        g.status === 'mastered'
                          ? 'bg-sage-100 text-sage-700 border border-sage-300/60 shadow-clay-sm'
                          : 'clay-btn-cream'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{g.status === 'mastered' ? 'Đã thành thạo' : 'Đánh dấu thành thạo'}</span>
                    </button>
                  </div>
                </div>

                <div className="clay-formula">{g.pattern}</div>

                <p className="text-sm text-cocoa-700 leading-relaxed">{g.explanation}</p>

                {g.commonMistakes && (
                  <div className="p-3.5 rounded-[20px] bg-honey-100/80 border border-honey-200/80 text-honey-700 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-honey-500" />
                    <span>
                      <strong>Lưu ý lỗi sai:</strong> {g.commonMistakes}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(g.examples || []).map((ex, i) => (
                    <div
                      key={i}
                      className="clay-inset p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-cocoa-900 text-sm font-chinese">{ex.chinese}</div>
                        <div className="text-peach-600 font-semibold">{ex.pinyin}</div>
                        <div className="text-cocoa-600">{ex.vietnamese}</div>
                      </div>
                      <button
                        onClick={() => speakChinese(ex.chinese)}
                        className="p-2 rounded-full bg-linen-50 border border-cocoa-400/20 text-peach-600 hover:bg-peach-50 shadow-clay-sm transition shrink-0"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-cocoa-400/15 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={inputs[g.id] || ''}
                      onChange={(e) => setInputs((p) => ({ ...p, [g.id]: e.target.value }))}
                      placeholder={`Thử đặt 1 câu với "${g.title}"...`}
                      className="flex-1 clay-input px-4 py-2.5 text-sm"
                    />
                    <button
                      onClick={() => handlePractice(g)}
                      disabled={evaluatingId === g.id || !inputs[g.id]?.trim()}
                      className="clay-btn-peach inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{evaluatingId === g.id ? 'Đang chấm...' : 'AI Chấm câu'}</span>
                    </button>
                  </div>

                  {ev && (
                    <div className="p-4 rounded-[22px] bg-peach-50/90 border border-peach-200/70 text-xs space-y-1.5 text-cocoa-800 shadow-clay-sm">
                      <div className="font-extrabold text-peach-700 text-sm">
                        Điểm: {ev.score}/100 • Câu chuẩn: {ev.correctedChinese} ({ev.correctedPinyin})
                      </div>
                      <div>
                        <strong>Ngữ pháp:</strong> {ev.grammarFeedback}
                      </div>
                      <div>
                        <strong>Lời khuyên:</strong> {ev.personalizedTip}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
