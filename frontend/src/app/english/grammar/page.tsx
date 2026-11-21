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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<EnglishGrammarPoint[]>('/english/grammar')
      .then(setList)
      .catch((err: any) => setErrorMsg(err?.message || 'Không thể tải danh sách ngữ pháp tiếng Anh.'));
  }, []);

  async function handleStatus(id: string, status: 'learning' | 'mastered') {
    setErrorMsg(null);
    try {
      await fetchApi(`/english/grammar/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setList((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể cập nhật trạng thái ngữ pháp.');
    }
  }

  async function handlePractice(g: EnglishGrammarPoint) {
    const userEnglish = inputs[g.id]?.trim();
    if (!userEnglish) return;
    setEvaluatingId(g.id);
    setErrorMsg(null);
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
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể chấm câu. Vui lòng kiểm tra Gemini API Key phía trên.');
    } finally {
      setEvaluatingId(null);
    }
  }

  const filtered = levelFilter === 'ALL' ? list : list.filter((g) => g.cefrLevel === levelFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cocoa-900 flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-[16px] bg-sage-100 text-sage-600 border border-sage-200/70 shadow-clay-sm flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span>Ngữ pháp Tiếng Anh (A1 → B2)</span>
          </h1>
          <p className="text-sm text-cocoa-600 mt-1.5">
            Lộ trình từ cơ bản nhất (A1) đến trung cao cấp (B2) với ví dụ phát âm và AI chấm câu trực tiếp.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'A1', 'A2', 'B1', 'B2'] as const).map((lv) => (
            <button
              key={lv}
              onClick={() => setLevelFilter(lv)}
              className={`px-3.5 py-2 rounded-[16px] text-xs font-bold transition ${
                levelFilter === lv ? 'clay-btn-sage' : 'clay-btn-cream'
              }`}
            >
              {lv === 'ALL' ? 'Tất cả' : lv}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-[22px] bg-berry-100/90 border border-berry-200 text-berry-700 text-sm font-bold flex items-center justify-between gap-2 shadow-clay-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline text-xs shrink-0">
            Đóng
          </button>
        </div>
      )}

      <div className="space-y-5">
        {filtered.map((g) => {
          const ev = evals[g.id];
          return (
            <div key={g.id} className="clay-card p-6 sm:p-7 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 border border-sage-200/70 text-xs font-extrabold">
                    {g.cefrLevel}
                  </span>
                  <h2 className="text-lg font-extrabold text-cocoa-900 mt-2">{g.title}</h2>
                </div>
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
              <div className="clay-formula">{g.pattern}</div>
              <p className="text-sm text-cocoa-700 leading-relaxed">{g.explanation}</p>
              {g.commonMistakes && (
                <div className="p-3.5 rounded-[20px] bg-honey-100/80 border border-honey-200/80 text-honey-700 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-honey-500" />
                  <span>
                    <strong>Lỗi hay gặp:</strong> {g.commonMistakes}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(g.examples || []).map((ex, i) => (
                  <div key={i} className="clay-inset p-3.5 flex items-center justify-between gap-3">
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-cocoa-900 text-sm">{ex.english}</div>
                      <div className="text-cocoa-600">{ex.vietnamese}</div>
                    </div>
                    <button
                      onClick={() => speakEnglish(ex.english)}
                      className="p-2 rounded-full bg-linen-50 border border-cocoa-400/20 text-sage-600 hover:bg-sage-50 shadow-clay-sm transition shrink-0"
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
                    placeholder={`Thử đặt 1 câu tiếng Anh với "${g.title}"...`}
                    className="flex-1 clay-input-sage px-4 py-2.5 text-sm"
                  />
                  <button
                    onClick={() => handlePractice(g)}
                    disabled={evaluatingId === g.id || !inputs[g.id]?.trim()}
                    className="clay-btn-sage inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{evaluatingId === g.id ? 'Đang chấm...' : 'AI Chấm câu'}</span>
                  </button>
                </div>
                {ev && (
                  <div className="p-4 rounded-[22px] bg-sage-50/95 border border-sage-200/70 text-xs space-y-1.5 text-cocoa-800 shadow-clay-sm">
                    <div className="font-extrabold text-sage-700 text-sm">
                      Điểm: {ev.score}/100 • Câu chuẩn: {ev.correctedEnglish}
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
    </div>
  );
}
