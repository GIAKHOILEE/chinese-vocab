'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { ClipboardCheck, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PlacementData {
  questions: Array<{
    id: string;
    level: string;
    question: string;
    options: string[];
  }>;
  writingPrompts: Array<{
    id: string;
    levelHint: string;
    vietnamese: string;
  }>;
}

export default function EnglishPlacementPage() {
  const [data, setData] = useState<PlacementData | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [writingSamples, setWritingSamples] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchApi<PlacementData>('/english/placement-test').then(setData).catch(console.error);
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetchApi<any>('/english/placement-submit', {
        method: 'POST',
        body: JSON.stringify({ answers, writingSamples }),
      });
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) {
    return <div className="max-w-3xl mx-auto py-12 text-center text-slate-500">Đang tải bài kiểm tra đầu vào...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Kiểm tra đầu vào Tiếng Anh (A1 → B2)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Xác định trình độ hiện tại của bạn</h1>
        <p className="text-sm text-slate-600 mt-1">
          Gồm 12 câu trắc nghiệm phân bậc từ A1 (cơ bản nhất) đến B2 và 2 câu dịch ngắn để Gemini đánh giá đúng điểm xuất phát của bạn.
        </p>
      </div>

      {result ? (
        <div className="bg-white rounded-xl border border-emerald-300 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Trình độ đề xuất cho bạn</div>
              <div className="text-3xl font-extrabold text-emerald-700">{result.recommendedLevel}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {(['A1', 'A2', 'B1', 'B2'] as const).map((lv) => (
              <div key={lv} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-800">{lv}</div>
                <div className="text-emerald-700 font-semibold">
                  {result.byLevel?.[lv]?.correct ?? 0}/{result.byLevel?.[lv]?.total ?? 3}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 leading-relaxed">
            <strong>Nhận xét cá nhân hóa từ AI:</strong> {result.assessment}
          </div>

          <Link
            href="/english"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
          >
            <span>Bắt đầu học lộ trình {result.recommendedLevel} ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Câu {idx + 1} / {data.questions.length}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">{q.level}</span>
              </div>
              <div className="text-base font-semibold text-slate-900">{q.question}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, optIdx) => {
                  const selected = answers[q.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => setAnswers((p) => ({ ...p, [q.id]: optIdx }))}
                      className={`p-2.5 rounded-lg border text-left text-sm transition ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Phần viết ngắn (Không bắt buộc, giúp AI đánh giá chuẩn hơn)</h2>
            {data.writingPrompts.map((wp) => (
              <div key={wp.id} className="space-y-1.5">
                <div className="text-xs font-semibold text-emerald-700">{wp.levelHint}: {wp.vietnamese}</div>
                <input
                  type="text"
                  value={writingSamples[wp.id] || ''}
                  onChange={(e) => setWritingSamples((p) => ({ ...p, [wp.id]: e.target.value }))}
                  placeholder="Dịch sang tiếng Anh (nếu biết)..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? 'AI đang chấm & xếp trình độ...' : 'Hoàn thành & Xem kết quả trình độ'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
