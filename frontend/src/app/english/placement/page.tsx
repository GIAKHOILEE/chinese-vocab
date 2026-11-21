'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { ClipboardCheck, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<PlacementData>('/english/placement-test')
      .then(setData)
      .catch((err: any) => setErrorMsg(err?.message || 'Không thể tải bài kiểm tra đầu vào.'));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetchApi<any>('/english/placement-submit', {
        method: 'POST',
        body: JSON.stringify({ answers, writingSamples }),
      });
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể nộp bài kiểm tra đầu vào. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="clay-card p-10 text-center text-cocoa-500 font-semibold">
          Đang tải bài kiểm tra đầu vào...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="clay-card p-6 sm:p-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-100/90 border border-sage-200/70 text-sage-700 text-xs font-extrabold shadow-clay-sm">
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Kiểm tra đầu vào Tiếng Anh (A1 → B2)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-cocoa-900 pt-1">
          Xác định trình độ hiện tại của bạn
        </h1>
        <p className="text-sm text-cocoa-600 leading-relaxed">
          Gồm 12 câu trắc nghiệm phân bậc từ A1 (cơ bản nhất) đến B2 và 2 câu dịch ngắn để Gemini đánh giá đúng điểm xuất phát của bạn.
        </p>
      </div>

      {result ? (
        <div className="clay-card-sage p-7 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[22px] bg-linen-50 border border-sage-300/60 shadow-clay-sm text-sage-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs text-sage-700 font-extrabold uppercase tracking-wider">
                Trình độ đề xuất cho bạn
              </div>
              <div className="text-4xl font-extrabold text-cocoa-900 mt-0.5">{result.recommendedLevel}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            {(['A1', 'A2', 'B1', 'B2'] as const).map((lv) => (
              <div key={lv} className="bg-linen-50/90 rounded-[20px] p-3.5 border border-sage-200/70 shadow-clay-sm">
                <div className="font-extrabold text-cocoa-800 text-sm">{lv}</div>
                <div className="text-sage-700 font-extrabold text-base mt-1">
                  {result.byLevel?.[lv]?.correct ?? 0}/{result.byLevel?.[lv]?.total ?? 3}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-[22px] bg-linen-50/90 border border-sage-200/70 text-sm text-cocoa-800 leading-relaxed shadow-clay-sm">
            <strong className="text-sage-700">Nhận xét cá nhân hóa từ AI:</strong> {result.assessment}
          </div>

          <Link
            href="/english"
            className="clay-btn-sage inline-flex items-center gap-2 px-6 py-3.5 text-sm"
          >
            <span>Bắt đầu học lộ trình {result.recommendedLevel} ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.questions.map((q, idx) => (
            <div key={q.id} className="clay-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-cocoa-500">
                  Câu {idx + 1} / {data.questions.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 border border-sage-200/70 text-xs font-extrabold">
                  {q.level}
                </span>
              </div>
              <div className="text-base font-extrabold text-cocoa-900">{q.question}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const selected = answers[q.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => setAnswers((p) => ({ ...p, [q.id]: optIdx }))}
                      className={`p-3.5 rounded-[18px] border text-left text-sm transition-all duration-200 ${
                        selected
                          ? 'bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 border-sage-300/50 font-extrabold shadow-clay-sage'
                          : 'bg-linen-100/90 hover:bg-sage-50/70 text-cocoa-700 border-cocoa-400/20 font-semibold shadow-clay-sm'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="clay-card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-cocoa-900">
              Phần viết ngắn (Không bắt buộc, giúp AI đánh giá chuẩn hơn)
            </h2>
            {data.writingPrompts.map((wp) => (
              <div key={wp.id} className="space-y-1.5">
                <div className="text-xs font-bold text-sage-700">
                  {wp.levelHint}: {wp.vietnamese}
                </div>
                <input
                  type="text"
                  value={writingSamples[wp.id] || ''}
                  onChange={(e) => setWritingSamples((p) => ({ ...p, [wp.id]: e.target.value }))}
                  placeholder="Dịch sang tiếng Anh (nếu biết)..."
                  className="w-full clay-input-sage px-4 py-2.5 text-sm"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 clay-btn-sage text-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? 'AI đang chấm & xếp trình độ...' : 'Hoàn thành & Xem kết quả trình độ'}</span>
          </button>

          {errorMsg && (
            <div className="p-4 rounded-[20px] bg-berry-100/90 border border-berry-200 text-berry-700 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
