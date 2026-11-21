'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import VocabGames, { GameWord } from '@/components/VocabGames';

export default function ChineseGamesPage() {
  const [words, setWords] = useState<GameWord[]>([]);
  const [level, setLevel] = useState('HSK2');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ lite: 'true', random: 'true', limit: '120' });
    if (level !== 'ALL') params.set('level', level);

    fetchApi<any[]>(`/vocabulary?${params.toString()}`, { signal: controller.signal })
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
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
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
      levels={['ALL', 'HSK1', 'HSK2', 'HSK3']}
      selectedLevel={level}
      onLevelChange={setLevel}
    />
  );
}
