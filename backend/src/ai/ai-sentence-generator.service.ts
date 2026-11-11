import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { AiValidationService, VocabularyMode } from '../chinese/ai-validation.service';

export interface GeneratedQuestionItem {
  vietnamese: string;
  chinese: string;
  usedVocabulary: string[];
}

@Injectable()
export class AiSentenceGeneratorService {
  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly validationService: AiValidationService,
  ) {}

  /**
   * Xây dựng System Prompt chuẩn để gửi cho Google Gemini
   */
  private buildPrompt(
    knownVocabulary: string[],
    difficulty: string,
    mode: VocabularyMode,
    questionCount: number,
  ): string {
    const vocabListStr = knownVocabulary.join(', ');

    return `You are a Chinese language exercise generator for Vietnamese learners.

YOUR GOAL:
Generate exercises where:
- "vietnamese": MUST BE A NATURAL VIETNAMESE SENTENCE (using Latin alphabet with Vietnamese diacritics, e.g., "Tôi thích học tiếng Trung."). DO NOT USE CHINESE CHARACTERS IN THE "vietnamese" FIELD!
- "chinese": MUST BE THE CORRESPONDING CHINESE SENTENCE IN HANZI (e.g., "我喜欢学习中文。").

IMPORTANT RULES:

1. The "vietnamese" field MUST BE 100% VIETNAMESE LANGUAGE (e.g., "Tôi thích học tiếng Trung.").
2. The "chinese" field MUST BE 100% CHINESE HANZI (e.g., "我喜欢学习中文。").
3. The Chinese sentence must express the exact same meaning as the Vietnamese sentence.
4. Prioritize using vocabulary from the provided known vocabulary list.
5. Do not unnecessarily introduce new Chinese vocabulary.
6. In STRICT mode, every meaningful Chinese word must come from the known vocabulary list OR from the explicitly allowed basic vocabulary.
7. Keep grammar appropriate for the requested difficulty level.
8. Do not make sentences artificially complicated.
9. Prefer everyday Chinese.
10. Return JSON only in the specified format.

Known vocabulary:
${vocabListStr}

Difficulty:
${difficulty}

Vocabulary mode:
${mode}

Number of questions:
${questionCount}

Return JSON strictly in this format:
{
  "questions": [
    {
      "vietnamese": "Tôi thích học tiếng Trung.",
      "chinese": "我喜欢学习中文。",
      "usedVocabulary": ["学习", "中文", "喜欢"]
    }
  ]
}`;
  }

  /**
   * Sinh các câu luyện tập tiếng Trung dựa trên từ vựng đã học với cơ chế thử lại (Retry) tối đa 3 lần
   */
  async generateQuestions(
    knownVocabulary: string[],
    difficulty: string,
    mode: VocabularyMode,
    questionCount: number,
  ): Promise<GeneratedQuestionItem[]> {
    if (!knownVocabulary || knownVocabulary.length === 0) {
      throw new BadRequestException('Danh sách từ vựng đã học không được để trống.');
    }

    const maxRetries = 3;
    let attempt = 0;
    const validQuestions: GeneratedQuestionItem[] = [];

    while (attempt < maxRetries && validQuestions.length < questionCount) {
      attempt++;
      const neededCount = questionCount - validQuestions.length;
      const prompt = this.buildPrompt(knownVocabulary, difficulty, mode, neededCount);

      try {
        const rawResponse = await this.geminiService.generateText(prompt);

        const parsedQuestions = this.parseJsonResponse(rawResponse);

        for (const item of parsedQuestions) {
          if (!item.chinese || !item.vietnamese) continue;

          let vietnameseText = item.vietnamese.trim();
          let chineseText = item.chinese.trim();

          // Trường hợp AI bị đảo ngược 2 trường vietnamese và chinese
          if (/[\u4e00-\u9fa5]/.test(vietnameseText) && !/[\u4e00-\u9fa5]/.test(chineseText)) {
            const temp = vietnameseText;
            vietnameseText = chineseText;
            chineseText = temp;
          }

          // Nếu sau khi đảo trường mà vietnameseText vẫn chứa chữ Hán -> Bỏ qua câu lỗi này
          if (/[\u4e00-\u9fa5]/.test(vietnameseText)) {
            console.warn(`[Lượt ${attempt}] Bỏ qua câu do trường vietnamese chứa chữ Hán: "${vietnameseText}"`);
            continue;
          }

          item.vietnamese = vietnameseText;
          item.chinese = chineseText;

          // Kiểm tra câu do AI sinh bằng AiValidationService
          const validation = this.validationService.validateSentence(
            item.chinese,
            knownVocabulary,
            mode,
          );

          if (validation.isValid) {
            validQuestions.push(item);
            if (validQuestions.length >= questionCount) break;
          } else {
            console.warn(
              `[Lượt ${attempt}] Bỏ qua câu do AI chứa từ ngoài từ điển cho phép: "${item.chinese}". Từ vi phạm:`,
              validation.unallowedWords,
            );
          }
        }
      } catch (err) {
        console.warn(`[Lượt ${attempt}] Thất bại khi sinh câu hỏi từ AI:`, err.message);
        if (attempt < maxRetries) {
          // Tạm dừng 3 giây trước khi thử lại để tránh bị giới hạn Rate Limit của Groq Cloud API
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    if (validQuestions.length === 0) {
      throw new BadRequestException('Không thể tạo bài tập từ AI. Vui lòng kiểm tra lại cấu hình dịch vụ Google Gemini API.');
    }

    return validQuestions.slice(0, questionCount);
  }

  /**
   * Parse an toàn phản hồi JSON từ AI (bóc tách khối JSON nếu AI bao quanh bởi markdown ```json ... ```)
   */
  private parseJsonResponse(rawText: string): GeneratedQuestionItem[] {
    try {
      let jsonString = rawText.trim();
      
      // Tìm khối JSON bằng Regex trong trường hợp AI bọc trong ```json ```
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonString);

      if (parsed && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }

      return [];
    } catch (error) {
      console.error('Lỗi khi parse JSON từ AI response:', rawText);
      return [];
    }
  }
}
