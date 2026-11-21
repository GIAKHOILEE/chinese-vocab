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

  async generatePractice(userId: string, dto: GeneratePracticeDto) {
    if (!dto.vocabularyIds || dto.vocabularyIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một từ vựng để tạo bài tập.');
    }

    const vocabularies = await this.prisma.vocabulary.findMany({
      where: {
        id: { in: dto.vocabularyIds },
        OR: [{ ownerId: null }, { ownerId: userId }],
      },
    });

    if (vocabularies.length === 0) {
      throw new NotFoundException('Không tìm thấy từ vựng hợp lệ trong cơ sở dữ liệu.');
    }

    const knownWords = vocabularies.map((v) => v.word);
    const generatedItems = await this.aiGeneratorService.generateQuestions(
      knownWords,
      dto.difficulty,
      dto.mode,
      dto.questionCount,
    );

    const title =
      dto.title ||
      `Bài luyện tập ${new Date().toLocaleDateString('vi-VN')} (${vocabularies.length} từ - ${dto.difficulty})`;
    const sampleWords = vocabularies
      .slice(0, 5)
      .map((v) => `${v.word} (${v.meaning})`)
      .join(', ');
    const defaultDesc = `Luyện tập ${vocabularies.length} từ vựng: ${sampleWords}${vocabularies.length > 5 ? '...' : ''}`;
    const description = dto.description !== undefined ? dto.description : defaultDesc;

    return this.prisma.$transaction(async (tx) => {
      const practiceSet = await tx.practiceSet.create({
        data: {
          userId,
          title,
          description,
          vocabularyIds: dto.vocabularyIds,
          difficulty: dto.difficulty,
          questionCount: generatedItems.length,
        },
      });

      const questionData = generatedItems.map((item) => {
        const pinyinText = this.pinyinService.generatePinyin(item.chinese);
        return {
          practiceSetId: practiceSet.id,
          vietnamese: item.vietnamese,
          chinese: item.chinese,
          pinyin: pinyinText,
          usedVocabulary: item.usedVocabulary || [],
        };
      });

      await tx.question.createMany({ data: questionData });

      return tx.practiceSet.findUnique({
        where: { id: practiceSet.id },
        include: {
          questions: { orderBy: { createdAt: 'asc' } },
        },
      });
    });
  }

  async findAll(userId: string) {
    const practiceSets = await this.prisma.practiceSet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true } },
      },
    });

    return practiceSets.map((set) => ({
      ...set,
      vocabularyCount: Array.isArray(set.vocabularyIds) ? set.vocabularyIds.length : 0,
    }));
  }

  async findOne(userId: string, id: string) {
    const practiceSet = await this.prisma.practiceSet.findFirst({
      where: { id, userId },
      include: {
        questions: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!practiceSet) {
      throw new NotFoundException(`Không tìm thấy bài tập với ID: ${id}`);
    }

    return practiceSet;
  }

  async update(userId: string, id: string, dto: UpdatePracticeDto) {
    await this.findOne(userId, id);
    return this.prisma.practiceSet.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.practiceSet.delete({ where: { id } });
  }

  async getDashboardStats(userId: string) {
    const [vocabularyCount, practiceSetCount, totalQuestions] = await Promise.all([
      this.prisma.vocabulary.count({
        where: { OR: [{ ownerId: null }, { ownerId: userId }] },
      }),
      this.prisma.practiceSet.count({ where: { userId } }),
      this.prisma.question.count({ where: { practiceSet: { userId } } }),
    ]);

    return {
      vocabularyCount,
      practiceSetCount,
      questionsPracticed: totalQuestions,
    };
  }

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

      return { chinese: cleanChinese, pinyin, vietnamese };
    }

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

    return { chinese, pinyin, vietnamese: cleanVietnamese };
  }

  async addQuestion(userId: string, practiceSetId: string, dto: CreateQuestionDto) {
    await this.findOne(userId, practiceSetId);

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

      const updatedCount = await tx.question.count({ where: { practiceSetId } });

      await tx.practiceSet.update({
        where: { id: practiceSetId },
        data: { questionCount: updatedCount },
      });

      return newQuestion;
    });
  }

  async updateQuestion(
    userId: string,
    questionId: string,
    dto: UpdateQuestionDto,
    practiceSetId?: string,
  ) {
    const question = await this.prisma.question.findFirst({
      where: {
        id: questionId,
        ...(practiceSetId ? { practiceSetId } : {}),
        practiceSet: { userId },
      },
    });
    if (!question) {
      throw new NotFoundException(`Không tìm thấy câu hỏi với ID: ${questionId}`);
    }

    const dataToUpdate: any = {};
    if (dto.chinese !== undefined) dataToUpdate.chinese = dto.chinese.trim();
    if (dto.vietnamese !== undefined) dataToUpdate.vietnamese = dto.vietnamese.trim();
    if (dto.pinyin !== undefined && dto.pinyin.trim()) {
      dataToUpdate.pinyin = dto.pinyin.trim();
    } else if (dto.chinese !== undefined && dto.chinese.trim() !== question.chinese) {
      dataToUpdate.pinyin = this.pinyinService.generatePinyin(dto.chinese.trim());
    }
    if (dto.usedVocabulary !== undefined) dataToUpdate.usedVocabulary = dto.usedVocabulary;

    return this.prisma.question.update({
      where: { id: questionId },
      data: dataToUpdate,
    });
  }

  async deleteQuestion(userId: string, questionId: string, practiceSetId?: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        id: questionId,
        ...(practiceSetId ? { practiceSetId } : {}),
        practiceSet: { userId },
      },
    });
    if (!question) {
      throw new NotFoundException(`Không tìm thấy câu hỏi với ID: ${questionId}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.question.delete({ where: { id: questionId } });

      const remainingCount = await tx.question.count({
        where: { practiceSetId: question.practiceSetId },
      });

      await tx.practiceSet.update({
        where: { id: question.practiceSetId },
        data: { questionCount: remainingCount },
      });

      return {
        success: true,
        message: 'Đã xóa câu hỏi thành công',
        questionCount: remainingCount,
      };
    });
  }

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
