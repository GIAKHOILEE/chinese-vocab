'use client';

import { useEffect, useMemo, useState } from 'react';
import { speakChinese, speakEnglish } from '@/lib/speech';
import { Gamepad2, Volume2, RotateCcw, Trophy, Zap, CheckCircle2, XCircle } from 'lucide-react';

export interface GameWord {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string; // pinyin hoặc IPA
  level?: string;
}

interface VocabGamesProps {
  language: 'zh' | 'en';
  words: GameWord[];
  levels: string[];
  selectedLevel: string;
  onLevelChange: (lv: string) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function VocabGames({
  language,
  words,
  levels,
  selectedLevel,
  onLevelChange,
}: VocabGamesProps) {
  const [mode, setMode] = useState<'match' | 'quiz' | 'dictation'>('match');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const speak = (text: string) => {
    if (language === 'zh') speakChinese(text);
    else speakEnglish(text);
  };

  const accentBtn = language === 'zh' ? 'clay-btn-peach' : 'clay-btn-sage';
  const accentText = language === 'zh' ? 'text-peach-600' : 'text-sage-600';
  const accentSelectedTile =
    language === 'zh'
      ? 'bg-gradient-to-b from-peach-400 to-peach-500 text-linen-50 border-peach-300/50 shadow-clay-peach'
      : 'bg-gradient-to-b from-sage-400 to-sage-500 text-linen-50 border-sage-300/50 shadow-clay-sage';

  // ==================== GAME 1: NỐI CẶP TỪ (MATCH PAIRS) ====================
  const [matchRound, setMatchRound] = useState(0);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);

  const matchPool = useMemo(() => shuffle(words).slice(0, 6), [words, matchRound]);
  const leftTiles = useMemo(() => shuffle(matchPool), [matchPool]);
  const rightTiles = useMemo(() => shuffle(matchPool), [matchPool]);

  function handleSelectLeft(id: string, word: string) {
    if (matchedIds.has(id)) return;
    setSelectedLeft(id);
    speak(word);
  }

  function handleSelectRight(id: string) {
    if (!selectedLeft || matchedIds.has(id)) return;
    if (selectedLeft === id) {
      setMatchedIds((prev) => new Set(prev).add(id));
      setScore((s) => s + 10 + streak * 2);
      setStreak((st) => st + 1);
      setSelectedLeft(null);
    } else {
      setStreak(0);
      setWrongFlash(id);
      setTimeout(() => setWrongFlash(null), 450);
      setSelectedLeft(null);
    }
  }

  function resetMatch() {
    setMatchedIds(new Set());
    setSelectedLeft(null);
    setMatchRound((r) => r + 1);
  }

  // ==================== GAME 2: PHẢN XẠ 4 ĐÁP ÁN (SPEED QUIZ) ====================
  const [quizRound, setQuizRound] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<{ chosenId: string; correct: boolean } | null>(null);

  const quizQuestions = useMemo(() => {
    if (words.length < 4) return [];
    const targets = shuffle(words).slice(0, 10);
    return targets.map((target) => {
      const distractors = shuffle(words.filter((w) => w.id !== target.id)).slice(0, 3);
      return {
        target,
        options: shuffle([target, ...distractors]),
      };
    });
  }, [words, quizRound]);

  const currentQuiz = quizQuestions[quizIdx];

  function handleQuizAnswer(optionId: string) {
    if (!currentQuiz || quizFeedback) return;
    const correct = optionId === currentQuiz.target.id;
    setQuizFeedback({ chosenId: optionId, correct });
    speak(currentQuiz.target.word);
    if (correct) {
      setScore((s) => s + 10 + streak * 2);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setQuizFeedback(null);
      if (quizIdx < quizQuestions.length - 1) {
        setQuizIdx((i) => i + 1);
      } else {
        setQuizIdx(0);
        setQuizRound((r) => r + 1);
      }
    }, 900);
  }

  // ==================== GAME 3: NGHE & GÕ LẠI TỪ (DICTATION) ====================
  const [dictIdx, setDictIdx] = useState(0);
  const [dictRound, setDictRound] = useState(0);
  const [dictInput, setDictInput] = useState('');
  const [dictResult, setDictResult] = useState<'correct' | 'wrong' | null>(null);

  const dictPool = useMemo(() => shuffle(words).slice(0, 10), [words, dictRound]);
  const currentDict = dictPool[dictIdx];

  useEffect(() => {
    setDictInput('');
    setDictResult(null);
  }, [dictIdx, dictRound]);

  function checkDictation() {
    if (!currentDict || !dictInput.trim()) return;
    const isOk = dictInput.trim().toLowerCase() === currentDict.word.trim().toLowerCase();
    setDictResult(isOk ? 'correct' : 'wrong');
    if (isOk) {
      setScore((s) => s + 15 + streak * 3);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
    }
  }

  function nextDictation() {
    if (dictIdx < dictPool.length - 1) {
      setDictIdx((i) => i + 1);
    } else {
      setDictIdx(0);
      setDictRound((r) => r + 1);
    }
  }

  if (words.length < 4) {
    return (
      <div className="clay-card p-10 text-center text-cocoa-500 font-semibold max-w-2xl mx-auto">
        Cần ít nhất 4 từ vựng ở cấp độ này để bắt đầu chơi Mini-Game.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header & Scoreboard Bento */}
      <div className="clay-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-cocoa-900 flex items-center gap-2.5">
              <span
                className={`w-10 h-10 rounded-[16px] flex items-center justify-center shadow-clay-sm ${
                  language === 'zh'
                    ? 'bg-peach-100 text-peach-600 border border-peach-200/70'
                    : 'bg-sage-100 text-sage-600 border border-sage-200/70'
                }`}
              >
                <Gamepad2 className="w-5 h-5" />
              </span>
              <span>
                Mini-Game Nhớ Từ Vựng ({language === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-cocoa-500 mt-1.5">
              Chơi nhanh 5–10 phút mỗi ngày để phản xạ mặt chữ, âm thanh và nghĩa tiếng Việt cực nhạy.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-4 py-2 rounded-[20px] bg-honey-100/90 border border-honey-200/80 text-honey-700 text-xs font-extrabold flex items-center gap-1.5 shadow-clay-sm">
              <Trophy className="w-4 h-4 text-honey-500" />
              <span>{score} điểm</span>
            </div>
            <div className="px-4 py-2 rounded-[20px] bg-peach-100/90 border border-peach-200/80 text-peach-700 text-xs font-extrabold flex items-center gap-1.5 shadow-clay-sm">
              <Zap className="w-4 h-4 text-peach-500" />
              <span>Combo x{streak}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-cocoa-400/15">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'match', label: '1. Nối cặp từ (6 cặp)' },
              { id: 'quiz', label: '2. Phản xạ 4 đáp án' },
              { id: 'dictation', label: '3. Nghe & Gõ lại từ' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`px-4 py-2 rounded-[18px] text-xs font-bold transition ${
                  mode === m.id ? accentBtn : 'clay-btn-cream'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-cocoa-500 font-bold mr-1">Cấp độ:</span>
            {levels.map((lv) => (
              <button
                key={lv}
                onClick={() => onLevelChange(lv)}
                className={`px-3 py-1.5 rounded-[14px] text-xs font-bold transition ${
                  selectedLevel === lv
                    ? 'bg-cocoa-800 text-linen-50 shadow-clay-dark'
                    : 'bg-linen-200/80 text-cocoa-600 hover:bg-linen-300/80'
                }`}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GAME 1: NỐI CẶP TỪ */}
      {mode === 'match' && (
        <div className="clay-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm font-bold text-cocoa-700">
              Chọn 1 từ bên trái rồi chọn nghĩa tương ứng bên phải ({matchedIds.size}/{matchPool.length} cặp)
            </div>
            <button
              onClick={resetMatch}
              className="clay-btn-cream inline-flex items-center gap-1.5 px-4 py-2 text-xs self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đổi bộ từ mới</span>
            </button>
          </div>

          {matchedIds.size === matchPool.length ? (
            <div className="py-12 text-center space-y-4">
              <div className="text-2xl font-extrabold text-sage-600">Hoàn thành xuất sắc! 🎉</div>
              <button
                onClick={resetMatch}
                className={`px-6 py-3 text-sm ${accentBtn}`}
              >
                Chơi ván tiếp theo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-3">
                {leftTiles.map((item) => {
                  const matched = matchedIds.has(item.id);
                  const selected = selectedLeft === item.id;
                  return (
                    <button
                      key={item.id}
                      disabled={matched}
                      onClick={() => handleSelectLeft(item.id, item.word)}
                      className={`w-full p-4 rounded-[24px] border text-left transition-all duration-200 ${
                        matched
                          ? 'bg-sage-50/70 border-sage-200/60 text-sage-400 opacity-55 shadow-none'
                          : selected
                            ? `${accentSelectedTile} -translate-y-0.5`
                            : 'bg-linen-100/90 hover:bg-linen-50 border-cocoa-400/20 text-cocoa-900 shadow-clay-sm hover:-translate-y-0.5'
                      }`}
                    >
                      <div className={`font-extrabold text-lg ${language === 'zh' ? 'font-chinese text-xl' : ''}`}>
                        {item.word}
                      </div>
                      {item.phonetic && (
                        <div className={`text-xs mt-0.5 font-medium ${selected ? 'text-linen-50/85' : 'text-cocoa-500'}`}>
                          {item.phonetic}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {rightTiles.map((item) => {
                  const matched = matchedIds.has(item.id);
                  const isWrong = wrongFlash === item.id;
                  return (
                    <button
                      key={item.id}
                      disabled={matched}
                      onClick={() => handleSelectRight(item.id)}
                      className={`w-full p-4 rounded-[24px] border text-left transition-all duration-200 flex items-center min-h-[74px] ${
                        matched
                          ? 'bg-sage-50/70 border-sage-200/60 text-sage-400 opacity-55 shadow-none'
                          : isWrong
                            ? 'bg-berry-100 border-berry-500/50 text-berry-700 shadow-clay-sm'
                            : 'bg-linen-50/95 hover:bg-peach-50/60 border-cocoa-400/20 text-cocoa-800 shadow-clay-sm hover:-translate-y-0.5'
                      }`}
                    >
                      <span className="text-sm font-bold">{item.meaning}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GAME 2: PHẢN XẠ 4 ĐÁP ÁN */}
      {mode === 'quiz' && currentQuiz && (
        <div className="clay-card p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-cocoa-500 font-bold">
            <span className="px-3 py-1 rounded-full bg-linen-200/80 text-cocoa-700">
              Câu {quizIdx + 1} / {quizQuestions.length}
            </span>
            <button
              onClick={() => speak(currentQuiz.target.word)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linen-100 border border-cocoa-400/15 shadow-clay-sm ${accentText}`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Nghe gợi ý</span>
            </button>
          </div>

          <div className="clay-inset py-7 px-5 text-center space-y-2">
            <div className="text-xs text-cocoa-400 font-bold uppercase tracking-wider">
              Chọn từ đúng với nghĩa sau
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cocoa-900">
              {currentQuiz.target.meaning}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQuiz.options.map((opt) => {
              const isChosen = quizFeedback?.chosenId === opt.id;
              const isTarget = opt.id === currentQuiz.target.id;
              let btnClass =
                'bg-linen-50/95 hover:bg-peach-50/60 border-cocoa-400/20 text-cocoa-900 shadow-clay-sm hover:-translate-y-0.5';
              if (quizFeedback) {
                if (isTarget)
                  btnClass = 'bg-sage-100 border-sage-400 text-sage-800 shadow-clay-sm';
                else if (isChosen && !quizFeedback.correct)
                  btnClass = 'bg-berry-100 border-berry-500/50 text-berry-700 shadow-clay-sm';
              }
              return (
                <button
                  key={opt.id}
                  onClick={() => handleQuizAnswer(opt.id)}
                  className={`p-5 rounded-[24px] border text-center transition-all duration-200 ${btnClass}`}
                >
                  <div className={`text-xl font-extrabold ${language === 'zh' ? 'font-chinese text-2xl' : ''}`}>
                    {opt.word}
                  </div>
                  {quizFeedback && opt.phonetic && (
                    <div className="text-xs text-cocoa-600 font-semibold mt-1">{opt.phonetic}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* GAME 3: NGHE & GÕ LẠI TỪ */}
      {mode === 'dictation' && currentDict && (
        <div className="clay-card p-6 sm:p-8 space-y-6 max-w-xl mx-auto text-center">
          <div className="flex items-center justify-between text-xs text-cocoa-500 font-bold">
            <span className="px-3 py-1 rounded-full bg-linen-200/80 text-cocoa-700">
              Từ {dictIdx + 1} / {dictPool.length}
            </span>
            <span className="px-3 py-1 rounded-full bg-peach-100 text-peach-700">
              {currentDict.level || selectedLevel}
            </span>
          </div>

          <div className="clay-inset p-6 space-y-3">
            <button
              onClick={() => speak(currentDict.word)}
              className={`mx-auto w-16 h-16 rounded-full ${accentBtn} flex items-center justify-center`}
            >
              <Volume2 className="w-7 h-7" />
            </button>
            <div className="text-2xl font-extrabold text-cocoa-900 pt-1">{currentDict.meaning}</div>
            {currentDict.phonetic && (
              <div className="text-sm text-cocoa-500 font-semibold">
                Gợi ý phát âm: {currentDict.phonetic}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={dictInput}
              onChange={(e) => setDictInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (dictResult ? nextDictation() : checkDictation())}
              placeholder={language === 'zh' ? 'Gõ chữ Hán...' : 'Gõ từ tiếng Anh...'}
              className={`flex-1 px-4 py-3 text-center text-lg font-bold ${
                language === 'zh' ? 'clay-input font-chinese' : 'clay-input-sage'
              }`}
            />
            {!dictResult ? (
              <button
                onClick={checkDictation}
                className={`px-6 py-3 text-sm ${accentBtn}`}
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={nextDictation}
                className="clay-btn-dark px-6 py-3 text-sm"
              >
                Tiếp theo
              </button>
            )}
          </div>

          {dictResult && (
            <div
              className={`p-3.5 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 border ${
                dictResult === 'correct'
                  ? 'bg-sage-100/90 border-sage-300/60 text-sage-800'
                  : 'bg-berry-100/90 border-berry-200 text-berry-700'
              }`}
            >
              {dictResult === 'correct' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Chính xác! {currentDict.word}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Đáp án đúng là: {currentDict.word}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
