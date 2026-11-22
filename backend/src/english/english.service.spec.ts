import { EnglishService } from './english.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';

describe('EnglishService - Summary & Daily Logs', () => {
  let service: EnglishService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      englishVocab: { groupBy: jest.fn().mockResolvedValue([{ cefrLevel: 'A1', _count: 20 }]) },
      englishProfile: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          currentLevel: 'A1',
          dailyMinutesTarget: 60,
          currentDayNumber: 4,
        }),
      },
      englishVocabProgress: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(3),
      },
      englishGrammar: { count: jest.fn().mockResolvedValue(10) },
      englishGrammarProgress: { count: jest.fn().mockResolvedValue(2) },
      englishStudyLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'en-log-3',
            date: '2026-11-22',
            dayNumber: 3,
            level: 'A1',
            minutesSpent: 60,
            newWordsLearned: 12,
            wordsReviewed: 18,
            score: 91,
            aiCoachingFeedback: { headline: 'Rất ổn định!' },
          },
        ]),
        count: jest.fn().mockResolvedValue(15),
      },
    };

    service = new EnglishService(prismaMock as PrismaService, {} as GeminiService);
    (service as any).isSeeded = true;
  });

  it('trả về recentLogs (tối đa 10) và totalLogs trong getSummary', async () => {
    const summary = await service.getSummary('user-1');

    expect(summary.totalLogs).toBe(15);
    expect(summary.recentLogs).toHaveLength(1);
    expect(summary.recentLogs[0].score).toBe(91);
    expect(prismaMock.englishStudyLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  });

  it('trả về nhật ký tiếng Anh theo ngày mới nhất trước trong getStudyLogs', async () => {
    const logs = await service.getStudyLogs('user-1', 40);

    expect(logs).toHaveLength(1);
    expect(prismaMock.englishStudyLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
  });
});
