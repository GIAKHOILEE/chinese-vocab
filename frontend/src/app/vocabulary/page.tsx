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
} from 'lucide-react';
import { speakChinese } from '@/lib/speech';

interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  pinyin: string | null;
  level: string | null;
  createdAt: string;
}

export default function VocabularyPage() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // Trạng thái Modals / Forms
  const [activeTab, setActiveTab] = useState<'list' | 'single' | 'bulk' | 'csv'>('list');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form nhập thủ công
  const [singleForm, setSingleForm] = useState({
    word: '',
    meaning: '',
    pinyin: '',
    level: 'HSK1',
  });

  // Form paste nhiều dòng
  const [bulkText, setBulkText] = useState('');
  const [bulkLevel, setBulkLevel] = useState('HSK1');
  const [bulkPreview, setBulkPreview] = useState<{ word: string; meaning: string; pinyin: string }[]>([]);

  // CSV
  const [csvContent, setCsvContent] = useState('');

  // Form chỉnh sửa
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    word: '',
    meaning: '',
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
  }, [search, levelFilter]);

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
        pinyin: parts[2] || '(Tự động sinh Pinyin)',
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
      setSingleForm({ word: '', meaning: '', pinyin: '', level: 'HSK1' });
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
      pinyin: vocab.pinyin || '',
      level: vocab.level || 'HSK1',
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
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Từ vựng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lưu trữ từ vựng cá nhân, làm phong phú vốn từ để sinh các câu luyện tập.
          </p>
        </div>

        {/* Các nút mở Tabs nhập dữ liệu */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTab('single'); setErrorMsg(''); setSuccessMsg(''); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thủ công</span>
          </button>
          <button
            onClick={() => { setActiveTab('bulk'); setErrorMsg(''); setSuccessMsg(''); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            <FileText className="w-4 h-4" />
            <span>Paste nhiều từ</span>
          </button>
          <button
            onClick={() => { setActiveTab('csv'); setErrorMsg(''); setSuccessMsg(''); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Thông báo Thành công / Thất bại */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* TAB A: Nhập thủ công */}
      {activeTab === 'single' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-semibold text-slate-800">A. Nhập từ vựng thủ công</h2>
            <button onClick={() => setActiveTab('list')} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateSingle} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chinese Word (*)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 学习"
                value={singleForm.word}
                onChange={(e) => setSingleForm({ ...singleForm, word: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm font-chinese focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vietnamese Meaning (*)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: học"
                value={singleForm.meaning}
                onChange={(e) => setSingleForm({ ...singleForm, meaning: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pinyin (Optional)</label>
              <input
                type="text"
                placeholder="Để trống sẽ tự động sinh Pinyin (xuéxí)"
                value={singleForm.pinyin}
                onChange={(e) => setSingleForm({ ...singleForm, pinyin: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Level (Optional)</label>
              <select
                value={singleForm.level}
                onChange={(e) => setSingleForm({ ...singleForm, level: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="HSK1">HSK1</option>
                <option value="HSK2">HSK2</option>
                <option value="HSK3">HSK3</option>
                <option value="HSK4">HSK4</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
              >
                Lưu từ vựng
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB B: Paste nhiều từ */}
      {activeTab === 'bulk' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-semibold text-slate-800">B. Paste nhiều từ vựng (Mỗi dòng 1 từ)</h2>
            <button onClick={() => setActiveTab('list')} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Nhập danh sách từ vựng. Định dạng đơn giản: mỗi dòng 1 từ tiếng Trung. Hoặc mở rộng với dấu | (ví dụ: <code className="bg-slate-100 px-1">学习 | học | xuéxí | HSK1</code>).
            </p>

            <textarea
              rows={6}
              placeholder="学习&#10;中文&#10;朋友&#10;学校&#10;喜欢"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full p-3 border rounded-lg text-sm font-chinese focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Preview danh sách trước khi import */}
            {bulkPreview.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-lg border text-xs space-y-2 max-h-40 overflow-y-auto">
                <span className="font-semibold text-slate-700">Xem trước (Preview {bulkPreview.length} từ):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bulkPreview.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 border rounded flex justify-between">
                      <span className="font-chinese font-bold text-slate-800">{item.word}</span>
                      <span className="text-slate-500">{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkPreview.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                Xác nhận Import ({bulkPreview.length} từ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: Import CSV */}
      {activeTab === 'csv' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-semibold text-slate-800">C. Import CSV</h2>
            <button onClick={() => setActiveTab('list')} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Định dạng CSV yêu cầu các cột: <code className="bg-slate-100 px-1 font-mono">word,meaning,pinyin,level</code>
            </p>

            <textarea
              rows={5}
              placeholder="word,meaning,pinyin,level&#10;学习,học,xuéxí,HSK1&#10;中文,tiếng Trung,Zhōngwén,HSK1"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full p-3 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleCsvSubmit}
                disabled={!csvContent.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                Import CSV Dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bảng từ vựng Vocabulary List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {/* Bộ lọc Tìm kiếm & Level */}
        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm từ tiếng Trung hoặc nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-medium border-b text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Chinese</th>
                <th className="px-6 py-3">Meaning</th>
                <th className="px-6 py-3">Pinyin</th>
                <th className="px-6 py-3">Level</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Đang tải danh sách từ vựng...
                  </td>
                </tr>
              ) : vocabularies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Chưa có từ vựng nào. Hãy bấm &quot;Thêm thủ công&quot; hoặc &quot;Paste nhiều từ&quot; để tạo mới.
                  </td>
                </tr>
              ) : (
                vocabularies.map((vocab) => {
                  const isEditing = editingId === vocab.id;

                  if (isEditing) {
                    return (
                      <tr key={vocab.id} className="bg-indigo-50/50">
                        <td className="px-6 py-3 font-chinese font-bold text-lg text-slate-900">
                          <input
                            type="text"
                            value={editForm.word}
                            onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm font-chinese"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.meaning}
                            onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.pinyin}
                            onChange={(e) => setEditForm({ ...editForm, pinyin: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={editForm.level}
                            onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                            className="px-2 py-1 border rounded text-sm bg-white"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="HSK1">HSK1</option>
                            <option value="HSK2">HSK2</option>
                            <option value="HSK3">HSK3</option>
                          </select>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(vocab.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-200 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={vocab.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-chinese font-bold text-lg text-slate-900">{vocab.word}</span>
                          <button
                            type="button"
                            onClick={() => speakChinese(vocab.word)}
                            title="Nghe phát âm"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{vocab.meaning}</td>
                      <td className="px-6 py-4 text-slate-500 font-sans">{vocab.pinyin || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border">
                          {vocab.level || 'HSK1'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(vocab)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vocab.id, vocab.word)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
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
