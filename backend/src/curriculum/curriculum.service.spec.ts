import { CurriculumService } from './curriculum.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { PinyinService } from '../chinese/pinyin.service';

describe('CurriculumService - Dashboard & Daily Logs', () => {
  let service: CurriculumService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      vocabulary: { count: jest.fn().mockResolvedValue(10) },
      grammarPoint: { count: jest.fn().mockResolvedValue(5) },
      studyProfile: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          currentLevel: 'HSK1',
          dailyMinutesTarget: 90,
          currentDayNumber: 3,
        }),
      },
      vocabProgress: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(2),
      },
      grammarProgress: { count: jest.fn().mockResolvedValue(1) },
      studyLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'log-2',
            date: '2026-11-22',
            dayNumber: 2,
            level: 'HSK1',
            minutesSpent: 90,
            newWordsLearned: 15,
            wordsReviewed: 25,
            grammarPracticed: 1,
            score: 88,
            aiCoachingFeedback: { headline: 'Tiến bộ tốt!' },
          },
        ]),
        count: jest.fn().mockResolvedValue(12),
      },
    };

    service = new CurriculumService(
      prismaMock as PrismaService,
      {} as GeminiService,
      { generatePinyin: jest.fn((w: string) => w) } as unknown as PinyinService,
    );
    (service as any).isSeeded = true;
  });

  it('trả về recentLogs (tối đa 10) và totalLogs trong getDashboardSummary', async () => {
    const summary = await service.getDashboardSummary('user-1');

    expect(summary.totalLogs).toBe(12);
    expect(summary.recentLogs).toHaveLength(1);
    expect(summary.recentLogs[0].dayNumber).toBe(2);
    expect(prismaMock.studyLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  });

  it('trả về danh sách nhật ký theo ngày mới nhất trước trong getStudyLogs', async () => {
    const logs = await service.getStudyLogs('user-1', 50);

    expect(logs).toHaveLength(1);
    expect(prismaMock.studyLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });
});
