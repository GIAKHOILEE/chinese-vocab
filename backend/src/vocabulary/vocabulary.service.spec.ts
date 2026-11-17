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

  it('nên ném lỗi BadRequestException nếu thêm 1 từ thủ công trùng cả từ và từ loại', async () => {
    prismaMock.vocabulary.findUnique.mockResolvedValue({
      id: '1',
      word: '工作',
      partOfSpeech: 'Danh từ',
      meaning: 'công việc',
    });

    await expect(
      service.create({ word: '工作', partOfSpeech: 'Danh từ', meaning: 'việc làm' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('nên cho phép thêm cùng 1 từ tiếng Trung nếu khác từ loại', async () => {
    prismaMock.vocabulary.findUnique.mockResolvedValue(null);
    prismaMock.vocabulary.create.mockResolvedValue({
      id: '2',
      word: '工作',
      partOfSpeech: 'Động từ',
      meaning: 'làm việc',
      pinyin: 'pinyin_工作',
      level: 'HSK1',
    });

    const result = await service.create({
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

    const result = await service.bulkPaste({
      text: '学习 | học | Động từ\n学习 | việc học | Danh từ\n中文 | tiếng Trung | Danh từ\n学习 | học | Động từ\n',
    });

    expect(result.count).toBe(2); // Thêm '学习 (Danh từ)' và '中文 (Danh từ)'
    expect(result.skippedCount).toBe(1); // Bỏ qua '学习 (Động từ)' trùng DB
    expect(result.message).toContain('bỏ qua 1 từ bị trùng lặp');
  });

  it('nên tự động lọc bỏ các từ đã có (cùng từ và từ loại) khi Import CSV (importCsv)', async () => {
    prismaMock.vocabulary.findMany.mockResolvedValue([
      { word: '中文', partOfSpeech: 'Danh từ' },
    ]);

    const csvData =
      'word,meaning,partOfSpeech\n中文,tiếng Trung,Danh từ\n学校,trường học,Danh từ';
    const result = await service.importCsv(csvData);

    expect(result.count).toBe(1); // Chỉ thêm '学校'
    expect(result.skippedCount).toBe(1); // Bỏ qua '中文'
  });
});
