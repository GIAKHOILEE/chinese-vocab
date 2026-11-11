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

  /**
   * Lấy danh sách từ vựng có hỗ trợ tìm kiếm theo từ/nghĩa và lọc theo cấp độ (Level)
   */
  async findAll(search?: string, level?: string) {
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
   * Tạo một từ vựng mới thủ công (kiểm tra từ đã tồn tại)
   */
  async create(dto: CreateVocabularyDto) {
    const cleanWord = dto.word.trim();

    // Kiểm tra xem từ đã tồn tại chưa
    const existing = await this.prisma.vocabulary.findUnique({
      where: { word: cleanWord },
    });

    if (existing) {
      throw new BadRequestException(`Từ vựng "${cleanWord}" đã tồn tại trong hệ thống.`);
    }

    const pinyinValue = dto.pinyin && dto.pinyin.trim() 
      ? dto.pinyin.trim() 
      : this.pinyinService.generatePinyin(cleanWord);

    return this.prisma.vocabulary.create({
      data: {
        word: cleanWord,
        meaning: dto.meaning.trim(),
        pinyin: pinyinValue,
        level: dto.level?.trim() || 'HSK1',
      },
    });
  }

  /**
   * Xử lý paste nhiều dòng từ vựng (tự động lọc bỏ các từ trùng lặp)
   */
  async bulkPaste(dto: BulkPasteDto) {
    const lines = dto.text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    
    // Tách từ vựng và loại bỏ các dòng bị trùng trong cùng một lần paste
    const parsedItems: { word: string; meaning: string; pinyinInput?: string; levelInput: string }[] = [];
    const seenWords = new Set<string>();

    for (const line of lines) {
      const parts = line.split(/[|]/).map((p) => p.trim());
      const word = parts[0];
      if (!word || seenWords.has(word)) continue;
      
      seenWords.add(word);
      parsedItems.push({
        word,
        meaning: parts[1] || word,
        pinyinInput: parts[2],
        levelInput: parts[3] || dto.defaultLevel || 'HSK1',
      });
    }

    if (parsedItems.length === 0) {
      return { message: 'Không có từ vựng hợp lệ để thêm.', count: 0, skippedCount: 0 };
    }

    // Lấy danh sách từ đã có trong DB
    const existingVocabs = await this.prisma.vocabulary.findMany({
      where: { word: { in: Array.from(seenWords) } },
      select: { word: true },
    });
    const existingWordSet = new Set(existingVocabs.map((v) => v.word));

    const newItems = parsedItems.filter((item) => !existingWordSet.has(item.word));
    const skippedCount = parsedItems.length - newItems.length;

    const dataToInsert = newItems.map((item) => ({
      word: item.word,
      meaning: item.meaning,
      pinyin: item.pinyinInput && item.pinyinInput.trim()
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
   * Nhập từ vựng trực tiếp từ mảng đã được xác thực (bỏ qua trùng lặp)
   */
  async bulkInsert(dto: BulkVocabularyDto) {
    const words = dto.items.map((i) => i.word.trim()).filter(Boolean);
    const uniqueWords = Array.from(new Set(words));

    const existingVocabs = await this.prisma.vocabulary.findMany({
      where: { word: { in: uniqueWords } },
      select: { word: true },
    });
    const existingSet = new Set(existingVocabs.map((v) => v.word));

    const newItems = dto.items.filter((item) => !existingSet.has(item.word.trim()));
    const skippedCount = dto.items.length - newItems.length;

    const dataToInsert = newItems.map((item) => ({
      word: item.word.trim(),
      meaning: item.meaning.trim(),
      pinyin: item.pinyin && item.pinyin.trim() ? item.pinyin.trim() : this.pinyinService.generatePinyin(item.word),
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
   * Import dữ liệu từ vựng từ file CSV (bỏ qua các từ trùng lặp)
   */
  async importCsv(csvContent: string) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const parsedItems: { word: string; meaning: string; pinyin: string; level: string }[] = [];
    const seenWords = new Set<string>();

    for (const record of records) {
      const word = (record.word || record.Chinese || record.chinese || '').trim();
      if (!word || seenWords.has(word)) continue;

      seenWords.add(word);
      const meaning = (record.meaning || record.Meaning || record.vietnamese || word).trim();
      const pinyinInput = (record.pinyin || record.Pinyin || '').trim();
      const level = (record.level || record.Level || 'HSK1').trim();

      const pinyinValue = pinyinInput
        ? pinyinInput
        : this.pinyinService.generatePinyin(word);

      parsedItems.push({
        word,
        meaning,
        pinyin: pinyinValue,
        level,
      });
    }

    if (parsedItems.length === 0) {
      return { message: 'File CSV không chứa từ vựng hợp lệ.', count: 0, skippedCount: 0 };
    }

    // Lọc các từ đã tồn tại trong DB
    const existingVocabs = await this.prisma.vocabulary.findMany({
      where: { word: { in: Array.from(seenWords) } },
      select: { word: true },
    });
    const existingWordSet = new Set(existingVocabs.map((v) => v.word));

    const newItems = parsedItems.filter((item) => !existingWordSet.has(item.word));
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
    await this.findOne(id); // Kiểm tra tồn tại

    const data: any = { ...dto };
    if (dto.word && !dto.pinyin) {
      data.pinyin = this.pinyinService.generatePinyin(dto.word);
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
