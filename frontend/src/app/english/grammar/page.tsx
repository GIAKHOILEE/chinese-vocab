'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { speakEnglish } from '@/lib/speech';
import { GraduationCap, Volume2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface EnglishGrammarPoint {
  id: string;
  cefrLevel: string;
  orderIndex: number;
  title: string;
  pattern: string;
  explanation: string;
  commonMistakes?: string | null;
  status: 'new' | 'learning' | 'mastered';
  examples: Array<{ english: string; vietnamese: string }>;
}

export default function EnglishGrammarPage() {
  const [list, setList] = useState<EnglishGrammarPoint[]>([]);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2'>('ALL');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [evals, setEvals] = useState<Record<string, any>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<EnglishGrammarPoint[]>('/english/grammar').then(setList).catch(console.error);
  }, []);

  async function handleStatus(id: string, status: 'learning' | 'mastered') {
    await fetchApi(`/english/grammar/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setList((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
  }

  async function handlePractice(g: EnglishGrammarPoint) {
    const userEnglish = inputs[g.id]?.trim();
    if (!userEnglish) return;
    setEvaluatingId(g.id);
    try {
      const res = await fetchApi<any>('/english/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          promptVietnamese: `Đặt 1 câu tiếng Anh dùng cấu trúc: ${g.title} (${g.pattern})`,
          grammarTitle: g.title,
          userEnglish,
          cefrLevel: g.cefrLevel,
        }),
      });
      setEvals((p) => ({ ...p, [g.id]: res }));
    } finally {
      setEvaluatingId(null);
    }
  }

  const filtered = levelFilter === 'ALL' ? list : list.filter((g) => g.cefrLevel === levelFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            <span>Ngữ pháp Tiếng Anh (A1 → B2)</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Lộ trình từ cơ bản nhất (A1) đến trung cao cấp (B2) với ví dụ phát âm và AI chấm câu trực tiếp.
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(['ALL', 'A1', 'A2', 'B1', 'B2'] as const).map((lv) => (
            <button
              key={lv}
              onClick={() => setLevelFilter(lv)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                levelFilter === lv ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lv === 'ALL' ? 'Tất cả' : lv}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((g) => {
          const ev = evals[g.id];
          return (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">{g.cefrLevel}</span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{g.title}</h2>
                </div>
                <button
                  onClick={() => handleStatus(g.id, g.status === 'mastered' ? 'learning' : 'mastered')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    g.status === 'mastered' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{g.status === 'mastered' ? 'Đã thành thạo' : 'Đánh dấu thành thạo'}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(g.examples || []).map((ex, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900 text-sm">{ex.english}</div>
                      <div className="text-slate-600">{ex.vietnamese}</div>
                    </div>
                    <button onClick={() => speakEnglish(ex.english)} className="p-1.5 rounded-full bg-white border border-slate-200 text-emerald-600">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputs[g.id] || ''}
                    onChange={(e) => setInputs((p) => ({ ...p, [g.id]: e.target.value }))}
                    placeholder={`Thử đặt 1 câu tiếng Anh với "${g.title}"...`}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handlePractice(g)}
                    disabled={evaluatingId === g.id || !inputs[g.id]?.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{evaluatingId === g.id ? 'Đang chấm...' : 'AI Chấm câu'}</span>
                  </button>
                </div>
                {ev && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs space-y-1 text-slate-800">
                    <div className="font-bold text-emerald-800">Điểm: {ev.score}/100 • Câu chuẩn: {ev.correctedEnglish}</div>
                    <div><strong>Ngữ pháp:</strong> {ev.grammarFeedback}</div>
                    <div><strong>Lời khuyên:</strong> {ev.personalizedTip}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
