'use client';

import { useEffect, useState } from 'react';
import { fetchApiCached, getCachedApi } from '@/lib/api';
import { CardListSkeleton, SyncingPill } from '@/components/LoadingPrimitives';
import VocabGames, { GameWord } from '@/components/VocabGames';

export default function EnglishGamesPage() {
  const [words, setWords] = useState<GameWord[]>([]);
  const [level, setLevel] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lite: 'true', random: 'true', limit: '120' });
    if (level !== 'ALL') params.set('level', level);
    const endpoint = `/english/vocab?${params.toString()}`;

    const mapRows = (rows: any[]): GameWord[] =>
      (rows || []).map((r) => ({
        id: r.id,
        word: r.word,
        meaning: r.meaning,
        phonetic: r.ipa || '',
        level: r.cefrLevel || '',
      }));

    const cached = getCachedApi<any[]>(endpoint);
    if (cached) {
      setWords(mapRows(cached));
      setLoading(false);
      setSyncing(true);
    } else if (words.length === 0) {
      setLoading(true);
    } else {
      setSyncing(true);
    }

    fetchApiCached<any[]>(endpoint, { signal: controller.signal })
      .then((rows) => {
        setWords(mapRows(rows));
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSyncing(false);
        }
      });

    return () => controller.abort();
  }, [level]);

  if (loading && words.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <CardListSkeleton count={4} label="Đang tải từ vựng trò chơi..." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {syncing && (
        <div className="max-w-5xl mx-auto flex justify-end">
          <SyncingPill syncing={syncing} tone="sage" label="Đang làm mới từ vựng..." />
        </div>
      )}
      <VocabGames
        language="en"
        words={words}
        levels={['ALL', 'A1', 'A2', 'B1', 'B2']}
        selectedLevel={level}
        onLevelChange={setLevel}
      />
    </div>
  );
}
