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

  const accentBg = language === 'zh' ? 'bg-indigo-600' : 'bg-emerald-600';
  const accentText = language === 'zh' ? 'text-indigo-700' : 'text-emerald-700';

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
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Cần ít nhất 4 từ vựng ở cấp độ này để bắt đầu chơi Mini-Game.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header & Scoreboard */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Gamepad2 className={`w-6 h-6 ${accentText}`} />
              <span>
                Mini-Game Nhớ Từ Vựng ({language === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Chơi nhanh 5–10 phút mỗi ngày để phản xạ mặt chữ, âm thanh và nghĩa tiếng Việt cực nhạy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{score} điểm</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-rose-500" />
              <span>Combo x{streak}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex gap-1.5 flex-wrap">
            {[
              { id: 'match', label: '1. Nối cặp từ (6 cặp)' },
              { id: 'quiz', label: '2. Phản xạ 4 đáp án' },
              { id: 'dictation', label: '3. Nghe & Gõ lại từ' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mode === m.id ? `${accentBg} text-white` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Cấp độ:</span>
            {levels.map((lv) => (
              <button
                key={lv}
                onClick={() => onLevelChange(lv)}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedLevel === lv ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">
              Chọn 1 từ bên trái rồi chọn nghĩa tương ứng bên phải ({matchedIds.size}/{matchPool.length} cặp)
            </div>
            <button
              onClick={resetMatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đổi bộ từ mới</span>
            </button>
          </div>

          {matchedIds.size === matchPool.length ? (
            <div className="py-10 text-center space-y-3">
              <div className="text-2xl font-bold text-emerald-600">Hoàn thành xuất sắc! 🎉</div>
              <button
                onClick={resetMatch}
                className={`px-5 py-2.5 rounded-lg ${accentBg} text-white text-sm font-semibold`}
              >
                Chơi ván tiếp theo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                {leftTiles.map((item) => {
                  const matched = matchedIds.has(item.id);
                  const selected = selectedLeft === item.id;
                  return (
                    <button
                      key={item.id}
                      disabled={matched}
                      onClick={() => handleSelectLeft(item.id, item.word)}
                      className={`w-full p-3.5 rounded-xl border text-left transition ${
                        matched
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-400 opacity-50'
                          : selected
                            ? `${accentBg} text-white border-transparent shadow-sm`
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="font-bold text-lg">{item.word}</div>
                      {item.phonetic && (
                        <div className={`text-xs ${selected ? 'text-white/80' : 'text-slate-500'}`}>
                          {item.phonetic}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {rightTiles.map((item) => {
                  const matched = matchedIds.has(item.id);
                  const isWrong = wrongFlash === item.id;
                  return (
                    <button
                      key={item.id}
                      disabled={matched}
                      onClick={() => handleSelectRight(item.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition flex items-center min-h-[64px] ${
                        matched
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-400 opacity-50'
                          : isWrong
                            ? 'bg-rose-100 border-rose-400 text-rose-800'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <span className="text-sm font-medium">{item.meaning}</span>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Câu {quizIdx + 1} / {quizQuestions.length}</span>
            <button onClick={() => speak(currentQuiz.target.word)} className={`inline-flex items-center gap-1 ${accentText}`}>
              <Volume2 className="w-4 h-4" />
              <span>Nghe gợi ý</span>
            </button>
          </div>

          <div className="text-center py-4 space-y-1">
            <div className="text-xs text-slate-400 uppercase">Chọn từ đúng với nghĩa sau</div>
            <div className="text-2xl font-bold text-slate-900">{currentQuiz.target.meaning}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuiz.options.map((opt) => {
              const isChosen = quizFeedback?.chosenId === opt.id;
              const isTarget = opt.id === currentQuiz.target.id;
              let btnClass = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900';
              if (quizFeedback) {
                if (isTarget) btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-900';
                else if (isChosen && !quizFeedback.correct) btnClass = 'bg-rose-100 border-rose-400 text-rose-900';
              }
              return (
                <button
                  key={opt.id}
                  onClick={() => handleQuizAnswer(opt.id)}
                  className={`p-4 rounded-xl border text-center transition ${btnClass}`}
                >
                  <div className="text-xl font-bold">{opt.word}</div>
                  {quizFeedback && opt.phonetic && (
                    <div className="text-xs text-slate-600 mt-0.5">{opt.phonetic}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* GAME 3: NGHE & GÕ LẠI TỪ */}
      {mode === 'dictation' && currentDict && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 max-w-xl mx-auto text-center">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Từ {dictIdx + 1} / {dictPool.length}</span>
            <span>{currentDict.level || selectedLevel}</span>
          </div>

          <div className="space-y-2 py-2">
            <button
              onClick={() => speak(currentDict.word)}
              className={`mx-auto w-14 h-14 rounded-full ${accentBg} text-white flex items-center justify-center shadow-sm hover:opacity-90`}
            >
              <Volume2 className="w-7 h-7" />
            </button>
            <div className="text-xl font-bold text-slate-900 pt-2">{currentDict.meaning}</div>
            {currentDict.phonetic && (
              <div className="text-sm text-slate-500">Gợi ý phát âm: {currentDict.phonetic}</div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={dictInput}
              onChange={(e) => setDictInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (dictResult ? nextDictation() : checkDictation())}
              placeholder={language === 'zh' ? 'Gõ chữ Hán...' : 'Gõ từ tiếng Anh...'}
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {!dictResult ? (
              <button
                onClick={checkDictation}
                className={`px-5 py-2.5 rounded-lg ${accentBg} text-white text-sm font-semibold`}
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={nextDictation}
                className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold"
              >
                Tiếp theo
              </button>
            )}
          </div>

          {dictResult && (
            <div
              className={`p-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                dictResult === 'correct' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
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
