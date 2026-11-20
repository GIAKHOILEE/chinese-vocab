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
  History,
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 px-5 py-3 rounded-[22px] shadow-clay-sage border border-sage-300/40 flex items-center gap-2 text-sm font-bold animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cocoa-900 flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/70 shadow-clay-sm flex items-center justify-center">
              <History className="w-5 h-5" />
            </span>
            <span>Lịch sử Luyện tập</span>
          </h1>
          <p className="text-sm text-cocoa-500 mt-1.5">
            Các bộ bài tập đã tạo. Bạn có thể chỉnh sửa tiêu đề, mô tả và mở lại để ôn luyện bất cứ lúc nào.
          </p>
        </div>

        <Link
          href="/practice/new"
          className="clay-btn-peach flex items-center gap-1.5 px-5 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bài mới</span>
        </Link>
      </div>

      {/* Danh sách bài tập */}
      {loading ? (
        <div className="clay-card p-12 text-center text-cocoa-400 text-sm font-semibold">
          Đang tải lịch sử...
        </div>
      ) : practiceSets.length === 0 ? (
        <div className="clay-card p-12 text-center space-y-4">
          <p className="text-cocoa-500 text-sm font-semibold">Chưa có bài tập nào được tạo.</p>
          <Link
            href="/practice/new"
            className="clay-btn-peach inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            Tạo bài tập đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {practiceSets.map((set) => {
            const dateStr = new Date(set.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });

            return (
              <div
                key={set.id}
                className="clay-card-hover p-6 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3.5">
                  {/* Ngày tạo, Cấp độ và nút thao tác */}
                  <div className="flex items-center justify-between text-xs text-cocoa-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-cocoa-400" />
                        {dateStr}
                      </span>
                      <span className="px-2.5 py-0.5 bg-sage-100/85 text-sage-700 border border-sage-200/70 rounded-full font-bold">
                        {set.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => openEditModal(set, e)}
                        title="Chỉnh sửa tiêu đề & mô tả"
                        className="p-2 text-cocoa-400 hover:text-peach-600 hover:bg-peach-100/70 rounded-full transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(set.id, e)}
                        title="Xóa bài tập"
                        className="p-2 text-cocoa-400 hover:text-berry-700 hover:bg-berry-100/80 rounded-full transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tiêu đề bài tập */}
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      onClick={() => openEditModal(set)}
                      className="font-extrabold text-cocoa-900 text-lg line-clamp-2 cursor-pointer hover:text-peach-600 transition"
                      title="Nhấn để đổi tiêu đề bài tập"
                    >
                      {set.title}
                    </h3>
                  </div>

                  {/* Mô tả ngắn nội dung bài tập */}
                  {set.description ? (
                    <div
                      onClick={() => openEditModal(set)}
                      className="clay-inset p-3.5 hover:bg-linen-200/60 text-xs text-cocoa-600 space-y-1 cursor-pointer transition"
                      title="Nhấn để chỉnh sửa mô tả"
                    >
                      <div className="flex items-center gap-1.5 text-cocoa-400 font-bold">
                        <FileText className="w-3.5 h-3.5 text-peach-500" />
                        <span>Mô tả bài luyện:</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed text-cocoa-700">{set.description}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditModal(set)}
                      className="w-full text-left p-3 border border-dashed border-cocoa-400/30 hover:border-peach-400 rounded-[18px] text-xs text-cocoa-400 hover:text-peach-600 hover:bg-peach-50/50 transition flex items-center gap-1.5 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm mô tả ngắn (chủ đề, mục tiêu bài tập)...</span>
                    </button>
                  )}

                  {/* Thông tin số lượng từ & câu hỏi */}
                  <div className="flex items-center gap-4 text-xs text-cocoa-500 font-bold pt-1">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-peach-500" />
                      <span>{set.vocabularyCount} từ vựng</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sage-500" />
                      <span>{set.questionCount} câu hỏi</span>
                    </span>
                  </div>
                </div>

                {/* Footer thẻ: nút Sửa & Bắt đầu */}
                <div className="flex items-center justify-between border-t border-cocoa-400/15 pt-4 mt-1">
                  <button
                    onClick={() => openEditModal(set)}
                    className="flex items-center gap-1.5 text-xs text-cocoa-500 hover:text-peach-600 font-bold py-1.5 px-3 hover:bg-linen-200/70 rounded-[14px] transition"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Sửa tiêu đề & mô tả</span>
                  </button>

                  <Link
                    href={`/practice/${set.id}`}
                    className="clay-btn-peach flex items-center gap-1.5 px-4 py-2 text-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-linen-50" />
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
        <div className="fixed inset-0 bg-cocoa-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="clay-modal max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-cocoa-400/15 bg-linen-100/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/60 shadow-clay-sm flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-cocoa-900 text-base">Chỉnh sửa bài luyện tập</h3>
                  <p className="text-xs text-cocoa-500">Cập nhật tiêu đề và mô tả để sau này nhìn lại nhớ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="text-cocoa-400 hover:text-cocoa-700 p-2 hover:bg-linen-200/80 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {saveError && (
                <div className="p-3.5 bg-berry-100 border border-berry-200 text-berry-700 rounded-[18px] text-xs font-bold">
                  {saveError}
                </div>
              )}

              {/* Input Tiêu đề */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-cocoa-700 uppercase tracking-wider">
                  Tiêu đề bài tập <span className="text-berry-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập HSK1 - Đại từ & Chào hỏi"
                  required
                  autoFocus
                  className="w-full clay-input px-4 py-2.5 text-sm"
                />
                <p className="text-xs text-cocoa-400">
                  Đặt tên ngắn gọn, dễ nhớ để bạn dễ dàng nhận ra bài tập này trong danh sách.
                </p>
              </div>

              {/* Textarea Mô tả ngắn */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-cocoa-700 uppercase tracking-wider">
                  Mô tả ngắn nội dung bài tập
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ví dụ: Luyện viết các câu hỏi mua sắm, giá cả, và cấu trúc câu chữ '把'..."
                  className="w-full clay-input px-4 py-2.5 text-sm resize-none"
                />
                <p className="text-xs text-cocoa-400">
                  Ghi chú tóm tắt nội dung câu hỏi, chủ đề hoặc mục đích luyện tập của bài này.
                </p>
              </div>

              {/* Thông tin bài tập bổ sung */}
              <div className="clay-inset p-3.5 text-xs text-cocoa-500 flex items-center justify-between">
                <span>
                  Cấp độ: <strong className="text-cocoa-800">{editingSet.difficulty}</strong>
                </span>
                <span>
                  Số từ vựng: <strong className="text-cocoa-800">{editingSet.vocabularyCount}</strong>
                </span>
                <span>
                  Số câu hỏi: <strong className="text-cocoa-800">{editingSet.questionCount}</strong>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cocoa-400/15">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="clay-btn-cream px-5 py-2.5 text-sm"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="clay-btn-peach flex items-center gap-1.5 px-5 py-2.5 text-sm"
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
