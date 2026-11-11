'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import {
  Eye,
  ArrowRight,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Pencil,
  FileText,
  X,
  Check,
  Loader2,
  Volume2,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Play,
  AlertCircle,
} from 'lucide-react';
import { speakChinese, stopSpeaking } from '@/lib/speech';

interface Question {
  id: string;
  vietnamese: string;
  chinese: string;
  pinyin: string;
  usedVocabulary: string[];
}

interface PracticeSet {
  id: string;
  title: string;
  description?: string | null;
  difficulty: string;
  questionCount: number;
  createdAt: string;
  questions: Question[];
}

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const practiceId = params.id as string;

  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Trạng thái vị trí câu hỏi hiện tại & hiển thị đáp án
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Trạng thái phát âm Web Speech API
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85); // 0.75x chậm, 1.0x chuẩn
  const [autoPlay, setAutoPlay] = useState(true); // Tự động phát khi mở đáp án

  // Trạng thái modal sửa tiêu đề/mô tả bài tập
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Trạng thái Quản lý danh sách câu hỏi
  const [isQuestionsListOpen, setIsQuestionsListOpen] = useState(false);

  // Trạng thái Modal Thêm/Sửa câu hỏi
  const [questionModalMode, setQuestionModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionChinese, setQuestionChinese] = useState('');
  const [questionPinyin, setQuestionPinyin] = useState('');
  const [questionVietnamese, setQuestionVietnamese] = useState('');
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionFormError, setQuestionFormError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  // Khôi phục cài đặt phát âm từ localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAutoPlay = localStorage.getItem('chinese_tts_autoplay');
      if (savedAutoPlay !== null) {
        setAutoPlay(savedAutoPlay === 'true');
      }
      const savedRate = localStorage.getItem('chinese_tts_rate');
      if (savedRate) {
        setSpeechRate(parseFloat(savedRate));
      }
    }
  }, []);

  const changeSpeechRate = (rate: number) => {
    setSpeechRate(rate);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chinese_tts_rate', rate.toString());
    }
  };

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chinese_tts_autoplay', String(next));
      }
      return next;
    });
  };

  // Hàm phát âm tiếng Trung
  const handleSpeak = useCallback(
    (text?: string) => {
      if (!text) return;
      setIsSpeaking(true);
      speakChinese(text, {
        rate: speechRate,
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [speechRate],
  );

  // Dừng phát âm khi rời trang hoặc kết thúc
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Tải dữ liệu bài tập từ Backend
  useEffect(() => {
    async function loadPracticeSet() {
      try {
        const data = await fetchApi<PracticeSet>(`/practice/${practiceId}`);
        setPracticeSet(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Không thể tải bài luyện tập');
      } finally {
        setLoading(false);
      }
    }
    if (practiceId) {
      loadPracticeSet();
    }
  }, [practiceId]);

  // Hành động Chuyển sang câu tiếp theo
  const handleNextQuestion = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
    if (!practiceSet || practiceSet.questions.length === 0) return;
    if (currentIndex < practiceSet.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, practiceSet]);

  // Hành động Hiện đáp án (và tự động phát âm nếu bật)
  const handleRevealAnswer = useCallback(() => {
    setShowAnswer(true);
    const chineseSentence = practiceSet?.questions[currentIndex]?.chinese;
    if (autoPlay && chineseSentence) {
      handleSpeak(chineseSentence);
    }
  }, [autoPlay, practiceSet, currentIndex, handleSpeak]);

  // Luyện tập lại từ câu đầu tiên
  const handleRestart = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsCompleted(false);
  };

  // Mở modal sửa bài tập
  const handleOpenEdit = () => {
    if (!practiceSet) return;
    setEditTitle(practiceSet.title);
    setEditDescription(practiceSet.description || '');
    setEditError('');
    setIsEditing(true);
  };

  // Lưu chỉnh sửa tiêu đề và mô tả
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceSet) return;

    if (!editTitle.trim()) {
      setEditError('Tiêu đề không được để trống.');
      return;
    }

    setSavingEdit(true);
    setEditError('');

    try {
      const updated = await fetchApi<PracticeSet>(`/practice/${practiceSet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });

      setPracticeSet((prev) =>
        prev
          ? {
              ...prev,
              title: updated.title,
              description: updated.description,
            }
          : prev,
      );

      setIsEditing(false);
      showToast('Đã cập nhật thông tin bài tập!');
    } catch (err: any) {
      setEditError(err.message || 'Không thể cập nhật bài tập.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ==========================================
  // XỬ LÝ CÂU HỎI (THÊM / SỬA / XÓA / AUTO GEN)
  // ==========================================

  // Mở modal Thêm câu mới
  const handleOpenAddQuestion = () => {
    setQuestionModalMode('create');
    setEditingQuestion(null);
    setQuestionChinese('');
    setQuestionPinyin('');
    setQuestionVietnamese('');
    setQuestionFormError('');
  };

  // Mở modal Sửa câu
  const handleOpenEditQuestion = (q: Question) => {
    setQuestionModalMode('edit');
    setEditingQuestion(q);
    setQuestionChinese(q.chinese);
    setQuestionPinyin(q.pinyin);
    setQuestionVietnamese(q.vietnamese);
    setQuestionFormError('');
  };

  const handleCloseQuestionModal = () => {
    setQuestionModalMode(null);
    setEditingQuestion(null);
    setQuestionChinese('');
    setQuestionPinyin('');
    setQuestionVietnamese('');
    setQuestionFormError('');
    setIsAutoGenerating(false);
  };

  // Tự động sinh Pinyin & dịch Tiếng Việt bằng AI
  const handleAutoGenerateInfo = async () => {
    if (!questionChinese.trim()) {
      setQuestionFormError('Vui lòng nhập câu tiếng Trung trước khi tự động sinh.');
      return;
    }

    setIsAutoGenerating(true);
    setQuestionFormError('');

    try {
      const res = await fetchApi<{ chinese: string; pinyin: string; vietnamese: string }>(
        '/practice/auto-complete-sentence',
        {
          method: 'POST',
          body: JSON.stringify({
            chinese: questionChinese.trim(),
            vietnamese: questionVietnamese.trim() || undefined,
          }),
        },
      );

      if (res.pinyin) {
        setQuestionPinyin(res.pinyin);
      }
      if (res.vietnamese) {
        setQuestionVietnamese(res.vietnamese);
      }
      showToast('Đã tự động tạo Pinyin & dịch Tiếng Việt!');
    } catch (err: any) {
      setQuestionFormError(err.message || 'Không thể tự động sinh dữ liệu từ AI.');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  // Lưu câu hỏi (Thêm mới hoặc Cập nhật)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceSet) return;

    if (!questionChinese.trim()) {
      setQuestionFormError('Vui lòng nhập câu tiếng Trung.');
      return;
    }
    if (!questionVietnamese.trim()) {
      setQuestionFormError('Vui lòng nhập nghĩa hoặc câu tiếng Việt.');
      return;
    }

    setSavingQuestion(true);
    setQuestionFormError('');

    try {
      if (questionModalMode === 'create') {
        const newQ = await fetchApi<Question>(`/practice/${practiceSet.id}/questions`, {
          method: 'POST',
          body: JSON.stringify({
            chinese: questionChinese.trim(),
            vietnamese: questionVietnamese.trim(),
            pinyin: questionPinyin.trim() || undefined,
          }),
        });

        setPracticeSet((prev) => {
          if (!prev) return prev;
          const newQuestions = [...prev.questions, newQ];
          return {
            ...prev,
            questionCount: newQuestions.length,
            questions: newQuestions,
          };
        });

        showToast('Đã thêm câu mới vào bài tập!');
        handleCloseQuestionModal();
      } else if (questionModalMode === 'edit' && editingQuestion) {
        const updatedQ = await fetchApi<Question>(`/practice/questions/${editingQuestion.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            chinese: questionChinese.trim(),
            vietnamese: questionVietnamese.trim(),
            pinyin: questionPinyin.trim() || undefined,
          }),
        });

        setPracticeSet((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: prev.questions.map((q) => (q.id === updatedQ.id ? updatedQ : q)),
          };
        });

        showToast('Đã cập nhật câu hỏi thành công!');
        handleCloseQuestionModal();
      }
    } catch (err: any) {
      setQuestionFormError(err.message || 'Lỗi khi lưu câu hỏi. Vui lòng thử lại.');
    } finally {
      setSavingQuestion(false);
    }
  };

  // Xóa câu hỏi khỏi bài tập
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu này khỏi bài tập?')) return;

    try {
      await fetchApi(`/practice/questions/${questionId}`, {
        method: 'DELETE',
      });

      setPracticeSet((prev) => {
        if (!prev) return prev;
        const newQuestions = prev.questions.filter((q) => q.id !== questionId);
        return {
          ...prev,
          questionCount: newQuestions.length,
          questions: newQuestions,
        };
      });

      // Điều chỉnh currentIndex nếu câu hiện tại bị xóa hoặc vị trí vượt giới hạn
      setCurrentIndex((prev) => {
        const newTotal = (practiceSet?.questions.length || 1) - 1;
        if (newTotal <= 0) return 0;
        return prev >= newTotal ? newTotal - 1 : prev;
      });

      showToast('Đã xóa câu khỏi bài tập!');
    } catch (err: any) {
      alert(err.message || 'Không thể xóa câu hỏi');
    }
  };

  // Chuyển tới một câu cụ thể để luyện tập
  const handleJumpToQuestion = (index: number) => {
    stopSpeaking();
    setIsSpeaking(false);
    setCurrentIndex(index);
    setShowAnswer(false);
    setIsCompleted(false);
    setIsQuestionsListOpen(false);
  };

  // Xử lý Phím tắt Keyboard (Space: Xem đáp án/Chuyển câu, ArrowRight: Câu tiếp theo, A: Phát âm)
  const isAnyModalOpen = isEditing || isQuestionsListOpen || questionModalMode !== null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tránh bắt phím khi người dùng đang nhập input hoặc có modal đang mở
      if (isAnyModalOpen || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!showAnswer) {
          handleRevealAnswer();
        } else {
          handleNextQuestion();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (showAnswer) {
          handleNextQuestion();
        }
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        const currentChinese = practiceSet?.questions[currentIndex]?.chinese;
        if (currentChinese) {
          handleSpeak(currentChinese);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, handleRevealAnswer, handleNextQuestion, isAnyModalOpen, practiceSet, currentIndex, handleSpeak]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Đang tải bài tập...</span>
        </p>
      </div>
    );
  }

  if (errorMsg || !practiceSet) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border text-center space-y-4">
        <p className="text-rose-600 text-sm">{errorMsg || 'Bài tập không tồn tại'}</p>
        <button
          onClick={() => router.push('/practice')}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200"
        >
          Quay lại Lịch sử
        </button>
      </div>
    );
  }

  const currentQuestion = practiceSet.questions[currentIndex];
  const totalQuestions = practiceSet.questions.length;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Thanh Header Điều hướng */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/practice')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách bài tập</span>
        </button>

        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
          {practiceSet.difficulty}
        </span>
      </div>

      {/* Thông tin Tiêu đề & Quản lý bài tập */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">
              {practiceSet.title}
            </h1>
            {practiceSet.description ? (
              <p className="text-xs text-slate-500 flex items-start gap-1.5 leading-relaxed">
                <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>{practiceSet.description}</span>
              </p>
            ) : (
              <button
                onClick={handleOpenEdit}
                className="text-xs text-slate-400 italic hover:text-indigo-600 transition"
              >
                + Thêm mô tả ngắn để ghi nhớ nội dung bài này...
              </button>
            )}
          </div>

          {/* Các nút thao tác Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsQuestionsListOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition"
              title="Xem và quản lý tất cả các câu trong bài tập này"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Danh sách câu ({totalQuestions})</span>
            </button>

            <button
              onClick={handleOpenAddQuestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition shadow-xs"
              title="Thêm một câu tiếng Trung mới vào bài tập"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu mới</span>
            </button>

            <button
              onClick={handleOpenEdit}
              title="Chỉnh sửa tiêu đề & mô tả bài tập"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trường hợp bài tập chưa có câu hỏi nào */}
      {totalQuestions === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Bài tập này chưa có câu nào</h3>
            <p className="text-slate-500 text-xs">
              Bạn có thể thêm câu tiếng Trung mới để luyện viết ngay bây giờ.
            </p>
          </div>
          <button
            onClick={handleOpenAddQuestion}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu đầu tiên</span>
          </button>
        </div>
      ) : isCompleted ? (
        /* Màn hình hoàn thành bài tập */
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Hoàn thành bài tập!</h2>
            <p className="text-slate-500 text-sm">
              Bạn đã hoàn thành viết tay toàn bộ {totalQuestions} câu tiếng Trung.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện lại bộ câu này</span>
            </button>
            <button
              onClick={() => setIsQuestionsListOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition"
            >
              <Layers className="w-4 h-4" />
              <span>Xem danh sách câu</span>
            </button>
            <button
              onClick={() => router.push('/practice/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
            >
              <span>Tạo bài mới</span>
            </button>
          </div>
        </div>
      ) : (
        /* Thẻ hiển thị câu hỏi luyện viết chính */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 min-h-[380px] flex flex-col justify-between transition-all">
          {/* Tiến trình: Câu X / Y + Nút sửa câu hiện tại */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Câu {currentIndex + 1} / {totalQuestions}</span>
              {currentQuestion && (
                <button
                  type="button"
                  onClick={() => handleOpenEditQuestion(currentQuestion)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                  title="Chỉnh sửa câu này (chữ Hán, Pinyin, nghĩa)"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Sửa câu</span>
                </button>
              )}
            </div>

            <span className="text-xs hidden sm:inline text-slate-400">
              [Phím tắt: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">Space</code> = Xem/Tiếp, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">➔</code> = Tiếp, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">A</code> = Phát âm]
            </span>
          </div>

          {/* Nội dung câu Tiếng Việt */}
          <div className="text-center py-4 space-y-4">
            <p className="text-xl sm:text-2xl font-semibold text-slate-800 leading-relaxed px-4">
              {currentQuestion?.vietnamese}
            </p>
            <p className="text-xs text-slate-400">Tự viết câu tiếng Trung ra giấy trước khi xem đáp án</p>
          </div>

          {/* Khối ĐÁP ÁN tiếng Trung và Pinyin (Chỉ xuất hiện sau khi Click hoặc bấm Space) */}
          {showAnswer ? (
            <div className="space-y-4 border-t border-slate-100 pt-6 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-3">
                <div className="font-chinese font-bold text-3xl sm:text-4xl text-slate-900 tracking-wide">
                  {currentQuestion?.chinese}
                </div>
                <button
                  type="button"
                  onClick={() => handleSpeak(currentQuestion?.chinese)}
                  title="Nghe phát âm (Phím A)"
                  className={`p-2.5 rounded-full transition shadow-sm ${
                    isSpeaking
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 active:scale-95'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="font-sans text-slate-600 text-base sm:text-lg font-medium">
                {currentQuestion?.pinyin}
              </div>

              {/* Bảng điều khiển tốc độ & tự động đọc */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
                {/* Tốc độ đọc */}
                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => changeSpeechRate(0.75)}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      speechRate === 0.75
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    0.75x (Chậm)
                  </button>
                  <button
                    type="button"
                    onClick={() => changeSpeechRate(1.0)}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      speechRate === 1.0
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    1.0x (Chuẩn)
                  </button>
                </div>

                {/* Tùy chọn Tự động phát âm */}
                <button
                  type="button"
                  onClick={toggleAutoPlay}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border transition ${
                    autoPlay
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                  }`}
                  title="Tự động phát giọng đọc mỗi khi bấm mở đáp án"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${autoPlay ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Tự động đọc: {autoPlay ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-20" /> // Giữ khung height cố định không bị nhảy layout
          )}

          {/* Nút thao tác Xem đáp án / Câu tiếp theo */}
          <div className="pt-4 flex justify-center">
            {!showAnswer ? (
              <button
                onClick={handleRevealAnswer}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md transition flex items-center justify-center gap-2 text-base"
              >
                <Eye className="w-5 h-5" />
                <span>Xem đáp án</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-md transition flex items-center justify-center gap-2 text-base animate-fade-in"
              >
                <span>{currentIndex < totalQuestions - 1 ? 'Câu tiếp theo' : 'Hoàn thành bài tập'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: QUẢN LÝ DANH SÁCH CÂU HỎI TRONG BÀI TẬP          */}
      {/* ========================================================= */}
      {isQuestionsListOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header modal danh sách */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Các câu trong bài tập ({practiceSet.questions.length})
                  </h3>
                  <p className="text-xs text-slate-500">Xem, chỉnh sửa hoặc thêm câu mới vào bài luyện tập</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAddQuestion();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuestionsListOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Danh sách câu hỏi cuộn được */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
              {practiceSet.questions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Chưa có câu nào. Nhấn &quot;Thêm câu mới&quot; để bổ sung câu hỏi.
                </div>
              ) : (
                practiceSet.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`pt-3 first:pt-0 pb-3 flex items-start justify-between gap-3 group transition ${
                      idx === currentIndex ? 'bg-indigo-50/40 p-3 rounded-xl border border-indigo-100' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-chinese text-lg font-bold text-slate-900 tracking-wide break-words">
                            {q.chinese}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSpeak(q.chinese)}
                            className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition flex-shrink-0"
                            title="Nghe phát âm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-indigo-600 font-medium break-words">
                          {q.pinyin}
                        </p>
                        <p className="text-xs text-slate-600 break-words">
                          {q.vietnamese}
                        </p>
                      </div>
                    </div>

                    {/* Nút hành động cho câu này */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleJumpToQuestion(idx)}
                        title="Luyện ngay câu này"
                        className="px-2 py-1 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">Luyện</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditQuestion(q)}
                        title="Chỉnh sửa câu này"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Xóa câu này"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer modal danh sách */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0 text-xs text-slate-500">
              <span>Tổng cộng {practiceSet.questions.length} câu</span>
              <button
                type="button"
                onClick={() => setIsQuestionsListOpen(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: THÊM CÂU MỚI HOẶC CHỈNH SỬA CÂU HỎI             */}
      {/* ========================================================= */}
      {questionModalMode !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  {questionModalMode === 'create' ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {questionModalMode === 'create' ? 'Thêm câu tiếng Trung mới' : 'Chỉnh sửa câu hỏi'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhập câu chữ Hán, hệ thống sẽ tự động tạo Pinyin và dịch nghĩa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseQuestionModal}
                disabled={savingQuestion || isAutoGenerating}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
              {questionFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{questionFormError}</span>
                </div>
              )}

              {/* Ô nhập câu tiếng Trung */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Câu tiếng Trung (Chữ Hán) <span className="text-rose-500">*</span>
                  </label>

                  {/* Nút tự động sinh AI */}
                  <button
                    type="button"
                    onClick={handleAutoGenerateInfo}
                    disabled={isAutoGenerating || !questionChinese.trim()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white shadow-xs transition"
                    title="Tự động tạo Pinyin và dịch sang Tiếng Việt bằng AI"
                  >
                    {isAutoGenerating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang phân tích...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-200" />
                        <span>Tự gen Pinyin & Dịch</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={questionChinese}
                  onChange={(e) => setQuestionChinese(e.target.value)}
                  placeholder="Ví dụ: 我每天都努力学习中文。"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-chinese focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
              </div>

              {/* Ô Pinyin */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Phiên âm Pinyin
                </label>
                <input
                  type="text"
                  value={questionPinyin}
                  onChange={(e) => setQuestionPinyin(e.target.value)}
                  placeholder="Ví dụ: wǒ měi tiān dōu nǔ lì xué xí zhōng wén 。"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <p className="text-[11px] text-slate-400">
                  Tự động sinh từ chữ Hán hoặc bạn có thể chỉnh tay thanh điệu theo ý muốn.
                </p>
              </div>

              {/* Ô câu tiếng Việt */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nghĩa / Câu tiếng Việt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={questionVietnamese}
                  onChange={(e) => setQuestionVietnamese(e.target.value)}
                  placeholder="Ví dụ: Mỗi ngày tôi đều chăm chỉ học tiếng Trung."
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
                <p className="text-[11px] text-slate-400">
                  Câu hỏi tiếng Việt hiển thị để người học tự luyện viết tay ra giấy.
                </p>
              </div>

              {/* Xem trước nhanh câu hỏi */}
              {questionChinese && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Xem trước thẻ:</span>
                  <p className="text-slate-800 font-medium">{questionVietnamese || '(Chưa có câu tiếng Việt)'}</p>
                  <p className="font-chinese text-base font-bold text-indigo-700">{questionChinese}</p>
                  {questionPinyin && <p className="text-slate-500">{questionPinyin}</p>}
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseQuestionModal}
                  disabled={savingQuestion || isAutoGenerating}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={savingQuestion || isAutoGenerating}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition shadow-sm"
                >
                  {savingQuestion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{questionModalMode === 'create' ? 'Thêm vào bài tập' : 'Lưu thay đổi'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CHỈNH SỬA TIÊU ĐỀ & MÔ TẢ BÀI TẬP                */}
      {/* ========================================================= */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Chỉnh sửa bài luyện tập</h3>
                  <p className="text-xs text-slate-500">Cập nhật tiêu đề và mô tả của bài tập này</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={savingEdit}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {editError}
                </div>
              )}

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
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mô tả ngắn nội dung bài tập
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ví dụ: Luyện viết các câu hỏi mua sắm, giá cả, và cấu trúc câu..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={savingEdit}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition shadow-sm"
                >
                  {savingEdit ? (
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
