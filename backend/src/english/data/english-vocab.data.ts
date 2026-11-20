import rawEnglishVocab from './english-vocab.data.json';

export interface EnglishVocabSeed {
  word: string;
  ipa: string;
  meaning: string;
  partOfSpeech: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  topic: string;
  exampleEn: string;
  exampleVi: string;
}

export const ENGLISH_VOCAB_DATA: EnglishVocabSeed[] = rawEnglishVocab as EnglishVocabSeed[];
