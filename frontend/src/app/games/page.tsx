'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import VocabGames, { GameWord } from '@/components/VocabGames';

export default function ChineseGamesPage() {
  const [words, setWords] = useState<GameWord[]>([]);
  const [level, setLevel] = useState('HSK2');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = level === 'ALL' ? '' : `?level=${encodeURIComponent(level)}`;
    fetchApi<any[]>(`/vocabulary${qs}`)
      .then((rows) => {
        setWords(
          (rows || []).map((r) => ({
            id: r.id,
            word: r.word,
            meaning: r.meaning,
            phonetic: r.pinyin || '',
            level: r.level || '',
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [level]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="clay-card p-10 text-center text-cocoa-500 font-semibold">
          Đang tải từ vựng trò chơi...
        </div>
      </div>
    );
  }

  return (
    <VocabGames
      language="zh"
      words={words}
      levels={['ALL', 'HSK1', 'HSK2']}
      selectedLevel={level}
      onLevelChange={setLevel}
    />
  );
}
