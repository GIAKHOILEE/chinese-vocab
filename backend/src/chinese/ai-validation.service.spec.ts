import { AiValidationService } from './ai-validation.service';
import { ChineseTokenizerService } from './chinese-tokenizer.service';

describe('AiValidationService', () => {
  let validationService: AiValidationService;
  let tokenizerService: ChineseTokenizerService;

  beforeEach(() => {
    tokenizerService = new ChineseTokenizerService();
    validationService = new AiValidationService(tokenizerService);
  });

  it('nên PASS khi câu "我喜欢学习中文。" chỉ sử dụng từ đã học và hư từ cơ bản', () => {
    const knownVocabulary = ['学习', '中文', '喜欢'];
    const sentence = '我喜欢学习中文。';

    const result = validationService.validateSentence(sentence, knownVocabulary, 'STRICT');
    expect(result.isValid).toBe(true);
    expect(result.unallowedWords.length).toBe(0);
  });

  it('nên FAIL khi câu "我每天喜欢学习中文。" chứa từ "每天" chưa học trong STRICT mode', () => {
    const knownVocabulary = ['学习', '中文', '喜欢'];
    const sentence = '我每天喜欢学习中文。';

    const result = validationService.validateSentence(sentence, knownVocabulary, 'STRICT');
    expect(result.isValid).toBe(false);
    expect(result.unallowedWords).toContain('每天');
  });

  it('nên PASS đối với FLEXIBLE mode bất kể xuất hiện từ mới', () => {
    const knownVocabulary = ['学习', '中文', '喜欢'];
    const sentence = '我每天喜欢学习中文。';

    const result = validationService.validateSentence(sentence, knownVocabulary, 'FLEXIBLE');
    expect(result.isValid).toBe(true);
  });
});
