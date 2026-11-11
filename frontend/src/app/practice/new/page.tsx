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
  Filter,
} from 'lucide-react';

interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
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

  // Tải danh sách từ vựng
  useEffect(() => {
    async function loadVocabularies() {
      try {
        const data = await fetchApi<Vocabulary[]>('/vocabulary');
        setVocabularies(data);
        // Chọn tất cả theo mặc định để tiện lợi
        setSelectedIds(new Set(data.map((v) => v.id)));
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

  // Chọn / Bỏ chọn tất cả
  const handleSelectAll = () => {
    setSelectedIds(new Set(vocabularies.map((v) => v.id)));
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

      // Chuyển hướng tới trang luyện tập /practice/[id]
      router.push(`/practice/${res.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể tạo bài tập. Vui lòng kiểm tra dịch vụ AI và thử lại.');
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Tạo bài tập mới</h1>
        <p className="text-slate-500 text-sm mt-1">
          Chọn các từ vựng bạn muốn ôn tập và cấu hình các tùy chọn để AI sinh câu.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Overlay khi AI đang sinh câu */}
      {generating && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-4 animate-fade-in border border-slate-100">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">Đang tạo bài luyện tập...</h3>
              <p className="text-sm text-slate-500">
                AI đang kết hợp vocabulary của bạn thành các câu tự nhiên. Quá trình này có thể mất vài giây.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái & giữa: Chọn Từ vựng (Vocabulary Selection) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800">Chọn Từ Vựng</h2>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                Đã chọn: {selectedIds.size} / {vocabularies.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 bg-indigo-50 rounded"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 bg-slate-100 rounded"
              >
                Deselect all
              </button>
            </div>
          </div>

          {/* Ô lọc và tìm kiếm */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm từ vựng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="max-h-96 overflow-y-auto pr-1 space-y-1.5">
            {loading ? (
              <p className="text-center py-8 text-sm text-slate-400">Đang tải danh sách từ...</p>
            ) : filteredVocabularies.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">Không tìm thấy từ vựng nào.</p>
            ) : (
              filteredVocabularies.map((vocab) => {
                const isSelected = selectedIds.has(vocab.id);
                return (
                  <div
                    key={vocab.id}
                    onClick={() => toggleSelect(vocab.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-chinese font-bold text-base mr-2">{vocab.word}</span>
                        <span className="text-xs text-slate-500 font-sans mr-2">({vocab.pinyin})</span>
                        <span className="text-sm font-medium text-slate-800">{vocab.meaning}</span>
                      </div>
                    </div>

                    {vocab.level && (
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="font-semibold text-slate-800 border-b pb-3">Cấu hình bài tập</h2>

            {/* 1. Số lượng câu */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Số câu hỏi
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCountOption(count)}
                    className={`py-2 rounded-lg text-sm font-medium border transition ${
                      questionCountOption === count
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {count}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setQuestionCountOption('custom')}
                  className={`py-2 rounded-lg text-sm font-medium border transition ${
                    questionCountOption === 'custom'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                  className="w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập số câu..."
                />
              )}
            </div>

            {/* 2. Difficulty */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Difficulty (Độ khó)
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="HSK1">HSK1</option>
                <option value="HSK2">HSK2</option>
                <option value="HSK3">HSK3</option>
              </select>
            </div>

            {/* 3. Vocabulary Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Vocabulary Mode
              </label>
              <div className="space-y-2">
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
                    className={`block p-3 rounded-lg border cursor-pointer transition ${
                      mode === m.id
                        ? 'bg-indigo-50/70 border-indigo-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === m.id}
                        onChange={() => setMode(m.id as any)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-xs text-slate-900">{m.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-5 mt-0.5">{m.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Tùy chọn Tiêu đề & Mô tả ngắn */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tùy chọn Tên & Mô tả bài
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tiêu đề bài (để trống AI sẽ tự tạo)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  rows={2}
                  placeholder="Mô tả ngắn nội dung bài (tùy chọn)"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Nút Submit Generate */}
          <button
            onClick={handleGenerate}
            disabled={generating || selectedIds.size === 0}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium shadow-md transition flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Practice ({actualQuestionCount} câu)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
