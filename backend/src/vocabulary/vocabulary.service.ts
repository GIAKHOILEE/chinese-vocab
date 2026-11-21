import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PinyinService } from '../chinese/pinyin.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { BulkPasteDto, BulkVocabularyDto } from './dto/bulk-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { AuthUser } from '../auth/current-user.decorator';
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

  private async findExistingKeySet(userId: string, words: string[]): Promise<Set<string>> {
    if (words.length === 0) return new Set();
    const existingVocabs = await this.prisma.vocabulary.findMany({
      where: {
        word: { in: words },
        scopeKey: { in: ['GLOBAL', userId] },
      },
      select: { word: true, partOfSpeech: true },
    });
    return new Set(existingVocabs.map((v) => this.makeKey(v.word, v.partOfSpeech || '')));
  }

  /**
   * Lấy danh sách từ vựng hiển thị cho user (hỗ trợ phân trang, chế độ nhẹ và random cho game)
   */
  async findAll(
    userId: string,
    search?: string,
    level?: string,
    partOfSpeech?: string,
    opts?: { page?: number; limit?: number; lite?: boolean; random?: boolean },
  ) {
    const andFilters: any[] = [
      { OR: [{ ownerId: null }, { ownerId: userId }] },
    ];

    if (search && search.trim()) {
      const query = search.trim().slice(0, 100);
      andFilters.push({
        OR: [
          { word: { contains: query, mode: 'insensitive' } },
          { meaning: { contains: query, mode: 'insensitive' } },
          { pinyin: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (level && level.trim() && level !== 'ALL') {
      andFilters.push({ level: level.trim() });
    }

    if (partOfSpeech && partOfSpeech.trim() && partOfSpeech !== 'ALL') {
      andFilters.push({ partOfSpeech: partOfSpeech === 'UNSET' ? '' : partOfSpeech.trim() });
    }

    const where = { AND: andFilters };
    const liteSelect = opts?.lite
      ? {
          id: true,
          word: true,
          meaning: true,
          pinyin: true,
          partOfSpeech: true,
          level: true,
        }
      : undefined;

    if (opts?.random && opts?.limit) {
      const idRows = await this.prisma.vocabulary.findMany({
        where,
        select: { id: true },
      });
      const ids = idRows.map((r) => r.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      const picked = ids.slice(0, opts.limit);
      if (picked.length === 0) return [];
      return this.prisma.vocabulary.findMany({
        where: { id: { in: picked } },
        ...(liteSelect ? { select: liteSelect } : {}),
      });
    }

    if (opts?.page !== undefined || opts?.limit !== undefined) {
      const page = opts?.page ?? 1;
      const limit = opts?.limit ?? 50;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.prisma.vocabulary.findMany({
          where,
          ...(liteSelect ? { select: liteSelect } : {}),
          orderBy: [{ createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        this.prisma.vocabulary.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    return this.prisma.vocabulary.findMany({
      where,
      ...(liteSelect ? { select: liteSelect } : {}),
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /**
   * Xem chi tiết một từ vựng (nếu nằm trong kho chung hoặc thuộc user)
   */
  async findOne(userId: string, id: string) {
    const vocab = await this.prisma.vocabulary.findFirst({
      where: {
        id,
        OR: [{ ownerId: null }, { ownerId: userId }],
      },
    });
    if (!vocab) {
      throw new NotFoundException(`Không tìm thấy từ vựng với ID: ${id}`);
    }
    return vocab;
  }

  /**
   * Tạo một từ vựng mới thủ công cho user hiện tại
   */
  async create(userId: string, dto: CreateVocabularyDto) {
    const cleanWord = dto.word.trim();
    const cleanPartOfSpeech = dto.partOfSpeech?.trim() || '';

    const existing = await this.prisma.vocabulary.findFirst({
      where: {
        word: cleanWord,
        partOfSpeech: cleanPartOfSpeech,
        scopeKey: { in: ['GLOBAL', userId] },
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
        ownerId: userId,
        scopeKey: userId,
        word: cleanWord,
        meaning: dto.meaning.trim(),
        pinyin: pinyinValue,
        partOfSpeech: cleanPartOfSpeech,
        level: dto.level?.trim() || 'HSK1',
        topic: dto.topic?.trim() || 'Từ vựng cá nhân',
      },
    });
  }

  /**
   * Xử lý paste nhiều dòng từ vựng cho user hiện tại
   */
  async bulkPaste(userId: string, dto: BulkPasteDto) {
    const lines = dto.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

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

    const existingKeySet = await this.findExistingKeySet(userId, Array.from(uniqueWords));
    const newItems = parsedItems.filter(
      (item) => !existingKeySet.has(this.makeKey(item.word, item.partOfSpeech)),
    );
    const skippedCount = parsedItems.length - newItems.length;

    const dataToInsert = newItems.map((item) => ({
      ownerId: userId,
      scopeKey: userId,
      word: item.word,
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech,
      pinyin:
        item.pinyinInput && item.pinyinInput.trim()
          ? item.pinyinInput.trim()
          : this.pinyinService.generatePinyin(item.word),
      level: item.levelInput,
      topic: 'Từ vựng cá nhân',
    }));

    if (dataToInsert.length > 0) {
      await this.prisma.vocabulary.createMany({
        data: dataToInsert,
        skipDuplicates: true,
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
   * Nhập từ vựng trực tiếp từ mảng
   */
  async bulkInsert(userId: string, dto: BulkVocabularyDto) {
    const seenKeys = new Set<string>();
    const uniqueWords = new Set<string>();
    const dedupedItems: {
      word: string;
      meaning: string;
      partOfSpeech: string;
      pinyin?: string;
      level?: string;
      topic?: string;
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
        topic: item.topic,
      });
    }

    const existingKeySet = await this.findExistingKeySet(userId, Array.from(uniqueWords));
    const newItems = dedupedItems.filter(
      (item) => !existingKeySet.has(this.makeKey(item.word, item.partOfSpeech)),
    );
    const skippedCount = dto.items.length - newItems.length;

    const dataToInsert = newItems.map((item) => ({
      ownerId: userId,
      scopeKey: userId,
      word: item.word,
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech,
      pinyin:
        item.pinyin && item.pinyin.trim()
          ? item.pinyin.trim()
          : this.pinyinService.generatePinyin(item.word),
      level: item.level?.trim() || 'HSK1',
      topic: item.topic?.trim() || 'Từ vựng cá nhân',
    }));

    if (dataToInsert.length > 0) {
      await this.prisma.vocabulary.createMany({
        data: dataToInsert,
        skipDuplicates: true,
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
   * Import CSV
   */
  async importCsv(userId: string, csvContent: string) {
    if (!csvContent || !csvContent.trim()) {
      throw new BadRequestException('Nội dung CSV không được để trống.');
    }
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    if (records.length > 2000) {
      throw new BadRequestException('File CSV vượt quá giới hạn tối đa 2.000 dòng mỗi lần import.');
    }

    const parsedItems: {
      ownerId: string;
      scopeKey: string;
      word: string;
      meaning: string;
      partOfSpeech: string;
      pinyin: string;
      level: string;
      topic: string;
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
      const topic = (record.topic || record.Topic || 'Từ vựng cá nhân').trim();

      const pinyinValue = pinyinInput
        ? pinyinInput
        : this.pinyinService.generatePinyin(word);

      parsedItems.push({
        ownerId: userId,
        scopeKey: userId,
        word,
        meaning,
        partOfSpeech,
        pinyin: pinyinValue,
        level,
        topic,
      });
    }

    if (parsedItems.length === 0) {
      return { message: 'File CSV không chứa từ vựng hợp lệ.', count: 0, skippedCount: 0 };
    }

    const existingKeySet = await this.findExistingKeySet(userId, Array.from(uniqueWords));
    const newItems = parsedItems.filter(
      (item) => !existingKeySet.has(this.makeKey(item.word, item.partOfSpeech)),
    );
    const skippedCount = parsedItems.length - newItems.length;

    if (newItems.length > 0) {
      await this.prisma.vocabulary.createMany({
        data: newItems,
        skipDuplicates: true,
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
  async update(user: AuthUser, id: string, dto: UpdateVocabularyDto) {
    const current = await this.findOne(user.id, id);

    if (current.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ có thể chỉnh sửa từ vựng cá nhân do bạn tự thêm.');
    }

    const nextWord = dto.word !== undefined ? dto.word.trim() : current.word;
    const nextPos =
      dto.partOfSpeech !== undefined ? dto.partOfSpeech.trim() : current.partOfSpeech;

    if (nextWord !== current.word || nextPos !== current.partOfSpeech) {
      const duplicate = await this.prisma.vocabulary.findFirst({
        where: {
          word: nextWord,
          partOfSpeech: nextPos,
          scopeKey: current.scopeKey,
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
    if (dto.topic !== undefined) data.topic = dto.topic.trim();
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
  async remove(user: AuthUser, id: string) {
    const current = await this.findOne(user.id, id);
    if (current.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Không thể xóa từ vựng chuẩn dùng chung của hệ thống.');
    }
    return this.prisma.vocabulary.delete({ where: { id } });
  }
}
