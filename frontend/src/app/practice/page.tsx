'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import {
  Play,
  Trash2,
  Calendar,
  BookOpen,
  Layers,
  Plus,
  Pencil,
  FileText,
  X,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface PracticeSet {
  id: string;
  title: string;
  description?: string | null;
  difficulty: string;
  questionCount: number;
  vocabularyCount: number;
  createdAt: string;
}

export default function PracticeHistoryPage() {
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(true);

  // Trạng thái modal chỉnh sửa
  const [editingSet, setEditingSet] = useState<PracticeSet | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const loadHistory = async () => {
    try {
      const data = await fetchApi<PracticeSet[]>('/practice');
      setPracticeSets(data);
    } catch (err) {
      console.error('Không thể tải lịch sử bài tập:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const openEditModal = (set: PracticeSet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSet(set);
    setEditTitle(set.title);
    setEditDescription(set.description || '');
    setSaveError('');
  };

  const closeEditModal = () => {
    setEditingSet(null);
    setEditTitle('');
    setEditDescription('');
    setSaveError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSet) return;

    if (!editTitle.trim()) {
      setSaveError('Tiêu đề không được để trống.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const updated = await fetchApi<PracticeSet>(`/practice/${editingSet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });

      setPracticeSets((prev) =>
        prev.map((item) =>
          item.id === editingSet.id
            ? {
                ...item,
                title: updated.title,
                description: updated.description,
              }
            : item,
        ),
      );

      closeEditModal();
      showToast('Đã cập nhật bài tập thành công!');
    } catch (err: any) {
      setSaveError(err.message || 'Không thể cập nhật bài tập. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bộ bài tập này?')) return;
    try {
      await fetchApi(`/practice/${id}`, { method: 'DELETE' });
      setPracticeSets((prev) => prev.filter((p) => p.id !== id));
      showToast('Đã xóa bài tập!');
    } catch (err) {
      alert('Không thể xóa bài tập');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch sử Luyện tập</h1>
          <p className="text-sm text-slate-500 mt-1">
            Các bộ bài tập đã tạo. Bạn có thể chỉnh sửa tiêu đề, mô tả và mở lại để ôn luyện bất cứ lúc nào.
          </p>
        </div>

        <Link
          href="/practice/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bài mới</span>
        </Link>
      </div>

      {/* Danh sách bài tập */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải lịch sử...</div>
      ) : practiceSets.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border text-center space-y-4">
          <p className="text-slate-500 text-sm">Chưa có bài tập nào được tạo.</p>
          <Link
            href="/practice/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
          >
            Tạo bài tập đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practiceSets.map((set) => {
            const dateStr = new Date(set.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });

            return (
              <div
                key={set.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition group"
              >
                <div className="space-y-3">
                  {/* Ngày tạo, Cấp độ và nút thao tác */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {dateStr}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                        {set.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => openEditModal(set, e)}
                        title="Chỉnh sửa tiêu đề & mô tả"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(set.id, e)}
                        title="Xóa bài tập"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tiêu đề bài tập */}
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      onClick={() => openEditModal(set)}
                      className="font-bold text-slate-800 text-base line-clamp-2 cursor-pointer hover:text-indigo-600 transition"
                      title="Nhấn để đổi tiêu đề bài tập"
                    >
                      {set.title}
                    </h3>
                  </div>

                  {/* Mô tả ngắn nội dung bài tập */}
                  {set.description ? (
                    <div
                      onClick={() => openEditModal(set)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1 cursor-pointer transition"
                      title="Nhấn để chỉnh sửa mô tả"
                    >
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        <span>Mô tả bài luyện:</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed text-slate-700">
                        {set.description}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditModal(set)}
                      className="w-full text-left p-2 border border-dashed border-slate-200 hover:border-indigo-300 rounded-lg text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/40 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm mô tả ngắn (chủ đề, mục tiêu bài tập)...</span>
                    </button>
                  )}

                  {/* Thông tin số lượng từ & câu hỏi */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{set.vocabularyCount} từ vựng</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{set.questionCount} câu hỏi</span>
                    </span>
                  </div>
                </div>

                {/* Footer thẻ: nút Sửa & Bắt đầu */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                  <button
                    onClick={() => openEditModal(set)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium py-1 px-2 hover:bg-slate-50 rounded transition"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Sửa tiêu đề & mô tả</span>
                  </button>

                  <Link
                    href={`/practice/${set.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-indigo-700" />
                    <span>Bắt đầu luyện tập</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Chỉnh sửa Tiêu đề & Mô tả */}
      {editingSet && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Chỉnh sửa bài luyện tập</h3>
                  <p className="text-xs text-slate-500">Cập nhật tiêu đề và mô tả để sau này nhìn lại nhớ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {saveError}
                </div>
              )}

              {/* Input Tiêu đề */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tiêu đề bài tập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập HSK1 - Đại từ & Chào hỏi"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <p className="text-xs text-slate-400">
                  Đặt tên ngắn gọn, dễ nhớ để bạn dễ dàng nhận ra bài tập này trong danh sách.
                </p>
              </div>

              {/* Textarea Mô tả ngắn */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mô tả ngắn nội dung bài tập
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ví dụ: Luyện viết các câu hỏi mua sắm, giá cả, và cấu trúc câu chữ '把'..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
                <p className="text-xs text-slate-400">
                  Ghi chú tóm tắt nội dung câu hỏi, chủ đề hoặc mục đích luyện tập của bài này.
                </p>
              </div>

              {/* Thông tin bài tập bổ sung */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 flex items-center justify-between">
                <span>Cấp độ: <strong className="text-slate-700">{editingSet.difficulty}</strong></span>
                <span>Số từ vựng: <strong className="text-slate-700">{editingSet.vocabularyCount}</strong></span>
                <span>Số câu hỏi: <strong className="text-slate-700">{editingSet.questionCount}</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
