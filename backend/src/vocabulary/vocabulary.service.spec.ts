import { VocabularyService } from './vocabulary.service';
import { PrismaService } from '../prisma/prisma.service';
import { PinyinService } from '../chinese/pinyin.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('VocabularyService - Multi-user & Duplicate Checking', () => {
  let service: VocabularyService;
  let prismaMock: any;
  let pinyinMock: any;
  const userId = 'user-1';
  const user = { id: userId, username: 'tester', displayName: 'Tester', role: 'USER' };

  beforeEach(() => {
    prismaMock = {
      vocabulary: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    pinyinMock = {
      generatePinyin: jest.fn((word: string) => `pinyin_${word}`),
    };

    service = new VocabularyService(prismaMock as PrismaService, pinyinMock as PinyinService);
  });

  it('nên ném lỗi BadRequestException nếu thêm 1 từ thủ công trùng cả từ và từ loại', async () => {
    prismaMock.vocabulary.findFirst.mockResolvedValue({
      id: '1',
      word: '工作',
      partOfSpeech: 'Danh từ',
      meaning: 'công việc',
    });

    await expect(
      service.create(userId, { word: '工作', partOfSpeech: 'Danh từ', meaning: 'việc làm' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('nên cho phép thêm cùng 1 từ tiếng Trung nếu khác từ loại', async () => {
    prismaMock.vocabulary.findFirst.mockResolvedValue(null);
    prismaMock.vocabulary.create.mockResolvedValue({
      id: '2',
      ownerId: userId,
      scopeKey: userId,
      word: '工作',
      partOfSpeech: 'Động từ',
      meaning: 'làm việc',
      pinyin: 'pinyin_工作',
      level: 'HSK1',
    });

    const result = await service.create(userId, {
      word: '工作',
      partOfSpeech: 'Động từ',
      meaning: 'làm việc',
    });

    expect(result.word).toBe('工作');
    expect(result.partOfSpeech).toBe('Động từ');
    expect(prismaMock.vocabulary.create).toHaveBeenCalled();
  });

  it('nên tự động lọc bỏ các từ trùng lặp cả từ và từ loại khi Paste nhiều từ (bulkPaste)', async () => {
    prismaMock.vocabulary.findMany.mockResolvedValue([
      { word: '学习', partOfSpeech: 'Động từ' },
    ]);

    const result = await service.bulkPaste(userId, {
      text: '学习 | học | Động từ\n学习 | việc học | Danh từ\n中文 | tiếng Trung | Danh từ\n学习 | học | Động từ\n',
    });

    expect(result.count).toBe(2);
    expect(result.skippedCount).toBe(1);
    expect(result.message).toContain('bỏ qua 1 từ bị trùng lặp');
  });

  it('nên tự động lọc bỏ các từ đã có (cùng từ và từ loại) khi Import CSV (importCsv)', async () => {
    prismaMock.vocabulary.findMany.mockResolvedValue([
      { word: '中文', partOfSpeech: 'Danh từ' },
    ]);

    const csvData =
      'word,meaning,partOfSpeech\n中文,tiếng Trung,Danh từ\n学校,trường học,Danh từ';
    const result = await service.importCsv(userId, csvData);

    expect(result.count).toBe(1);
    expect(result.skippedCount).toBe(1);
  });

  it('nên chặn user thường xóa từ vựng chuẩn dùng chung của hệ thống', async () => {
    prismaMock.vocabulary.findFirst.mockResolvedValue({
      id: 'global-1',
      ownerId: null,
      scopeKey: 'GLOBAL',
      word: '我',
    });

    await expect(service.remove(user, 'global-1')).rejects.toThrow(ForbiddenException);
  });
});
