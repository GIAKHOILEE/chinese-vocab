'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import {
  Search,
  Plus,
  FileText,
  Upload,
  Trash2,
  Edit2,
  X,
  Check,
  Filter,
  Volume2,
  BookOpen,
} from 'lucide-react';
import { speakChinese } from '@/lib/speech';

interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  pinyin: string | null;
  level: string | null;
  createdAt: string;
}

const PART_OF_SPEECH_OPTIONS = [
  'Danh từ',
  'Động từ',
  'Tính từ',
  'Đại từ',
  'Phó từ',
  'Số từ',
  'Lượng từ',
  'Giới từ',
  'Liên từ',
  'Trợ từ',
  'Thán từ',
  'Cụm từ',
];

export default function VocabularyPage() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [partOfSpeechFilter, setPartOfSpeechFilter] = useState('ALL');

  // Trạng thái Modals / Forms
  const [activeTab, setActiveTab] = useState<'list' | 'single' | 'bulk' | 'csv'>('list');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form nhập thủ công
  const [singleForm, setSingleForm] = useState({
    word: '',
    meaning: '',
    partOfSpeech: '',
    pinyin: '',
    level: 'HSK2',
  });

  // Form paste nhiều dòng
  const [bulkText, setBulkText] = useState('');
  const [bulkLevel, setBulkLevel] = useState('HSK2');
  const [bulkPreview, setBulkPreview] = useState<
    { word: string; meaning: string; partOfSpeech: string; pinyin: string }[]
  >([]);

  // CSV
  const [csvContent, setCsvContent] = useState('');

  // Form chỉnh sửa
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    word: '',
    meaning: '',
    partOfSpeech: '',
    pinyin: '',
    level: 'HSK1',
  });

  // Load danh sách từ vựng
  const loadVocabularies = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (levelFilter && levelFilter !== 'ALL') queryParams.append('level', levelFilter);
      if (partOfSpeechFilter && partOfSpeechFilter !== 'ALL') {
        queryParams.append('partOfSpeech', partOfSpeechFilter);
      }

      const data = await fetchApi<Vocabulary[]>(`/vocabulary?${queryParams.toString()}`);
      setVocabularies(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải danh sách từ vựng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVocabularies();
  }, [search, levelFilter, partOfSpeechFilter]);

  // Xử lý xem preview Paste nhiều từ
  useEffect(() => {
    if (!bulkText.trim()) {
      setBulkPreview([]);
      return;
    }
    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const previewItems = lines.map((line) => {
      const parts = line.split(/[|]/).map((p) => p.trim());
      return {
        word: parts[0] || '',
        meaning: parts[1] || parts[0] || '',
        partOfSpeech: parts[2] || '',
        pinyin: parts[3] || '(Tự động sinh Pinyin)',
      };
    });
    setBulkPreview(previewItems);
  }, [bulkText]);

  // Xử lý tạo từ thủ công
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await fetchApi('/vocabulary', {
        method: 'POST',
        body: JSON.stringify(singleForm),
      });
      setSuccessMsg(`Đã thêm từ "${singleForm.word}" thành công!`);
      setSingleForm({ word: '', meaning: '', partOfSpeech: '', pinyin: '', level: 'HSK2' });
      setActiveTab('list');
      loadVocabularies();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể thêm từ vựng');
    }
  };

  // Xử lý paste nhiều từ
  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;
    setErrorMsg('');
    try {
      const res = await fetchApi<any>('/vocabulary/bulk', {
        method: 'POST',
        body: JSON.stringify({ text: bulkText, defaultLevel: bulkLevel }),
      });
      setSuccessMsg(res.message || 'Đã nhập danh sách từ vựng thành công');
      setBulkText('');
      setActiveTab('list');
      loadVocabularies();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể nhập từ vựng');
    }
  };

  // Xử lý import CSV
  const handleCsvSubmit = async () => {
    if (!csvContent.trim()) return;
    setErrorMsg('');
    try {
      const res = await fetchApi<any>('/vocabulary/import', {
        method: 'POST',
        body: JSON.stringify({ csvContent }),
      });
      setSuccessMsg(res.message || 'Import CSV thành công');
      setCsvContent('');
      setActiveTab('list');
      loadVocabularies();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi import file CSV');
    }
  };

  // Xóa từ vựng
  const handleDelete = async (id: string, word: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa từ "${word}" không?`)) return;
    try {
      await fetchApi(`/vocabulary/${id}`, { method: 'DELETE' });
      setVocabularies((prev) => prev.filter((v) => v.id !== id));
      setSuccessMsg(`Đã xóa từ "${word}"`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể xóa từ vựng');
    }
  };

  // Mở modal sửa từ
  const startEdit = (vocab: Vocabulary) => {
    setEditingId(vocab.id);
    setEditForm({
      word: vocab.word,
      meaning: vocab.meaning,
      partOfSpeech: vocab.partOfSpeech || '',
      pinyin: vocab.pinyin || '',
      level: vocab.level || 'HSK2',
    });
  };

  // Lưu thông tin sửa
  const handleUpdate = async (id: string) => {
    try {
      const updated = await fetchApi<Vocabulary>(`/vocabulary/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setVocabularies((prev) => prev.map((v) => (v.id === id ? updated : v)));
      setEditingId(null);
      setSuccessMsg('Cập nhật từ vựng thành công');
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể cập nhật từ vựng');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header trang */}
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cocoa-900 flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/70 shadow-clay-sm flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </span>
            <span>Quản lý Từ vựng</span>
          </h1>
          <p className="text-sm text-cocoa-500 mt-1.5">
            Lưu trữ từ vựng cá nhân, làm phong phú vốn từ để sinh các câu luyện tập.
          </p>
        </div>

        {/* Các nút mở Tabs nhập dữ liệu */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveTab('single');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="clay-btn-peach flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thủ công</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('bulk');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="clay-btn-cream flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            <FileText className="w-4 h-4 text-peach-600" />
            <span>Paste nhiều từ</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('csv');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="clay-btn-cream flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            <Upload className="w-4 h-4 text-sage-600" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Thông báo Thành công / Thất bại */}
      {successMsg && (
        <div className="p-4 bg-sage-100/90 border border-sage-300/60 text-sage-800 rounded-[22px] text-sm font-bold flex justify-between items-center shadow-clay-sm">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-sage-200/60 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-berry-100/90 border border-berry-200 text-berry-700 rounded-[22px] text-sm font-bold flex justify-between items-center shadow-clay-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-berry-200/60 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB A: Nhập thủ công */}
      {activeTab === 'single' && (
        <div className="clay-card p-6 sm:p-7 space-y-5 animate-fade-in">
          <div className="flex justify-between items-center border-b border-cocoa-400/15 pb-4">
            <h2 className="font-extrabold text-cocoa-900">A. Nhập từ vựng thủ công</h2>
            <button
              onClick={() => setActiveTab('list')}
              className="p-1.5 rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-linen-200/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateSingle} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Chinese Word (*)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 学习"
                value={singleForm.word}
                onChange={(e) => setSingleForm({ ...singleForm, word: e.target.value })}
                className="w-full clay-input px-4 py-2.5 text-sm font-chinese"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Vietnamese Meaning (*)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: học"
                value={singleForm.meaning}
                onChange={(e) => setSingleForm({ ...singleForm, meaning: e.target.value })}
                className="w-full clay-input px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Từ loại</label>
              <select
                value={singleForm.partOfSpeech}
                onChange={(e) => setSingleForm({ ...singleForm, partOfSpeech: e.target.value })}
                className="w-full clay-input px-4 py-2.5 text-sm"
              >
                <option value="">Chưa phân loại</option>
                {PART_OF_SPEECH_OPTIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Pinyin (Optional)</label>
              <input
                type="text"
                placeholder="Để trống sẽ tự động sinh Pinyin (xuéxí)"
                value={singleForm.pinyin}
                onChange={(e) => setSingleForm({ ...singleForm, pinyin: e.target.value })}
                className="w-full clay-input px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cocoa-700 mb-1.5">Level (Optional)</label>
              <select
                value={singleForm.level}
                onChange={(e) => setSingleForm({ ...singleForm, level: e.target.value })}
                className="w-full clay-input px-4 py-2.5 text-sm"
              >
                <option value="Beginner">Beginner</option>
                <option value="HSK1">HSK1</option>
                <option value="HSK2">HSK2</option>
                <option value="HSK3">HSK3</option>
                <option value="HSK4">HSK4</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="clay-btn-cream px-5 py-2.5 text-sm"
              >
                Hủy
              </button>
              <button type="submit" className="clay-btn-peach px-5 py-2.5 text-sm">
                Lưu từ vựng
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB B: Paste nhiều từ */}
      {activeTab === 'bulk' && (
        <div className="clay-card p-6 sm:p-7 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-cocoa-400/15 pb-4">
            <h2 className="font-extrabold text-cocoa-900">B. Paste nhiều từ vựng (Mỗi dòng 1 từ)</h2>
            <button
              onClick={() => setActiveTab('list')}
              className="p-1.5 rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-linen-200/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-cocoa-600">
              Nhập danh sách từ vựng. Định dạng đơn giản: mỗi dòng 1 từ tiếng Trung. Hoặc mở rộng với dấu | (ví dụ:{' '}
              <code className="bg-linen-200 px-1.5 py-0.5 rounded-md text-cocoa-800">
                学习 | học | Động từ | xuéxí | HSK1
              </code>
              ).
            </p>

            <textarea
              rows={6}
              placeholder={'学习 | học | Động từ\n中文 | tiếng Trung | Danh từ\n朋友 | bạn bè | Danh từ'}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full clay-input p-4 text-sm font-chinese"
            />

            {/* Preview danh sách trước khi import */}
            {bulkPreview.length > 0 && (
              <div className="clay-inset p-4 text-xs space-y-2.5 max-h-44 overflow-y-auto">
                <span className="font-extrabold text-cocoa-700">
                  Xem trước (Preview {bulkPreview.length} từ):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bulkPreview.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-linen-50 p-2.5 border border-cocoa-400/15 rounded-[14px] flex justify-between items-center gap-2 shadow-clay-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-chinese font-bold text-cocoa-900">{item.word}</span>
                        {item.partOfSpeech && (
                          <span className="px-2 py-0.5 rounded-full bg-peach-100 text-peach-700 text-[10px] font-bold">
                            {item.partOfSpeech}
                          </span>
                        )}
                      </div>
                      <span className="text-cocoa-500 truncate">{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="clay-btn-cream px-5 py-2.5 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkPreview.length === 0}
                className="clay-btn-peach px-5 py-2.5 text-sm"
              >
                Xác nhận Import ({bulkPreview.length} từ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: Import CSV */}
      {activeTab === 'csv' && (
        <div className="clay-card p-6 sm:p-7 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-cocoa-400/15 pb-4">
            <h2 className="font-extrabold text-cocoa-900">C. Import CSV</h2>
            <button
              onClick={() => setActiveTab('list')}
              className="p-1.5 rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-linen-200/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-cocoa-600">
              Định dạng CSV yêu cầu các cột:{' '}
              <code className="bg-linen-200 px-1.5 py-0.5 rounded-md font-mono text-cocoa-800">
                word,meaning,partOfSpeech,pinyin,level
              </code>
            </p>

            <textarea
              rows={5}
              placeholder={'word,meaning,partOfSpeech,pinyin,level\n学习,học,Động từ,xuéxí,HSK1\n中文,tiếng Trung,Danh từ,Zhōngwén,HSK1'}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full clay-input p-4 text-sm font-mono"
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="clay-btn-cream px-5 py-2.5 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleCsvSubmit}
                disabled={!csvContent.trim()}
                className="clay-btn-peach px-5 py-2.5 text-sm"
              >
                Import CSV Dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bảng từ vựng Vocabulary List */}
      <div className="clay-card overflow-hidden">
        {/* Bộ lọc Tìm kiếm & Level */}
        <div className="p-5 sm:p-6 border-b border-cocoa-400/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-cocoa-400" />
            <input
              type="text"
              placeholder="Tìm kiếm từ tiếng Trung hoặc nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full clay-input pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <Filter className="w-4 h-4 text-cocoa-400" />
            <select
              value={partOfSpeechFilter}
              onChange={(e) => setPartOfSpeechFilter(e.target.value)}
              className="clay-input px-3.5 py-2.5 text-sm"
            >
              <option value="ALL">Tất cả từ loại</option>
              {PART_OF_SPEECH_OPTIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
              <option value="UNSET">Chưa phân loại</option>
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="clay-input px-3.5 py-2.5 text-sm"
            >
              <option value="ALL">Tất cả cấp độ</option>
              <option value="Beginner">Beginner</option>
              <option value="HSK1">HSK1</option>
              <option value="HSK2">HSK2</option>
              <option value="HSK3">HSK3</option>
              <option value="HSK4">HSK4</option>
            </select>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-cocoa-600">
            <thead className="bg-linen-200/65 text-cocoa-700 font-extrabold border-b border-cocoa-400/15 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Chinese</th>
                <th className="px-6 py-4">Từ loại</th>
                <th className="px-6 py-4">Meaning</th>
                <th className="px-6 py-4">Pinyin</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cocoa-400/15">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-cocoa-400 font-semibold">
                    Đang tải danh sách từ vựng...
                  </td>
                </tr>
              ) : vocabularies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-cocoa-400 font-semibold">
                    Chưa có từ vựng nào. Hãy bấm &quot;Thêm thủ công&quot; hoặc &quot;Paste nhiều từ&quot; để tạo mới.
                  </td>
                </tr>
              ) : (
                vocabularies.map((vocab) => {
                  const isEditing = editingId === vocab.id;

                  if (isEditing) {
                    return (
                      <tr key={vocab.id} className="bg-peach-50/60">
                        <td className="px-6 py-3 font-chinese font-bold text-lg text-cocoa-900">
                          <input
                            type="text"
                            value={editForm.word}
                            onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                            className="w-full clay-input px-2.5 py-1.5 text-sm font-chinese"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={editForm.partOfSpeech}
                            onChange={(e) => setEditForm({ ...editForm, partOfSpeech: e.target.value })}
                            className="clay-input px-2.5 py-1.5 text-sm"
                          >
                            <option value="">Chưa phân loại</option>
                            {PART_OF_SPEECH_OPTIONS.map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.meaning}
                            onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                            className="w-full clay-input px-2.5 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.pinyin}
                            onChange={(e) => setEditForm({ ...editForm, pinyin: e.target.value })}
                            className="w-full clay-input px-2.5 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={editForm.level}
                            onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                            className="clay-input px-2.5 py-1.5 text-sm"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="HSK1">HSK1</option>
                            <option value="HSK2">HSK2</option>
                            <option value="HSK3">HSK3</option>
                            <option value="HSK4">HSK4</option>
                          </select>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(vocab.id)}
                              className="p-2 text-sage-700 bg-sage-100 hover:bg-sage-200 rounded-full transition"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-cocoa-500 bg-linen-200 hover:bg-linen-300 rounded-full transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={vocab.id} className="hover:bg-linen-100/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-chinese font-bold text-lg text-cocoa-900">{vocab.word}</span>
                          <button
                            type="button"
                            onClick={() => speakChinese(vocab.word)}
                            title="Nghe phát âm"
                            className="p-1.5 text-cocoa-400 hover:text-peach-600 hover:bg-peach-100 rounded-full transition"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {vocab.partOfSpeech ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-peach-100/85 text-peach-700 border border-peach-200/70 whitespace-nowrap">
                            {vocab.partOfSpeech}
                          </span>
                        ) : (
                          <span className="text-cocoa-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-cocoa-800">{vocab.meaning}</td>
                      <td className="px-6 py-4 text-cocoa-500 font-semibold">{vocab.pinyin || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-sage-100/80 text-sage-700 border border-sage-200/70">
                          {vocab.level || 'HSK1'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(vocab)}
                            className="p-2 text-cocoa-400 hover:text-peach-600 hover:bg-peach-100/70 rounded-full transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vocab.id, vocab.word)}
                            className="p-2 text-cocoa-400 hover:text-berry-700 hover:bg-berry-100/80 rounded-full transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
