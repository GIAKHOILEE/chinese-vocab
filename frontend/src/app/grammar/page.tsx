'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { speakChinese } from '@/lib/speech';
import { GraduationCap, Volume2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface GrammarPoint {
  id: string;
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

  const filtered = filter === 'all' ? list : list.filter((g) => g.status === filter);
  const masteredCount = list.filter((g) => g.status === 'mastered').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <span>Ngữ pháp HSK 2 (3.0)</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tổng hợp {list.length} cấu trúc ngữ pháp cốt lõi HSK 2 (3.0) • Đã nắm vững: {masteredCount}/{list.length}
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'new', label: 'Chưa học' },
            { key: 'learning', label: 'Đang luyện' },
            { key: 'mastered', label: 'Thành thạo' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Đang tải danh sách ngữ pháp...</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => {
            const ev = evals[g.id];
            return (
              <div key={g.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      Unit {g.unitNumber} • #{g.orderIndex}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{g.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatus(g.id, g.status === 'mastered' ? 'learning' : 'mastered')}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        g.status === 'mastered'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{g.status === 'mastered' ? 'Đã thành thạo' : 'Đánh dấu thành thạo'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 text-amber-300 font-mono text-sm">
                  {g.pattern}
                </div>

                <p className="text-sm text-slate-700">{g.explanation}</p>

                {g.commonMistakes && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Lưu ý lỗi sai:</strong> {g.commonMistakes}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(g.examples || []).map((ex, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="text-xs">
                        <div className="font-semibold text-slate-900 text-sm">{ex.chinese}</div>
                        <div className="text-indigo-600">{ex.pinyin}</div>
                        <div className="text-slate-600">{ex.vietnamese}</div>
                      </div>
                      <button
                        onClick={() => speakChinese(ex.chinese)}
                        className="p-1.5 rounded-full bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Thực hành nhanh tại chỗ */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={inputs[g.id] || ''}
                      onChange={(e) => setInputs((p) => ({ ...p, [g.id]: e.target.value }))}
                      placeholder={`Thử đặt 1 câu với "${g.title}"...`}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handlePractice(g)}
                      disabled={evaluatingId === g.id || !inputs[g.id]?.trim()}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{evaluatingId === g.id ? 'Đang chấm...' : 'AI Chấm câu'}</span>
                    </button>
                  </div>

                  {ev && (
                    <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs space-y-1 text-slate-800">
                      <div className="font-bold text-indigo-800">
                        Điểm: {ev.score}/100 • Câu chuẩn: {ev.correctedChinese} ({ev.correctedPinyin})
                      </div>
                      <div><strong>Ngữ pháp:</strong> {ev.grammarFeedback}</div>
                      <div><strong>Lời khuyên:</strong> {ev.personalizedTip}</div>
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
