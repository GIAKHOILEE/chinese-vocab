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
  const [speechRate, setSpeechRate] = useState(0.85);
  const [autoPlay, setAutoPlay] = useState(true);

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

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

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

  const handleRevealAnswer = useCallback(() => {
    setShowAnswer(true);
    const chineseSentence = practiceSet?.questions[currentIndex]?.chinese;
    if (autoPlay && chineseSentence) {
      handleSpeak(chineseSentence);
    }
  }, [autoPlay, practiceSet, currentIndex, handleSpeak]);

  const handleRestart = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsCompleted(false);
  };

  const handleOpenEdit = () => {
    if (!practiceSet) return;
    setEditTitle(practiceSet.title);
    setEditDescription(practiceSet.description || '');
    setEditError('');
    setIsEditing(true);
  };

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

  const handleOpenAddQuestion = () => {
    setQuestionModalMode('create');
    setEditingQuestion(null);
    setQuestionChinese('');
    setQuestionPinyin('');
    setQuestionVietnamese('');
    setQuestionFormError('');
  };

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

  const handleJumpToQuestion = (index: number) => {
    stopSpeaking();
    setIsSpeaking(false);
    setCurrentIndex(index);
    setShowAnswer(false);
    setIsCompleted(false);
    setIsQuestionsListOpen(false);
  };

  const isAnyModalOpen = isEditing || isQuestionsListOpen || questionModalMode !== null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        <div className="clay-card px-8 py-6 text-cocoa-600 text-sm font-bold flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 animate-spin text-peach-500" />
          <span>Đang tải bài tập...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !practiceSet) {
    return (
      <div className="max-w-md mx-auto my-12 clay-card p-8 text-center space-y-4">
        <p className="text-berry-700 text-sm font-bold">{errorMsg || 'Bài tập không tồn tại'}</p>
        <button
          onClick={() => router.push('/practice')}
          className="clay-btn-cream px-5 py-2.5 text-sm"
        >
          Quay lại Lịch sử
        </button>
      </div>
    );
  }

  const currentQuestion = practiceSet.questions[currentIndex];
  const totalQuestions = practiceSet.questions.length;

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6 pb-12">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 px-5 py-3 rounded-[22px] shadow-clay-sage border border-sage-300/40 flex items-center gap-2 text-sm font-bold animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Thanh Header Điều hướng */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/practice')}
          className="clay-btn-cream inline-flex items-center gap-1.5 px-3.5 py-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách bài tập</span>
        </button>

        <span className="text-xs font-extrabold px-3.5 py-1.5 bg-peach-100 text-peach-700 rounded-full border border-peach-200/70 shadow-clay-sm">
          {practiceSet.difficulty}
        </span>
      </div>

      {/* Thông tin Tiêu đề & Quản lý bài tập */}
      <div className="clay-card p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-extrabold text-cocoa-900">{practiceSet.title}</h1>
            {practiceSet.description ? (
              <p className="text-xs text-cocoa-500 flex items-start gap-1.5 leading-relaxed">
                <FileText className="w-3.5 h-3.5 text-peach-500 flex-shrink-0 mt-0.5" />
                <span>{practiceSet.description}</span>
              </p>
            ) : (
              <button
                onClick={handleOpenEdit}
                className="text-xs text-cocoa-400 italic hover:text-peach-600 transition font-semibold"
              >
                + Thêm mô tả ngắn để ghi nhớ nội dung bài này...
              </button>
            )}
          </div>

          {/* Các nút thao tác Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsQuestionsListOpen(true)}
              className="clay-btn-cream inline-flex items-center gap-1.5 px-3.5 py-2 text-xs"
              title="Xem và quản lý tất cả các câu trong bài tập này"
            >
              <Layers className="w-3.5 h-3.5 text-peach-600" />
              <span>Danh sách câu ({totalQuestions})</span>
            </button>

            <button
              onClick={handleOpenAddQuestion}
              className="clay-btn-peach inline-flex items-center gap-1.5 px-3.5 py-2 text-xs"
              title="Thêm một câu tiếng Trung mới vào bài tập"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu mới</span>
            </button>

            <button
              onClick={handleOpenEdit}
              title="Chỉnh sửa tiêu đề & mô tả bài tập"
              className="p-2 text-cocoa-400 hover:text-peach-600 hover:bg-peach-100/70 rounded-full transition"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trường hợp bài tập chưa có câu hỏi nào */}
      {totalQuestions === 0 ? (
        <div className="clay-card p-10 border-dashed text-center space-y-4">
          <div className="w-14 h-14 rounded-[22px] bg-peach-100 text-peach-600 border border-peach-200/70 shadow-clay-sm flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-cocoa-900 text-base">Bài tập này chưa có câu nào</h3>
            <p className="text-cocoa-500 text-xs">
              Bạn có thể thêm câu tiếng Trung mới để luyện viết ngay bây giờ.
            </p>
          </div>
          <button
            onClick={handleOpenAddQuestion}
            className="clay-btn-peach inline-flex items-center gap-2 px-5 py-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu đầu tiên</span>
          </button>
        </div>
      ) : isCompleted ? (
        /* Màn hình hoàn thành bài tập */
        <div className="clay-card-sage p-8 sm:p-12 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-linen-50 text-sage-600 rounded-[24px] border border-sage-200/80 shadow-clay-sm flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-cocoa-900">Hoàn thành bài tập!</h2>
            <p className="text-cocoa-600 text-sm">
              Bạn đã hoàn thành viết tay toàn bộ {totalQuestions} câu tiếng Trung.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={handleRestart}
              className="clay-btn-cream flex items-center gap-2 px-5 py-3 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện lại bộ câu này</span>
            </button>
            <button
              onClick={() => setIsQuestionsListOpen(true)}
              className="clay-btn-cream flex items-center gap-2 px-5 py-3 text-sm text-peach-700"
            >
              <Layers className="w-4 h-4" />
              <span>Xem danh sách câu</span>
            </button>
            <button
              onClick={() => router.push('/practice/new')}
              className="clay-btn-peach flex items-center gap-2 px-5 py-3 text-sm"
            >
              <span>Tạo bài mới</span>
            </button>
          </div>
        </div>
      ) : (
        /* Thẻ hiển thị câu hỏi luyện viết chính */
        <div className="clay-card p-6 sm:p-10 space-y-8 min-h-[400px] flex flex-col justify-between transition-all">
          {/* Tiến trình: Câu X / Y + Nút sửa câu hiện tại */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-cocoa-400 text-sm font-bold">
            <div className="flex items-center gap-2.5">
              <span className="px-3.5 py-1 rounded-full bg-linen-200/85 text-cocoa-800 text-xs font-extrabold">
                Câu {currentIndex + 1} / {totalQuestions}
              </span>
              {currentQuestion && (
                <button
                  type="button"
                  onClick={() => handleOpenEditQuestion(currentQuestion)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-linen-100 hover:bg-peach-100 text-cocoa-600 hover:text-peach-700 border border-cocoa-400/15 transition"
                  title="Chỉnh sửa câu này (chữ Hán, Pinyin, nghĩa)"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Sửa câu</span>
                </button>
              )}
            </div>

            <span className="text-xs hidden sm:inline text-cocoa-400 font-semibold">
              [Phím tắt: <code className="bg-linen-200 px-1.5 py-0.5 rounded-md text-cocoa-700">Space</code> = Xem/Tiếp,{' '}
              <code className="bg-linen-200 px-1.5 py-0.5 rounded-md text-cocoa-700">➔</code> = Tiếp,{' '}
              <code className="bg-linen-200 px-1.5 py-0.5 rounded-md text-cocoa-700">A</code> = Phát âm]
            </span>
          </div>

          {/* Nội dung câu Tiếng Việt */}
          <div className="clay-inset text-center py-7 px-5 space-y-3">
            <p className="text-xl sm:text-2xl font-extrabold text-cocoa-900 leading-relaxed">
              {currentQuestion?.vietnamese}
            </p>
            <p className="text-xs text-cocoa-500 font-semibold">
              Tự viết câu tiếng Trung ra giấy trước khi xem đáp án
            </p>
          </div>

          {/* Khối ĐÁP ÁN tiếng Trung và Pinyin */}
          {showAnswer ? (
            <div className="space-y-4 border-t border-cocoa-400/15 pt-6 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-3">
                <div className="font-chinese font-bold text-3xl sm:text-4xl text-cocoa-900 tracking-wide">
                  {currentQuestion?.chinese}
                </div>
                <button
                  type="button"
                  onClick={() => handleSpeak(currentQuestion?.chinese)}
                  title="Nghe phát âm (Phím A)"
                  className={`p-3 rounded-full transition ${
                    isSpeaking
                      ? 'bg-peach-500 text-linen-50 ring-4 ring-peach-200 animate-pulse shadow-clay-peach'
                      : 'bg-peach-100 text-peach-600 hover:bg-peach-200/80 shadow-clay-sm hover:scale-105 active:scale-95'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="font-sans text-peach-700 text-base sm:text-lg font-bold">
                {currentQuestion?.pinyin}
              </div>

              {/* Bảng điều khiển tốc độ & tự động đọc */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
                <div className="inline-flex items-center bg-linen-200/80 p-1 rounded-[16px] border border-cocoa-400/15 shadow-clay-inset">
                  <button
                    type="button"
                    onClick={() => changeSpeechRate(0.75)}
                    className={`px-3 py-1.5 rounded-[12px] font-bold transition ${
                      speechRate === 0.75
                        ? 'bg-linen-50 text-peach-700 shadow-clay-sm'
                        : 'text-cocoa-500 hover:text-cocoa-800'
                    }`}
                  >
                    0.75x (Chậm)
                  </button>
                  <button
                    type="button"
                    onClick={() => changeSpeechRate(1.0)}
                    className={`px-3 py-1.5 rounded-[12px] font-bold transition ${
                      speechRate === 1.0
                        ? 'bg-linen-50 text-peach-700 shadow-clay-sm'
                        : 'text-cocoa-500 hover:text-cocoa-800'
                    }`}
                  >
                    1.0x (Chuẩn)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleAutoPlay}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[16px] border transition font-bold ${
                    autoPlay
                      ? 'bg-peach-100/90 border-peach-300/60 text-peach-700 shadow-clay-sm'
                      : 'bg-linen-100 border-cocoa-400/20 text-cocoa-400 hover:text-cocoa-600'
                  }`}
                  title="Tự động phát giọng đọc mỗi khi bấm mở đáp án"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${autoPlay ? 'text-peach-600' : 'text-cocoa-400'}`} />
                  <span>Tự động đọc: {autoPlay ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-16" />
          )}

          {/* Nút thao tác Xem đáp án / Câu tiếp theo */}
          <div className="pt-4 flex justify-center">
            {!showAnswer ? (
              <button
                onClick={handleRevealAnswer}
                className="w-full sm:w-auto px-9 py-4 clay-btn-peach flex items-center justify-center gap-2 text-base"
              >
                <Eye className="w-5 h-5" />
                <span>Xem đáp án</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full sm:w-auto px-9 py-4 clay-btn-sage flex items-center justify-center gap-2 text-base animate-fade-in"
              >
                <span>{currentIndex < totalQuestions - 1 ? 'Câu tiếp theo' : 'Hoàn thành bài tập'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: QUẢN LÝ DANH SÁCH CÂU HỎI TRONG BÀI TẬP */}
      {isQuestionsListOpen && (
        <div className="fixed inset-0 bg-cocoa-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="clay-modal max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-cocoa-400/15 bg-linen-100/80 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/60 shadow-clay-sm flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-cocoa-900 text-base">
                    Các câu trong bài tập ({practiceSet.questions.length})
                  </h3>
                  <p className="text-xs text-cocoa-500">
                    Xem, chỉnh sửa hoặc thêm câu mới vào bài luyện tập
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAddQuestion();
                  }}
                  className="clay-btn-peach flex items-center gap-1.5 px-3.5 py-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuestionsListOpen(false)}
                  className="text-cocoa-400 hover:text-cocoa-700 p-2 hover:bg-linen-200/80 rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-cocoa-400/15">
              {practiceSet.questions.length === 0 ? (
                <div className="text-center py-10 text-cocoa-400 text-xs font-semibold">
                  Chưa có câu nào. Nhấn &quot;Thêm câu mới&quot; để bổ sung câu hỏi.
                </div>
              ) : (
                practiceSet.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`pt-3 first:pt-0 pb-3 flex items-start justify-between gap-3 group transition ${
                      idx === currentIndex
                        ? 'bg-peach-50/80 p-3.5 rounded-[20px] border border-peach-200/70'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-linen-200 text-cocoa-700 text-xs font-extrabold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-chinese text-lg font-bold text-cocoa-900 tracking-wide break-words">
                            {q.chinese}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSpeak(q.chinese)}
                            className="p-1.5 text-peach-600 hover:bg-peach-100 rounded-full transition flex-shrink-0"
                            title="Nghe phát âm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-peach-600 font-bold break-words">{q.pinyin}</p>
                        <p className="text-xs text-cocoa-600 break-words">{q.vietnamese}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleJumpToQuestion(idx)}
                        title="Luyện ngay câu này"
                        className="px-2.5 py-1.5 text-xs text-cocoa-700 hover:text-sage-700 hover:bg-sage-100/80 rounded-[14px] font-bold transition flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-sage-600" />
                        <span className="hidden sm:inline">Luyện</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditQuestion(q)}
                        title="Chỉnh sửa câu này"
                        className="p-2 text-cocoa-400 hover:text-peach-600 hover:bg-peach-100/70 rounded-full transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Xóa câu này"
                        className="p-2 text-cocoa-400 hover:text-berry-700 hover:bg-berry-100/80 rounded-full transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-cocoa-400/15 bg-linen-100/80 flex items-center justify-between flex-shrink-0 text-xs text-cocoa-500 font-bold">
              <span>Tổng cộng {practiceSet.questions.length} câu</span>
              <button
                type="button"
                onClick={() => setIsQuestionsListOpen(false)}
                className="clay-btn-cream px-4 py-2 text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM CÂU MỚI HOẶC CHỈNH SỬA CÂU HỎI */}
      {questionModalMode !== null && (
        <div className="fixed inset-0 bg-cocoa-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="clay-modal max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-5 border-b border-cocoa-400/15 bg-linen-100/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/60 shadow-clay-sm flex items-center justify-center">
                  {questionModalMode === 'create' ? (
                    <Plus className="w-4 h-4" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-cocoa-900 text-base">
                    {questionModalMode === 'create' ? 'Thêm câu tiếng Trung mới' : 'Chỉnh sửa câu hỏi'}
                  </h3>
                  <p className="text-xs text-cocoa-500">
                    Nhập câu chữ Hán, hệ thống sẽ tự động tạo Pinyin và dịch nghĩa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseQuestionModal}
                disabled={savingQuestion || isAutoGenerating}
                className="text-cocoa-400 hover:text-cocoa-700 p-2 hover:bg-linen-200/80 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
              {questionFormError && (
                <div className="p-3.5 bg-berry-100 border border-berry-200 text-berry-700 rounded-[18px] text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-berry-500" />
                  <span>{questionFormError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-cocoa-700 uppercase tracking-wider">
                    Câu tiếng Trung (Chữ Hán) <span className="text-berry-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAutoGenerateInfo}
                    disabled={isAutoGenerating || !questionChinese.trim()}
                    className="clay-btn-sage inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    title="Tự động tạo Pinyin và dịch sang Tiếng Việt bằng AI"
                  >
                    {isAutoGenerating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang phân tích...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-honey-100" />
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
                  className="w-full clay-input px-4 py-2.5 text-base font-chinese resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-cocoa-700 uppercase tracking-wider">
                  Phiên âm Pinyin
                </label>
                <input
                  type="text"
                  value={questionPinyin}
                  onChange={(e) => setQuestionPinyin(e.target.value)}
                  placeholder="Ví dụ: wǒ měi tiān dōu nǔ lì xué xí zhōng wén 。"
                  className="w-full clay-input px-4 py-2.5 text-sm"
                />
                <p className="text-[11px] text-cocoa-400">
                  Tự động sinh từ chữ Hán hoặc bạn có thể chỉnh tay thanh điệu theo ý muốn.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-cocoa-700 uppercase tracking-wider">
                  Nghĩa / Câu tiếng Việt <span className="text-berry-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={questionVietnamese}
                  onChange={(e) => setQuestionVietnamese(e.target.value)}
                  placeholder="Ví dụ: Mỗi ngày tôi đều chăm chỉ học tiếng Trung."
                  required
                  className="w-full clay-input px-4 py-2.5 text-sm resize-none"
                />
                <p className="text-[11px] text-cocoa-400">
                  Câu hỏi tiếng Việt hiển thị để người học tự luyện viết tay ra giấy.
                </p>
              </div>

              {questionChinese && (
                <div className="clay-inset p-3.5 space-y-1 text-xs">
                  <span className="text-cocoa-400 font-extrabold uppercase text-[10px] tracking-wider">
                    Xem trước thẻ:
                  </span>
                  <p className="text-cocoa-800 font-bold">
                    {questionVietnamese || '(Chưa có câu tiếng Việt)'}
                  </p>
                  <p className="font-chinese text-base font-bold text-peach-700">{questionChinese}</p>
                  {questionPinyin && <p className="text-cocoa-500">{questionPinyin}</p>}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cocoa-400/15">
                <button
                  type="button"
                  onClick={handleCloseQuestionModal}
                  disabled={savingQuestion || isAutoGenerating}
                  className="clay-btn-cream px-5 py-2.5 text-sm"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={savingQuestion || isAutoGenerating}
                  className="clay-btn-peach flex items-center gap-1.5 px-5 py-2.5 text-sm"
                >
                  {savingQuestion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {questionModalMode === 'create' ? 'Thêm vào bài tập' : 'Lưu thay đổi'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHỈNH SỬA TIÊU ĐỀ & MÔ TẢ BÀI TẬP */}
      {isEditing && (
        <div className="fixed inset-0 bg-cocoa-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="clay-modal max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-5 border-b border-cocoa-400/15 bg-linen-100/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[16px] bg-peach-100 text-peach-600 border border-peach-200/60 shadow-clay-sm flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-cocoa-900 text-base">Chỉnh sửa bài luyện tập</h3>
                  <p className="text-xs text-cocoa-500">Cập nhật tiêu đề và mô tả của bài tập này</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={savingEdit}
                className="text-cocoa-400 hover:text-cocoa-700 p-2 hover:bg-linen-200/80 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3.5 bg-berry-100 border border-berry-200 text-berry-700 rounded-[18px] text-xs font-bold">
                  {editError}
                </div>
              )}

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
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-cocoa-700 uppercase tracking-wider">
                  Mô tả ngắn nội dung bài tập
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ví dụ: Luyện viết các câu hỏi mua sắm, giá cả, và cấu trúc câu..."
                  className="w-full clay-input px-4 py-2.5 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cocoa-400/15">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={savingEdit}
                  className="clay-btn-cream px-5 py-2.5 text-sm"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="clay-btn-peach flex items-center gap-1.5 px-5 py-2.5 text-sm"
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
