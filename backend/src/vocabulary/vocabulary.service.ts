import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PinyinService } from '../chinese/pinyin.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { BulkPasteDto, BulkVocabularyDto } from './dto/bulk-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { parse } from 'csv-parse/sync';

@Injectable()
export class VocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pinyinService: PinyinService,
  ) {}

  private makeKey(word: string, partOfSpeech: string): string {
    return `${word}|||${partOfSpeech}`;
  }

  private async findExistingKeySet(words: string[]): Promise<Set<string>> {
    if (words.length === 0) return new Set();
    const existingVocabs = await this.prisma.vocabulary.findMany({
      where: { word: { in: words } },
      select: { word: true, partOfSpeech: true },
    });
    return new Set(existingVocabs.map((v) => this.makeKey(v.word, v.partOfSpeech || '')));
  }

  /**
   * Lấy danh sách từ vựng có hỗ trợ tìm kiếm theo từ/nghĩa và lọc theo cấp độ (Level) và từ loại
   */
  async findAll(search?: string, level?: string, partOfSpeech?: string) {
    const where: any = {};

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { word: { contains: query, mode: 'insensitive' } },
        { meaning: { contains: query, mode: 'insensitive' } },
        { pinyin: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (level && level.trim() && level !== 'ALL') {
      where.level = level.trim();
    }

    if (partOfSpeech && partOfSpeech.trim() && partOfSpeech !== 'ALL') {
      where.partOfSpeech = partOfSpeech === 'UNSET' ? '' : partOfSpeech.trim();
    }

    return this.prisma.vocabulary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Xem chi tiết một từ vựng
   */
  async findOne(id: string) {
    const vocab = await this.prisma.vocabulary.findUnique({ where: { id } });
    if (!vocab) {
      throw new NotFoundException(`Không tìm thấy từ vựng với ID: ${id}`);
    }
    return vocab;
  }

  /**
   * Tạo một từ vựng mới thủ công (chỉ chặn trùng khi trùng cả từ tiếng Trung và từ loại)
   */
  async create(dto: CreateVocabularyDto) {
    const cleanWord = dto.word.trim();
    const cleanPartOfSpeech = dto.partOfSpeech?.trim() || '';

    // Kiểm tra xem cặp (từ tiếng Trung, từ loại) đã tồn tại chưa
    const existing = await this.prisma.vocabulary.findUnique({
      where: {
        word_partOfSpeech: {
          word: cleanWord,
          partOfSpeech: cleanPartOfSpeech,
        },
      },
    });

    if (existing) {
      const posLabel = cleanPartOfSpeech || 'Chưa phân loại';
      throw new BadRequestException(
        `Từ vựng "${cleanWord}" (${posLabel}) đã tồn tại trong hệ thống.`,
      );
    }

    const pinyinValue =
      dto.pinyin && dto.pinyin.trim()
        ? dto.pinyin.trim()
        : this.pinyinService.generatePinyin(cleanWord);

    return this.prisma.vocabulary.create({
      data: {
        word: cleanWord,
        meaning: dto.meaning.trim(),
        pinyin: pinyinValue,
        partOfSpeech: cleanPartOfSpeech,
        level: dto.level?.trim() || 'HSK1',
      },
    });
  }

  /**
   * Xử lý paste nhiều dòng từ vựng (tự động lọc bỏ các từ trùng cả từ và từ loại)
   */
  async bulkPaste(dto: BulkPasteDto) {
    const lines = dto.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Tách từ vựng và loại bỏ các dòng bị trùng (word + partOfSpeech) trong cùng một lần paste
    const parsedItems: {
      word: string;
      meaning: string;
      partOfSpeech: string;
      pinyinInput?: string;
      levelInput: string;
    }[] = [];
    const seenKeys = new Set<string>();
    const uniqueWords = new Set<string>();

    for (const line of lines) {
      const parts = line.split(/[|]/).map((p) => p.trim());
      const word = parts[0];
      if (!word) continue;

      const partOfSpeech = parts[2] || dto.defaultPartOfSpeech?.trim() || '';
      const key = this.makeKey(word, partOfSpeech);
      if (seenKeys.has(key)) continue;

      seenKeys.add(key);
      uniqueWords.add(word);
      parsedItems.push({
        word,
        meaning: parts[1] || word,
        partOfSpeech,
        pinyinInput: parts[3],
        levelInput: parts[4] || dto.defaultLevel || 'HSK1',
      });
    }

    if (parsedItems.length === 0) {
      return { message: 'Không có từ vựng hợp lệ để thêm.', count: 0, skippedCount: 0 };
    }

    const existingKeySet = await this.findExistingKeySet(Array.from(uniqueWords));
    const newItems = parsedItems.filter(
      (item) => !existingKeySet.has(this.makeKey(item.word, item.partOfSpeech)),
    );
    const skippedCount = parsedItems.length - newItems.length;

    const dataToInsert = newItems.map((item) => ({
      word: item.word,
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech,
      pinyin:
        item.pinyinInput && item.pinyinInput.trim()
          ? item.pinyinInput.trim()
          : this.pinyinService.generatePinyin(item.word),
      level: item.levelInput,
    }));

    if (dataToInsert.length > 0) {
      await this.prisma.vocabulary.createMany({
        data: dataToInsert,
      });
    }

    let message = `Đã nhập thành công ${dataToInsert.length} từ vựng mới.`;
    if (skippedCount > 0) {
      message += ` (Đã bỏ qua ${skippedCount} từ bị trùng lặp).`;
    }

    return {
      message,
      count: dataToInsert.length,
      skippedCount,
    };
  }

  /**
   * Nhập từ vựng trực tiếp từ mảng đã được xác thực (bỏ qua trùng lặp word + partOfSpeech)
   */
  async bulkInsert(dto: BulkVocabularyDto) {
    const seenKeys = new Set<string>();
    const uniqueWords = new Set<string>();
    const dedupedItems: {
      word: string;
      meaning: string;
      partOfSpeech: string;
      pinyin?: string;
      level?: string;
    }[] = [];

    for (const item of dto.items) {
      const word = item.word.trim();
      if (!word) continue;
      const partOfSpeech = item.partOfSpeech?.trim() || '';
      const key = this.makeKey(word, partOfSpeech);
      if (seenKeys.has(key)) continue;

      seenKeys.add(key);
      uniqueWords.add(word);
      dedupedItems.push({
        word,
        meaning: item.meaning.trim(),
        partOfSpeech,
        pinyin: item.pinyin,
        level: item.level,
      });
    }

    const existingKeySet = await this.findExistingKeySet(Array.from(uniqueWords));
    const newItems = dedupedItems.filter(
      (item) => !existingKeySet.has(this.makeKey(item.word, item.partOfSpeech)),
    );
    const skippedCount = dto.items.length - newItems.length;

    const dataToInsert = newItems.map((item) => ({
      word: item.word,
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech,
      pinyin:
        item.pinyin && item.pinyin.trim()
          ? item.pinyin.trim()
          : this.pinyinService.generatePinyin(item.word),
      level: item.level?.trim() || 'HSK1',
    }));

    if (dataToInsert.length > 0) {
      await this.prisma.vocabulary.createMany({
        data: dataToInsert,
      });
    }

    let message = `Đã nhập thành công ${dataToInsert.length} từ vựng mới.`;
    if (skippedCount > 0) {
      message += ` (Đã bỏ qua ${skippedCount} từ bị trùng lặp).`;
    }

    return {
      message,
      count: dataToInsert.length,
      skippedCount,
    };
  }

  /**
   * Import dữ liệu từ vựng từ file CSV (bỏ qua các từ trùng lặp word + partOfSpeech)
   */
  async importCsv(csvContent: string) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const parsedItems: {
      word: string;
      meaning: string;
      partOfSpeech: string;
      pinyin: string;
      level: string;
    }[] = [];
    const seenKeys = new Set<string>();
    const uniqueWords = new Set<string>();

    for (const record of records) {
      const word = (record.word || record.Chinese || record.chinese || '').trim();
      if (!word) continue;

      const partOfSpeech = (
        record.partOfSpeech ||
        record.part_of_speech ||
        record.pos ||
        record.type ||
        record['Từ loại'] ||
        ''
      ).trim();

      const key = this.makeKey(word, partOfSpeech);
      if (seenKeys.has(key)) continue;

      seenKeys.add(key);
      uniqueWords.add(word);
      const meaning = (record.meaning || record.Meaning || record.vietnamese || word).trim();
      const pinyinInput = (record.pinyin || record.Pinyin || '').trim();
      const level = (record.level || record.Level || 'HSK1').trim();

      const pinyinValue = pinyinInput
        ? pinyinInput
        : this.pinyinService.generatePinyin(word);

      parsedItems.push({
        word,
        meaning,
        partOfSpeech,
        pinyin: pinyinValue,
        level,
      });
    }

    if (parsedItems.length === 0) {
      return { message: 'File CSV không chứa từ vựng hợp lệ.', count: 0, skippedCount: 0 };
    }

    const existingKeySet = await this.findExistingKeySet(Array.from(uniqueWords));
    const newItems = parsedItems.filter(
      (item) => !existingKeySet.has(this.makeKey(item.word, item.partOfSpeech)),
    );
    const skippedCount = parsedItems.length - newItems.length;

    if (newItems.length > 0) {
      await this.prisma.vocabulary.createMany({
        data: newItems,
      });
    }

    let message = `Đã import thành công ${newItems.length} từ vựng từ CSV.`;
    if (skippedCount > 0) {
      message += ` (Đã bỏ qua ${skippedCount} từ đã tồn tại).`;
    }

    return {
      message,
      count: newItems.length,
      skippedCount,
    };
  }

  /**
   * Cập nhật thông tin từ vựng
   */
  async update(id: string, dto: UpdateVocabularyDto) {
    const current = await this.findOne(id); // Kiểm tra tồn tại

    const nextWord = dto.word !== undefined ? dto.word.trim() : current.word;
    const nextPos =
      dto.partOfSpeech !== undefined ? dto.partOfSpeech.trim() : current.partOfSpeech;

    if (nextWord !== current.word || nextPos !== current.partOfSpeech) {
      const duplicate = await this.prisma.vocabulary.findUnique({
        where: {
          word_partOfSpeech: {
            word: nextWord,
            partOfSpeech: nextPos,
          },
        },
      });
      if (duplicate && duplicate.id !== id) {
        const posLabel = nextPos || 'Chưa phân loại';
        throw new BadRequestException(
          `Từ vựng "${nextWord}" (${posLabel}) đã tồn tại trong hệ thống.`,
        );
      }
    }

    const data: any = { ...dto };
    if (dto.word !== undefined) data.word = nextWord;
    if (dto.meaning !== undefined) data.meaning = dto.meaning.trim();
    if (dto.partOfSpeech !== undefined) data.partOfSpeech = nextPos;
    if (dto.word && !dto.pinyin) {
      data.pinyin = this.pinyinService.generatePinyin(nextWord);
    }

    return this.prisma.vocabulary.update({
      where: { id },
      data,
    });
  }

  /**
   * Xóa một từ vựng
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.vocabulary.delete({ where: { id } });
  }
}
