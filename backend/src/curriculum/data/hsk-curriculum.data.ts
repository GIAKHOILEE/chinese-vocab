import rawHskVocab from './hsk-vocab.data.json';

export interface HskVocabSeed {
  word: string;
  meaning: string;
  pinyin: string;
  partOfSpeech: string;
  level: 'HSK1' | 'HSK2' | 'HSK3';
  topic: string;
}

export const HSK_VOCAB_DATA: HskVocabSeed[] = rawHskVocab as HskVocabSeed[];
