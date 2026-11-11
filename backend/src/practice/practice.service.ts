import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiSentenceGeneratorService } from '../ai/ai-sentence-generator.service';
import { PinyinService } from '../chinese/pinyin.service';
import { GeminiService } from '../ai/gemini.service';
import { GeneratePracticeDto } from './dto/generate-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AutoCompleteSentenceDto } from './dto/auto-complete-sentence.dto';

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGeneratorService: AiSentenceGeneratorService,
    private readonly pinyinService: PinyinService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Sinh bộ bài tập mới: Lấy danh sách từ vựng từ DB -> Gọi AI sinh câu -> Tạo Pinyin -> Lưu DB
   */
  async generatePractice(dto: GeneratePracticeDto) {
    if (!dto.vocabularyIds || dto.vocabularyIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một từ vựng để tạo bài tập.');
    }

    // 1. Lấy thông tin từ vựng từ PostgreSQL
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { id: { in: dto.vocabularyIds } },
    });

    if (vocabularies.length === 0) {
      throw new NotFoundException('Không tìm thấy từ vựng hợp lệ trong cơ sở dữ liệu.');
    }

    const knownWords = vocabularies.map((v) => v.word);

    // 2. Gọi AI Sentence Generator sinh danh sách câu hỏi
    const generatedItems = await this.aiGeneratorService.generateQuestions(
      knownWords,
      dto.difficulty,
      dto.mode,
      dto.questionCount,
    );

    // 3. Tạo tiêu đề và mô tả bài tập mặc định nếu không truyền
    const title = dto.title || `Bài luyện tập ${new Date().toLocaleDateString('vi-VN')} (${vocabularies.length} từ - ${dto.difficulty})`;
    const sampleWords = vocabularies.slice(0, 5).map((v) => `${v.word} (${v.meaning})`).join(', ');
    const defaultDesc = `Luyện tập ${vocabularies.length} từ vựng: ${sampleWords}${vocabularies.length > 5 ? '...' : ''}`;
    const description = dto.description !== undefined ? dto.description : defaultDesc;

    // 4. Lưu PracticeSet và các Questions vào PostgreSQL sử dụng giao dịch (Transaction)
    return this.prisma.$transaction(async (tx) => {
      const practiceSet = await tx.practiceSet.create({
        data: {
          title,
          description,
          vocabularyIds: dto.vocabularyIds,
          difficulty: dto.difficulty,
          questionCount: generatedItems.length,
        },
      });

      const questionData = generatedItems.map((item) => {
        // Sinh Pinyin cho câu tiếng Trung chuẩn bằng PinyinService
        const pinyinText = this.pinyinService.generatePinyin(item.chinese);

        return {
          practiceSetId: practiceSet.id,
          vietnamese: item.vietnamese,
          chinese: item.chinese,
          pinyin: pinyinText,
          usedVocabulary: item.usedVocabulary || [],
        };
      });

      await tx.question.createMany({
        data: questionData,
      });

      // Trả về dữ liệu bài tập đầy đủ kèm các câu hỏi
      return tx.practiceSet.findUnique({
        where: { id: practiceSet.id },
        include: {
          questions: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Lấy lịch sử tất cả các bộ bài tập đã tạo
   */
  async findAll() {
    const practiceSets = await this.prisma.practiceSet.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return practiceSets.map((set) => ({
      ...set,
      vocabularyCount: Array.isArray(set.vocabularyIds) ? set.vocabularyIds.length : 0,
    }));
  }

  /**
   * Lấy chi tiết bài tập theo ID kèm danh sách câu hỏi
   */
  async findOne(id: string) {
    const practiceSet = await this.prisma.practiceSet.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!practiceSet) {
      throw new NotFoundException(`Không tìm thấy bài tập với ID: ${id}`);
    }

    return practiceSet;
  }

  /**
   * Cập nhật thông tin bài tập (tiêu đề, mô tả ngắn)
   */
  async update(id: string, dto: UpdatePracticeDto) {
    await this.findOne(id);
    return this.prisma.practiceSet.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      },
    });
  }

  /**
   * Xóa một bài tập và các câu hỏi liên quan
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.practiceSet.delete({ where: { id } });
  }

  /**
   * Thống kê tổng quan cho Dashboard
   */
  async getDashboardStats() {
    const [vocabularyCount, practiceSetCount, totalQuestions] = await Promise.all([
      this.prisma.vocabulary.count(),
      this.prisma.practiceSet.count(),
      this.prisma.question.count(),
    ]);

    return {
      vocabularyCount,
      practiceSetCount,
      questionsPracticed: totalQuestions,
    };
  }

  /**
   * Tự động sinh Pinyin và nghĩa Tiếng Việt dựa vào câu tiếng Trung nhập vào (hoặc ngược lại)
   */
  async autoCompleteSentence(dto: AutoCompleteSentenceDto) {
    const hasChinese = dto.chinese && dto.chinese.trim().length > 0;
    const hasVietnamese = dto.vietnamese && dto.vietnamese.trim().length > 0;

    if (!hasChinese && !hasVietnamese) {
      throw new BadRequestException('Vui lòng nhập ít nhất câu tiếng Trung hoặc câu tiếng Việt.');
    }

    if (hasChinese) {
      const cleanChinese = dto.chinese!.trim();
      const pinyin = this.pinyinService.generatePinyin(cleanChinese);
      let vietnamese = dto.vietnamese?.trim() || '';

      // Tự động dịch sang tiếng Việt bằng Gemini AI nếu chưa có tiếng Việt
      if (!vietnamese) {
        try {
          const prompt = `You are a Chinese-to-Vietnamese translator for language learners.
Translate the following Chinese sentence into a natural, fluent Vietnamese sentence.
Chinese sentence: "${cleanChinese}"

Return JSON strictly in this format:
{
  "vietnamese": "Nghĩa tiếng Việt tự nhiên, chính xác"
}`;
          const rawRes = await this.geminiService.generateText(prompt);
          const parsed = this.parseJsonSafe(rawRes);
          if (parsed && typeof parsed.vietnamese === 'string') {
            vietnamese = parsed.vietnamese.trim();
          }
        } catch (error: any) {
          console.warn('Không thể tự động dịch câu sang tiếng Việt bằng Gemini:', error?.message);
        }
      }

      return {
        chinese: cleanChinese,
        pinyin,
        vietnamese,
      };
    }

    // Trường hợp nhập tiếng Việt nhưng chưa có tiếng Trung
    const cleanVietnamese = dto.vietnamese!.trim();
    let chinese = '';
    let pinyin = '';

    try {
      const prompt = `You are a Vietnamese-to-Chinese translator for language learners.
Translate the following Vietnamese sentence into a natural Chinese sentence written in simplified Hanzi characters.
Vietnamese sentence: "${cleanVietnamese}"

Return JSON strictly in this format:
{
  "chinese": "Câu tiếng Trung chữ Hán"
}`;
      const rawRes = await this.geminiService.generateText(prompt);
      const parsed = this.parseJsonSafe(rawRes);
      if (parsed && typeof parsed.chinese === 'string') {
        chinese = parsed.chinese.trim();
        pinyin = this.pinyinService.generatePinyin(chinese);
      }
    } catch (error: any) {
      console.warn('Không thể tự động dịch câu sang tiếng Trung bằng Gemini:', error?.message);
    }

    return {
      chinese,
      pinyin,
      vietnamese: cleanVietnamese,
    };
  }

  /**
   * Thêm một câu mới vào bộ bài tập
   */
  async addQuestion(practiceSetId: string, dto: CreateQuestionDto) {
    const practiceSet = await this.prisma.practiceSet.findUnique({
      where: { id: practiceSetId },
    });
    if (!practiceSet) {
      throw new NotFoundException(`Không tìm thấy bộ bài tập với ID: ${practiceSetId}`);
    }

    const cleanChinese = dto.chinese.trim();
    const cleanVietnamese = dto.vietnamese.trim();
    const pinyin = dto.pinyin?.trim() || this.pinyinService.generatePinyin(cleanChinese);

    return this.prisma.$transaction(async (tx) => {
      const newQuestion = await tx.question.create({
        data: {
          practiceSetId,
          chinese: cleanChinese,
          vietnamese: cleanVietnamese,
          pinyin,
          usedVocabulary: dto.usedVocabulary || [],
        },
      });

      const updatedCount = await tx.question.count({
        where: { practiceSetId },
      });

      await tx.practiceSet.update({
        where: { id: practiceSetId },
        data: {
          questionCount: updatedCount,
        },
      });

      return newQuestion;
    });
  }

  /**
   * Cập nhật một câu hỏi trong bộ bài tập
   */
  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException(`Không tìm thấy câu hỏi với ID: ${questionId}`);
    }

    const dataToUpdate: any = {};
    if (dto.chinese !== undefined) {
      dataToUpdate.chinese = dto.chinese.trim();
    }
    if (dto.vietnamese !== undefined) {
      dataToUpdate.vietnamese = dto.vietnamese.trim();
    }
    if (dto.pinyin !== undefined && dto.pinyin.trim()) {
      dataToUpdate.pinyin = dto.pinyin.trim();
    } else if (dto.chinese !== undefined && dto.chinese.trim() !== question.chinese) {
      // Tự động tính lại pinyin nếu đổi chữ Hán mà không truyền pinyin mới
      dataToUpdate.pinyin = this.pinyinService.generatePinyin(dto.chinese.trim());
    }
    if (dto.usedVocabulary !== undefined) {
      dataToUpdate.usedVocabulary = dto.usedVocabulary;
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: dataToUpdate,
    });
  }

  /**
   * Xóa một câu hỏi khỏi bộ bài tập
   */
  async deleteQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException(`Không tìm thấy câu hỏi với ID: ${questionId}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.question.delete({
        where: { id: questionId },
      });

      const remainingCount = await tx.question.count({
        where: { practiceSetId: question.practiceSetId },
      });

      await tx.practiceSet.update({
        where: { id: question.practiceSetId },
        data: {
          questionCount: remainingCount,
        },
      });

      return {
        success: true,
        message: 'Đã xóa câu hỏi thành công',
        questionCount: remainingCount,
      };
    });
  }

  /**
   * Phân tích JSON an toàn từ kết quả của AI
   */
  private parseJsonSafe(rawText: string): any {
    if (!rawText) return {};
    try {
      return JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          return {};
        }
      }
      return {};
    }
  }
}
