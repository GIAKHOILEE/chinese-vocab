import { Injectable } from '@nestjs/common';
import { ChineseTokenizerService } from './chinese-tokenizer.service';
import { BASIC_CHINESE_WORDS } from './basic-vocabulary.config';

export type VocabularyMode = 'STRICT' | 'BASIC' | 'FLEXIBLE';

export interface ValidationResult {
  isValid: boolean;
  unallowedWords: string[];
  tokens: string[];
}

@Injectable()
export class AiValidationService {
  constructor(private readonly tokenizerService: ChineseTokenizerService) {}

  /**
   * Kiểm tra một câu tiếng Trung có hợp lệ theo danh sách từ vựng đã học và VocabularyMode hay không.
   *
   * @param chineseSentence Câu tiếng Trung do AI sinh ra
   * @param knownVocabulary Danh sách từ vựng người dùng đã chọn/đã học (ví dụ: ["学习", "中文", "喜欢"])
   * @param mode Chế độ kiểm tra ('STRICT' | 'BASIC' | 'FLEXIBLE')
   */
  validateSentence(
    chineseSentence: string,
    knownVocabulary: string[],
    mode: VocabularyMode = 'STRICT',
  ): ValidationResult {
    // Chế độ FLEXIBLE bỏ qua kiểm tra nghiêm ngặt
    if (mode === 'FLEXIBLE') {
      return { isValid: true, unallowedWords: [], tokens: [] };
    }

    // Xây dựng tập hợp từ điển các từ được phép
    const allowedDict = new Set<string>();

    // 1. Thêm toàn bộ known vocabulary người dùng chọn
    knownVocabulary.forEach((word) => {
      if (word && word.trim()) {
        allowedDict.add(word.trim());
      }
    });

    // 2. Nếu ở STRICT hoặc BASIC mode, thêm danh sách BASIC_CHINESE_WORDS
    if (mode === 'STRICT' || mode === 'BASIC') {
      BASIC_CHINESE_WORDS.forEach((word) => allowedDict.add(word));
    }

    // 3. Tokenize câu tiếng Trung thành danh sách từ
    const tokens = this.tokenizerService.tokenize(chineseSentence, allowedDict);

    const unallowedWords: string[] = [];

    for (const token of tokens) {
      // Bỏ qua chữ số, dấu câu, chữ cái La-tinh
      if (/^[0-9a-zA-Z\s.,!?:;""''，。！？；：、（）]+$/.test(token)) {
        continue;
      }

      // Kiểm tra xem token có nằm trong dictionary được phép hay không
      if (!allowedDict.has(token)) {
        unallowedWords.push(token);
      }
    }

    const isValid = unallowedWords.length === 0;

    return {
      isValid,
      unallowedWords,
      tokens,
    };
  }
}
