'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import {
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Loader2,
  AlertCircle,
  PenTool,
} from 'lucide-react';

interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech?: string;
  pinyin: string | null;
  level: string | null;
}

export default function NewPracticePage() {
  const router = useRouter();

  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // Options bài tập
  const [questionCountOption, setQuestionCountOption] = useState<number | 'custom'>(10);
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(15);
  const [difficulty, setDifficulty] = useState('HSK1');
  const [mode, setMode] = useState<'STRICT' | 'BASIC' | 'FLEXIBLE'>('STRICT');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Trạng thái Loading / Error
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tải danh sách từ vựng (chọn sẵn 30 từ đầu tiên để tránh quá tải prompt)
  useEffect(() => {
    async function loadVocabularies() {
      try {
        const data = await fetchApi<Vocabulary[]>('/vocabulary');
        setVocabularies(data);
        setSelectedIds(new Set(data.slice(0, 30).map((v) => v.id)));
      } catch (err: any) {
        setErrorMsg('Không thể tải từ vựng từ server.');
      } finally {
        setLoading(false);
      }
    }
    loadVocabularies();
  }, []);

  // Lọc từ vựng theo search & level
  const filteredVocabularies = vocabularies.filter((v) => {
    const matchSearch =
      !search ||
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.meaning.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'ALL' || v.level === levelFilter;
    return matchSearch && matchLevel;
  });

  // Chọn tất cả trong danh sách đang lọc
  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredVocabularies.map((v) => v.id)));
  };

  const handleSelectRandom30 = () => {
    const pool = [...filteredVocabularies];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setSelectedIds(new Set(pool.slice(0, 30).map((v) => v.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Tính toán số câu thực tế
  const actualQuestionCount =
    questionCountOption === 'custom' ? customQuestionCount : questionCountOption;

  // Gửi request sinh bài tập tới NestJS Backend
  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một từ vựng để luyện tập.');
      return;
    }

    setGenerating(true);
    setErrorMsg('');

    try {
      const res = await fetchApi<any>('/practice/generate', {
        method: 'POST',
        body: JSON.stringify({
          vocabularyIds: Array.from(selectedIds),
          questionCount: actualQuestionCount,
          difficulty,
          mode,
          ...(customTitle.trim() ? { title: customTitle.trim() } : {}),
          ...(customDescription.trim() ? { description: customDescription.trim() } : {}),
        }),
      });

      router.push(`/practice/${res.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể tạo bài tập. Vui lòng kiểm tra dịch vụ AI và thử lại.');
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="clay-card p-6 sm:p-7">
        <h1 className="text-2xl font-extrabold text-cocoa-900 flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/70 shadow-clay-sm flex items-center justify-center">
            <PenTool className="w-5 h-5" />
          </span>
          <span>Tạo bài tập mới</span>
        </h1>
        <p className="text-cocoa-500 text-sm mt-1.5">
          Chọn các từ vựng bạn muốn ôn tập và cấu hình các tùy chọn để AI sinh câu luyện viết tay.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-berry-100/90 border border-berry-200 text-berry-700 rounded-[22px] text-sm font-bold flex items-center gap-2.5 shadow-clay-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-berry-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Overlay khi AI đang sinh câu */}
      {generating && (
        <div className="fixed inset-0 bg-cocoa-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="clay-modal p-8 max-w-md w-full text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-peach-100 text-peach-600 rounded-[24px] border border-peach-200/70 shadow-clay-sm flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-cocoa-900">Đang tạo bài luyện tập...</h3>
              <p className="text-sm text-cocoa-500">
                AI đang kết hợp vocabulary của bạn thành các câu tự nhiên. Quá trình này có thể mất vài giây.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái & giữa: Chọn Từ vựng (Vocabulary Selection) */}
        <div className="lg:col-span-7 clay-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cocoa-400/15 pb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-extrabold text-cocoa-900">Chọn Từ Vựng</h2>
              <span className="px-3 py-1 bg-peach-100 text-peach-700 text-xs font-extrabold rounded-full border border-peach-200/70">
                Đã chọn: {selectedIds.size} / {vocabularies.length}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectRandom30}
                className="text-xs text-sage-700 hover:bg-sage-200/60 font-bold px-3 py-1.5 bg-sage-100/90 rounded-[14px] transition"
              >
                Random 30 từ
              </button>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-peach-700 hover:bg-peach-200/60 font-bold px-3 py-1.5 bg-peach-100/90 rounded-[14px] transition"
              >
                Chọn theo bộ lọc ({filteredVocabularies.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-cocoa-600 hover:bg-linen-300/80 font-bold px-3 py-1.5 bg-linen-200/90 rounded-[14px] transition"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          {/* Ô lọc và tìm kiếm */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-cocoa-400" />
              <input
                type="text"
                placeholder="Tìm từ vựng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full clay-input pl-10 pr-3.5 py-2 text-sm"
              />
            </div>
            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full sm:w-auto clay-input px-3.5 py-2 text-sm"
              >
                <option value="ALL">Tất cả Level</option>
                <option value="Beginner">Beginner</option>
                <option value="HSK1">HSK1</option>
                <option value="HSK2">HSK2</option>
                <option value="HSK3">HSK3</option>
              </select>
            </div>
          </div>

          {/* Danh sách các thẻ từ vựng Checkbox */}
          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
            {loading ? (
              <p className="text-center py-10 text-sm text-cocoa-400 font-semibold">
                Đang tải danh sách từ...
              </p>
            ) : filteredVocabularies.length === 0 ? (
              <p className="text-center py-10 text-sm text-cocoa-400 font-semibold">
                Không tìm thấy từ vựng nào.
              </p>
            ) : (
              filteredVocabularies.map((vocab) => {
                const isSelected = selectedIds.has(vocab.id);
                return (
                  <div
                    key={vocab.id}
                    onClick={() => toggleSelect(vocab.id)}
                    className={`flex items-center justify-between p-3.5 rounded-[20px] border transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-peach-50/90 border-peach-300/60 text-cocoa-900 shadow-clay-sm'
                        : 'bg-linen-100/75 border-cocoa-400/15 text-cocoa-700 hover:bg-linen-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-peach-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-cocoa-400/50 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-chinese font-bold text-base mr-2">{vocab.word}</span>
                        {vocab.partOfSpeech && (
                          <span className="text-[11px] px-2 py-0.5 bg-peach-100/80 text-peach-700 rounded-full mr-2 font-bold">
                            {vocab.partOfSpeech}
                          </span>
                        )}
                        <span className="text-xs text-cocoa-500 font-semibold mr-2">({vocab.pinyin})</span>
                        <span className="text-sm font-bold text-cocoa-800">{vocab.meaning}</span>
                      </div>
                    </div>

                    {vocab.level && (
                      <span className="text-xs px-2.5 py-0.5 bg-sage-100/80 text-sage-700 rounded-full font-bold shrink-0">
                        {vocab.level}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cột phải: Options cài đặt AI */}
        <div className="lg:col-span-5 clay-card p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h2 className="font-extrabold text-cocoa-900 border-b border-cocoa-400/15 pb-3.5">
              Cấu hình bài tập
            </h2>

            {/* 1. Số lượng câu */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-cocoa-600 uppercase tracking-wider">
                Số câu hỏi
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCountOption(count)}
                    className={`py-2.5 rounded-[16px] text-sm font-bold transition ${
                      questionCountOption === count ? 'clay-btn-peach' : 'clay-btn-cream'
                    }`}
                  >
                    {count}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setQuestionCountOption('custom')}
                  className={`py-2.5 rounded-[16px] text-sm font-bold transition ${
                    questionCountOption === 'custom' ? 'clay-btn-peach' : 'clay-btn-cream'
                  }`}
                >
                  Custom
                </button>
              </div>

              {questionCountOption === 'custom' && (
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={customQuestionCount}
                  onChange={(e) => setCustomQuestionCount(parseInt(e.target.value) || 1)}
                  className="w-full mt-2 clay-input px-3.5 py-2.5 text-sm"
                  placeholder="Nhập số câu..."
                />
              )}
            </div>

            {/* 2. Difficulty */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-cocoa-600 uppercase tracking-wider">
                Difficulty (Độ khó)
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full clay-input px-3.5 py-2.5 text-sm"
              >
                <option value="Beginner">Beginner</option>
                <option value="HSK1">HSK1</option>
                <option value="HSK2">HSK2</option>
                <option value="HSK3">HSK3</option>
              </select>
            </div>

            {/* 3. Vocabulary Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-cocoa-600 uppercase tracking-wider">
                Vocabulary Mode
              </label>
              <div className="space-y-2.5">
                {[
                  {
                    id: 'STRICT',
                    title: '1. Strict mode (Khuyên dùng)',
                    desc: 'AI chỉ sử dụng từ đã chọn + hư từ cơ bản.',
                  },
                  {
                    id: 'BASIC',
                    title: '2. Basic words allowed',
                    desc: 'Cho phép thêm một số từ vựng cơ bản.',
                  },
                  {
                    id: 'FLEXIBLE',
                    title: '3. Flexible mode',
                    desc: 'Tự do sinh câu linh hoạt hơn.',
                  },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`block p-3.5 rounded-[20px] border cursor-pointer transition ${
                      mode === m.id
                        ? 'bg-peach-50/90 border-peach-300/60 shadow-clay-sm'
                        : 'bg-linen-100/75 border-cocoa-400/15 hover:bg-linen-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === m.id}
                        onChange={() => setMode(m.id as any)}
                        className="accent-peach-500"
                      />
                      <span className="font-extrabold text-xs text-cocoa-900">{m.title}</span>
                    </div>
                    <p className="text-xs text-cocoa-500 ml-6 mt-0.5">{m.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Tùy chọn Tiêu đề & Mô tả ngắn */}
            <div className="space-y-2.5 pt-3 border-t border-cocoa-400/15">
              <label className="block text-xs font-extrabold text-cocoa-600 uppercase tracking-wider">
                Tùy chọn Tên & Mô tả bài
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tiêu đề bài (để trống AI sẽ tự tạo)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full clay-input px-3.5 py-2.5 text-xs"
                />
                <textarea
                  rows={2}
                  placeholder="Mô tả ngắn nội dung bài (tùy chọn)"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full clay-input px-3.5 py-2.5 text-xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Nút Submit Generate */}
          <button
            onClick={handleGenerate}
            disabled={generating || selectedIds.size === 0}
            className="w-full py-4 px-5 clay-btn-peach flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Practice ({actualQuestionCount} câu)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
