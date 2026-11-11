import { VocabularyService } from './vocabulary.service';
import { PrismaService } from '../prisma/prisma.service';
import { PinyinService } from '../chinese/pinyin.service';
import { BadRequestException } from '@nestjs/common';

describe('VocabularyService - Duplicate Checking', () => {
  let service: VocabularyService;
  let prismaMock: any;
  let pinyinMock: any;

  beforeEach(() => {
    prismaMock = {
      vocabulary: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
      },
    };

    pinyinMock = {
      generatePinyin: jest.fn((word: string) => `pinyin_${word}`),
    };

    service = new VocabularyService(prismaMock as PrismaService, pinyinMock as PinyinService);
  });

  it('nên ném lỗi BadRequestException nếu thêm 1 từ thủ công đã tồn tại', async () => {
    prismaMock.vocabulary.findUnique.mockResolvedValue({ id: '1', word: '学习', meaning: 'học' });

    await expect(
      service.create({ word: '学习', meaning: 'học tập' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('nên tự động lọc bỏ các từ trùng lặp khi Paste nhiều từ (bulkPaste)', async () => {
    prismaMock.vocabulary.findMany.mockResolvedValue([{ word: '学习' }]);

    const result = await service.bulkPaste({
      text: '学习\n中文\n学习\n',
    });

    expect(result.count).toBe(1); // Chỉ thêm '中文'
    expect(result.skippedCount).toBe(1); // Bỏ qua '学习'
    expect(result.message).toContain('bỏ qua 1 từ bị trùng lặp');
  });

  it('nên tự động lọc bỏ các từ đã có khi Import CSV (importCsv)', async () => {
    prismaMock.vocabulary.findMany.mockResolvedValue([{ word: '中文' }]);

    const csvData = 'word,meaning\n中文,tiếng Trung\n学校,trường học';
    const result = await service.importCsv(csvData);

    expect(result.count).toBe(1); // Chỉ thêm '学校'
    expect(result.skippedCount).toBe(1); // Bỏ qua '中文'
  });
});
