import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { ENGLISH_VOCAB_DATA } from './data/english-vocab.data';
import { ENGLISH_GRAMMAR_DATA } from './data/english-grammar.data';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'] as const;

export interface PlacementQuestion {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  question: string;
  options: string[];
  correctIndex: number;
}

const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  { id: 'q1', level: 'A1', question: 'She ___ to work by bus every morning.', options: ['go', 'goes', 'going', 'is go'], correctIndex: 1 },
  { id: 'q2', level: 'A1', question: '___ a book and two pens on my desk.', options: ['Have', 'There are', 'There is', 'It has'], correctIndex: 2 },
  { id: 'q3', level: 'A1', question: 'Right now, they ___ English in the living room.', options: ['study', 'are studying', 'studied', 'studying'], correctIndex: 1 },
  { id: 'q4', level: 'A2', question: 'Yesterday I ___ to the supermarket because I needed some fruit.', options: ['go', 'have gone', 'went', 'was go'], correctIndex: 2 },
  { id: 'q5', level: 'A2', question: 'This train is much ___ than the old bus.', options: ['convenient', 'more convenient', 'most convenient', 'convenienter'], correctIndex: 1 },
  { id: 'q6', level: 'A2', question: 'Look at those dark clouds! It ___ rain soon.', options: ['is going to', 'will to', 'goes to', 'was'], correctIndex: 0 },
  { id: 'q7', level: 'B1', question: 'I ___ in Ho Chi Minh City since 2021.', options: ['live', 'am living', 'have lived', 'lived'], correctIndex: 2 },
  { id: 'q8', level: 'B1', question: 'If I ___ more free time, I would practice speaking every day.', options: ['have', 'had', 'will have', 'would have'], correctIndex: 1 },
  { id: 'q9', level: 'B1', question: 'The report ___ by the manager before the meeting started.', options: ['reviewed', 'was reviewed', 'is reviewing', 'has review'], correctIndex: 1 },
  { id: 'q10', level: 'B2', question: 'She looks exhausted; she ___ all night for the presentation.', options: ['must work', 'should work', 'must have worked', 'can have worked'], correctIndex: 2 },
  { id: 'q11', level: 'B2', question: '___ the new system, the team became significantly more efficient.', options: ['Having implemented', 'Implemented', 'To implement', 'Have implemented'], correctIndex: 0 },
  { id: 'q12', level: 'B2', question: 'If they had negotiated more carefully, they ___ that consequence.', options: ['would avoid', 'will avoid', 'would have avoided', 'had avoided'], correctIndex: 2 },
];

@Injectable()
export class EnglishService {
  private seedingPromise: Promise<void> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  private parseJsonSafe<T>(raw: string): T {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  }

  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.englishProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.englishProfile.create({
        data: {
          userId,
          currentLevel: 'A1',
          placementDone: false,
          dailyMinutesTarget: 60,
          newWordsPerDay: 12,
          reviewWordsPerDay: 20,
          grammarPerDay: 1,
          preferredModel: 'gemini-3-flash-preview',
          currentDayNumber: 1,
        },
      });
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    data: {
      currentLevel?: string;
      dailyMinutesTarget?: number;
      newWordsPerDay?: number;
      reviewWordsPerDay?: number;
      grammarPerDay?: number;
      preferredModel?: string;
    },
  ) {
    await this.getOrCreateProfile(userId);
    return this.prisma.englishProfile.update({
      where: { userId },
      data,
    });
  }

  private async syncCurriculum() {
    const existingWords = await this.prisma.englishVocab.findMany({
      where: { scopeKey: 'GLOBAL' },
      select: { word: true },
    });
    const wordSet = new Set(existingWords.map((w) => w.word.trim().toLowerCase()));

    const toInsert: Array<{
      ownerId: null;
      scopeKey: string;
      word: string;
      ipa: string;
      meaning: string;
      partOfSpeech: string;
      cefrLevel: string;
      topic: string;
      exampleEn: string;
      exampleVi: string;
    }> = [];

    for (const item of ENGLISH_VOCAB_DATA) {
      const lower = item.word.trim().toLowerCase();
      if (!lower || wordSet.has(lower)) continue;
      wordSet.add(lower);
      toInsert.push({
        ownerId: null,
        scopeKey: 'GLOBAL',
        word: item.word.trim(),
        ipa: item.ipa || '',
        meaning: item.meaning || '',
        partOfSpeech: item.partOfSpeech || '',
        cefrLevel: item.cefrLevel,
        topic: item.topic || 'Daily Life & Greetings',
        exampleEn: item.exampleEn || '',
        exampleVi: item.exampleVi || '',
      });
    }

    let addedWords = 0;
    const CHUNK = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const res = await this.prisma.englishVocab.createMany({
        data: toInsert.slice(i, i + CHUNK),
        skipDuplicates: true,
      });
      addedWords += res.count;
    }

    const existingGrammarTitles = new Set(
      (await this.prisma.englishGrammar.findMany({ select: { title: true } })).map((g) => g.title),
    );
    let addedGrammar = 0;
    for (const g of ENGLISH_GRAMMAR_DATA) {
      if (existingGrammarTitles.has(g.title)) continue;
      await this.prisma.englishGrammar.create({
        data: {
          cefrLevel: g.cefrLevel,
          orderIndex: g.orderIndex,
          title: g.title,
          pattern: g.pattern,
          explanation: g.explanation,
          commonMistakes: g.commonMistakes,
          examples: g.examples,
        },
      });
      existingGrammarTitles.add(g.title);
      addedGrammar++;
    }

    return {
      addedWords,
      addedGrammar,
      message: `Đã đồng bộ +${addedWords} từ vựng tiếng Anh (A1-B2) và +${addedGrammar} điểm ngữ pháp.`,
    };
  }

  async ensureSeeded(): Promise<void> {
    if (this.seedingPromise) return this.seedingPromise;

    this.seedingPromise = (async () => {
      try {
        const [vocabCount, grammarCount] = await Promise.all([
          this.prisma.englishVocab.count({ where: { ownerId: null } }),
          this.prisma.englishGrammar.count(),
        ]);
        if (vocabCount < ENGLISH_VOCAB_DATA.length || grammarCount < ENGLISH_GRAMMAR_DATA.length) {
          await this.syncCurriculum();
        }
      } finally {
        this.seedingPromise = null;
      }
    })();

    return this.seedingPromise;
  }

  async getSummary(userId: string) {
    await this.ensureSeeded();
    const profile = await this.getOrCreateProfile(userId);
    const now = new Date();
    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };

    const [byLevel, userProgresses, dueReviewCount, grammarTotal, grammarMastered, recentLogs] =
      await Promise.all([
        this.prisma.englishVocab.groupBy({
          by: ['cefrLevel'],
          where: visibleFilter,
          _count: true,
        }),
        this.prisma.englishVocabProgress.findMany({
          where: { userId },
          select: { status: true, englishVocab: { select: { cefrLevel: true } } },
        }),
        this.prisma.englishVocabProgress.count({
          where: { userId, status: { not: 'new' }, nextReviewAt: { lte: now } },
        }),
        this.prisma.englishGrammar.count(),
        this.prisma.englishGrammarProgress.count({ where: { userId, status: 'mastered' } }),
        this.prisma.englishStudyLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

    const levelCounts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
    for (const row of byLevel) {
      levelCounts[row.cefrLevel] = row._count;
    }

    const levelBreakdowns: Record<string, Record<string, number>> = {
      A1: { new: 0, learning: 0, review: 0, mastered: 0 },
      A2: { new: 0, learning: 0, review: 0, mastered: 0 },
      B1: { new: 0, learning: 0, review: 0, mastered: 0 },
      B2: { new: 0, learning: 0, review: 0, mastered: 0 },
    };
    const tracked: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
    for (const p of userProgresses) {
      const lv = p.englishVocab.cefrLevel;
      if (!levelBreakdowns[lv]) continue;
      levelBreakdowns[lv][p.status] = (levelBreakdowns[lv][p.status] || 0) + 1;
      tracked[lv]++;
    }
    for (const lv of LEVEL_ORDER) {
      levelBreakdowns[lv].new += Math.max(0, (levelCounts[lv] || 0) - tracked[lv]);
    }

    return {
      profile,
      stats: {
        levelCounts,
        levelBreakdowns,
        totalWords: Object.values(levelCounts).reduce((a, b) => a + b, 0),
        dueReviewCount,
        grammarTotal,
        grammarMastered,
      },
      recentLogs,
    };
  }

  getPlacementTest() {
    return {
      questions: PLACEMENT_QUESTIONS.map(({ id, level, question, options }) => ({
        id,
        level,
        question,
        options,
      })),
      writingPrompts: [
        {
          id: 'w1',
          levelHint: 'A1-A2',
          vietnamese: 'Hôm qua tôi đã đi siêu thị và mua một ít hoa quả tươi.',
        },
        {
          id: 'w2',
          levelHint: 'B1-B2',
          vietnamese: 'Nếu tôi có nhiều thời gian hơn, tôi sẽ luyện nói tiếng Anh mỗi ngày để tự tin hơn.',
        },
      ],
    };
  }

  async submitPlacementTest(
    userId: string,
    body: {
      answers: Record<string, number>;
      writingSamples?: Record<string, string>;
      model?: string;
    },
  ) {
    let correctTotal = 0;
    const byLevel: Record<string, { correct: number; total: number }> = {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
    };

    for (const q of PLACEMENT_QUESTIONS) {
      byLevel[q.level].total++;
      if (body.answers?.[q.id] === q.correctIndex) {
        correctTotal++;
        byLevel[q.level].correct++;
      }
    }

    const scorePercent = Math.round((correctTotal / PLACEMENT_QUESTIONS.length) * 100);
    let recommendedLevel: 'A1' | 'A2' | 'B1' | 'B2' = 'A1';
    if (byLevel.A1.correct >= 2 && byLevel.A2.correct >= 2) {
      recommendedLevel = 'A2';
      if (byLevel.B1.correct >= 2) {
        recommendedLevel = 'B1';
        if (byLevel.B2.correct >= 2) {
          recommendedLevel = 'B2';
        }
      }
    }

    let aiAssessment = `Bạn đạt ${correctTotal}/${PLACEMENT_QUESTIONS.length} câu (${scorePercent}%). Mức xuất phát phù hợp nhất là ${recommendedLevel}.`;
    const sample1 = body.writingSamples?.w1?.trim() || '';
    const sample2 = body.writingSamples?.w2?.trim() || '';

    if (sample1 || sample2) {
      try {
        const prompt = `Học viên Việt Nam vừa làm bài kiểm tra đầu vào tiếng Anh (từ A1 đến B2):
- Điểm trắc nghiệm: ${correctTotal}/${PLACEMENT_QUESTIONS.length} (${scorePercent}%)
- Kết quả từng bậc: A1 (${byLevel.A1.correct}/3), A2 (${byLevel.A2.correct}/3), B1 (${byLevel.B1.correct}/3), B2 (${byLevel.B2.correct}/3)
- Câu dịch 1 (A1-A2): "${sample1 || 'Bỏ trống'}"
- Câu dịch 2 (B1-B2): "${sample2 || 'Bỏ trống'}"

Hãy đánh giá ngắn gọn trình độ thực tế của học viên và đưa ra lộ trình cá nhân hóa từ mức này lên B1-B2 bằng tiếng Việt. Trả về STRICT JSON:
{
  "recommendedLevel": "A1 hoặc A2 hoặc B1 hoặc B2",
  "assessment": "Nhận xét chi tiết điểm mạnh/điểm yếu và lộ trình học phù hợp"
}`;
        const raw = await this.geminiService.generateText(prompt, {
          model: body.model,
          systemInstruction: 'You are an English CEFR placement evaluator for Vietnamese learners. Output valid JSON only.',
          temperature: 0.3,
        });
        const parsed = this.parseJsonSafe<{ recommendedLevel: 'A1' | 'A2' | 'B1' | 'B2'; assessment: string }>(raw);
        if (LEVEL_ORDER.includes(parsed.recommendedLevel)) {
          recommendedLevel = parsed.recommendedLevel;
        }
        if (parsed.assessment) {
          aiAssessment = parsed.assessment;
        }
      } catch {
        // Keep heuristic assessment
      }
    }

    await this.getOrCreateProfile(userId);
    await this.prisma.englishProfile.update({
      where: { userId },
      data: {
        currentLevel: recommendedLevel,
        placementDone: true,
        placementScore: scorePercent,
      },
    });

    return {
      recommendedLevel,
      scorePercent,
      correctTotal,
      totalQuestions: PLACEMENT_QUESTIONS.length,
      byLevel,
      assessment: aiAssessment,
    };
  }

  async getTodayPlan(userId: string, requestedTopic?: string, requestedLevel?: string) {
    await this.ensureSeeded();
    const profile = await this.getOrCreateProfile(userId);
    const activeLevel =
      requestedLevel && LEVEL_ORDER.includes(requestedLevel as any)
        ? requestedLevel
        : profile.currentLevel;

    const now = new Date();
    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };

    // 1. Chặng 1: Ôn từ cũ đến hạn SRS của user
    const dueProgresses = await this.prisma.englishVocabProgress.findMany({
      where: {
        userId,
        status: { not: 'new' },
        nextReviewAt: { lte: now },
        englishVocab: visibleFilter,
      },
      include: { englishVocab: true },
      orderBy: [{ wrongCount: 'desc' }, { nextReviewAt: 'asc' }],
      take: profile.reviewWordsPerDay,
    });

    let reviewWords = dueProgresses.map((p) => ({
      ...p.englishVocab,
      status: p.status,
      srsLevel: p.srsLevel,
      wrongCount: p.wrongCount,
      lastMistakeNote: p.lastMistakeNote,
    }));

    if (reviewWords.length < profile.reviewWordsPerDay) {
      const pickedIds = reviewWords.map((r) => r.id);
      const extra = await this.prisma.englishVocabProgress.findMany({
        where: {
          userId,
          englishVocabId: { notIn: pickedIds },
          status: { not: 'new' },
          englishVocab: visibleFilter,
        },
        include: { englishVocab: true },
        orderBy: { lastReviewedAt: 'asc' },
        take: profile.reviewWordsPerDay - reviewWords.length,
      });
      reviewWords = [
        ...reviewWords,
        ...extra.map((p) => ({
          ...p.englishVocab,
          status: p.status,
          srsLevel: p.srsLevel,
          wrongCount: p.wrongCount,
          lastMistakeNote: p.lastMistakeNote,
        })),
      ];
    }

    // 2. Chặng 2: Gom từ mới ở trình độ activeLevel mà user chưa học
    const allNewAtLevel = await this.prisma.englishVocab.findMany({
      where: {
        ...visibleFilter,
        cefrLevel: activeLevel,
        NOT: {
          progresses: {
            some: {
              userId,
              status: { not: 'new' },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const topicGroups = new Map<string, typeof allNewAtLevel>();
    for (const w of allNewAtLevel) {
      const topic = w.topic?.trim() || 'Daily Life & Greetings';
      const arr = topicGroups.get(topic) || [];
      arr.push(w);
      topicGroups.set(topic, arr);
    }

    const availableTopics = Array.from(topicGroups.entries()).map(([topic, words]) => ({
      topic,
      remainingCount: words.length,
    }));

    const selectedTopic =
      requestedTopic && topicGroups.has(requestedTopic)
        ? requestedTopic
        : availableTopics[0]?.topic || 'Daily Life & Greetings';

    let newWords = (topicGroups.get(selectedTopic) || []).slice(0, profile.newWordsPerDay);
    if (newWords.length < profile.newWordsPerDay && allNewAtLevel.length > newWords.length) {
      const ids = new Set(newWords.map((w) => w.id));
      const extras = allNewAtLevel
        .filter((w) => !ids.has(w.id))
        .slice(0, profile.newWordsPerDay - newWords.length);
      newWords = [...newWords, ...extras];
    }

    // 3. Chặng 3: Ngữ pháp theo cấp độ & tiến độ của user
    const levelGrammars = await this.prisma.englishGrammar.findMany({
      where: { cefrLevel: activeLevel },
      include: { progresses: { where: { userId } } },
      orderBy: { orderIndex: 'asc' },
    });

    const grammarPoints = levelGrammars
      .map((g) => ({
        ...g,
        status: (g.progresses[0]?.status || 'new') as 'new' | 'learning' | 'mastered',
      }))
      .filter((g) => g.status !== 'mastered')
      .slice(0, profile.grammarPerDay);

    const total = profile.dailyMinutesTarget;
    return {
      profile,
      activeLevel,
      currentTopic: selectedTopic,
      availableTopics,
      schedule: {
        reviewMinutes: Math.round(total * 0.2),
        newWordsMinutes: Math.round(total * 0.3),
        grammarMinutes: Math.round(total * 0.2),
        mixedPracticeMinutes: Math.round(total * 0.3),
      },
      reviewWords,
      newWords,
      grammarPoints,
    };
  }

  async submitSrsReview(
    userId: string,
    englishVocabId: string,
    quality: 'again' | 'hard' | 'good' | 'easy',
  ) {
    const vocab = await this.prisma.englishVocab.findFirst({
      where: {
        id: englishVocabId,
        OR: [{ ownerId: null }, { ownerId: userId }],
      },
    });
    if (!vocab) throw new NotFoundException('Không tìm thấy từ vựng tiếng Anh.');

    const prev = await this.prisma.englishVocabProgress.upsert({
      where: { userId_englishVocabId: { userId, englishVocabId } },
      create: { userId, englishVocabId, status: 'new' },
      update: {},
    });

    let srsLevel = prev.srsLevel;
    let intervalDays = prev.intervalDays;
    let easeFactor = prev.easeFactor;
    let correctCount = prev.correctCount;
    let wrongCount = prev.wrongCount;

    if (quality === 'again') {
      srsLevel = 0;
      intervalDays = 0.5;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      wrongCount++;
    } else if (quality === 'hard') {
      srsLevel = Math.max(1, srsLevel);
      intervalDays = Math.max(1, intervalDays * 1.2 || 1);
      correctCount++;
    } else if (quality === 'good') {
      srsLevel += 1;
      const steps = [1, 3, 7, 14, 30];
      intervalDays = steps[Math.min(srsLevel - 1, steps.length - 1)];
      correctCount++;
    } else {
      srsLevel += 2;
      const steps = [3, 7, 15, 30, 60];
      intervalDays = steps[Math.min(srsLevel - 1, steps.length - 1)];
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      correctCount++;
    }

    const status =
      quality === 'again'
        ? 'learning'
        : srsLevel >= 4
          ? 'mastered'
          : srsLevel >= 2
            ? 'review'
            : 'learning';

    return this.prisma.englishVocabProgress.update({
      where: { userId_englishVocabId: { userId, englishVocabId } },
      data: {
        status,
        srsLevel,
        intervalDays,
        easeFactor,
        nextReviewAt: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
        lastReviewedAt: new Date(),
        reviewCount: prev.reviewCount + 1,
        correctCount,
        wrongCount,
      },
    });
  }

  async getWordDeepDive(userId: string, englishVocabId: string, model?: string) {
    const vocab = await this.prisma.englishVocab.findFirst({
      where: {
        id: englishVocabId,
        OR: [{ ownerId: null }, { ownerId: userId }],
      },
    });
    if (!vocab) throw new NotFoundException('Không tìm thấy từ vựng tiếng Anh.');

    const progress = await this.prisma.englishVocabProgress.findUnique({
      where: { userId_englishVocabId: { userId, englishVocabId } },
    });

    if (progress?.aiDeepDive) {
      return { cached: true, word: vocab.word, deepDive: progress.aiDeepDive };
    }

    const prompt = `Phân tích chuyên sâu từ tiếng Anh trình độ ${vocab.cefrLevel} cho người Việt:
- Từ: ${vocab.word} (${vocab.ipa || ''})
- Nghĩa: ${vocab.meaning} (${vocab.partOfSpeech})

Trả về STRICT JSON:
{
  "pronunciationTip": "Mẹo phát âm chuẩn (trọng âm, âm cuối hay bị người Việt bỏ sót)",
  "memoryHook": "Mẹo liên tưởng hoặc gốc từ (prefix/root/suffix) để nhớ sâu",
  "collocations": [
    { "phrase": "cụm từ hay đi kèm", "meaning": "nghĩa tiếng Việt" }
  ],
  "commonTrap": "Lỗi người Việt hay mắc khi dùng từ này",
  "examples": [
    { "english": "Câu ví dụ tự nhiên", "vietnamese": "Nghĩa tiếng Việt" }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model,
      systemInstruction: 'You are an English tutor for Vietnamese learners. Output valid JSON only.',
      temperature: 0.4,
    });
    const parsed = this.parseJsonSafe(raw);

    await this.prisma.englishVocabProgress.upsert({
      where: { userId_englishVocabId: { userId, englishVocabId } },
      create: {
        userId,
        englishVocabId,
        status: 'new',
        aiDeepDive: parsed as any,
      },
      update: { aiDeepDive: parsed as any },
    });

    return { cached: false, word: vocab.word, deepDive: parsed };
  }

  async generateTopicDialogue(
    userId: string,
    body: {
      newWordIds: string[];
      oldWordIds?: string[];
      topic?: string;
      cefrLevel?: string;
      model?: string;
    },
  ) {
    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };
    const [newWords, oldWords, extraLearned] = await Promise.all([
      this.prisma.englishVocab.findMany({
        where: { ...visibleFilter, id: { in: body.newWordIds || [] } },
      }),
      body.oldWordIds?.length
        ? this.prisma.englishVocab.findMany({
            where: { ...visibleFilter, id: { in: body.oldWordIds } },
          })
        : Promise.resolve([]),
      this.prisma.englishVocab.findMany({
        where: { ...visibleFilter, cefrLevel: 'A1' },
        take: 25,
      }),
    ]);

    if (newWords.length === 0) {
      throw new BadRequestException('Không có từ mới nào để tạo hội thoại.');
    }

    const newList = newWords.map((w) => `${w.word} (${w.meaning})`).join(', ');
    const oldPool = Array.from(new Set([...oldWords, ...extraLearned].map((w) => `${w.word} (${w.meaning})`)))
      .slice(0, 30)
      .join(', ');

    const prompt = `Bạn là giáo viên tiếng Anh CEFR ${body.cefrLevel || 'A1-B2'} cho người Việt.
Hãy tạo một đoạn hội thoại giao tiếp tự nhiên (6-10 lượt thoại giữa A và B) theo chủ đề "${body.topic || 'Daily Life'}":
- Từ mới hôm nay (ĐƯA VÀO TỐI ĐA): [${newList}]
- Từ cũ (TÁI SỬ DỤNG LẶP LẠI NHIỀU ĐỂ DỄ NHỚ): [${oldPool}]

Và 4 mẫu câu ngắn (keySentences) dễ thuộc lòng kết hợp từ mới + từ cũ.
Trả về STRICT JSON:
{
  "dialogueTitle": "Tiêu đề đoạn hội thoại",
  "context": "Bối cảnh ngắn bằng tiếng Việt",
  "topicConnectionNote": "Giải thích ngắn cách các từ mới liên kết với nhau theo chủ đề",
  "dialogue": [
    { "speaker": "A", "english": "Natural English sentence", "vietnamese": "Nghĩa tiếng Việt", "usedNewWords": ["word1"] }
  ],
  "keySentences": [
    { "english": "Short memorable sentence", "vietnamese": "Nghĩa tiếng Việt" }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model: body.model,
      systemInstruction: 'You are an English conversation designer. Output valid JSON only.',
      temperature: 0.45,
    });

    return this.parseJsonSafe(raw);
  }

  async generateMixedPractice(
    userId: string,
    body: {
      newWordIds: string[];
      reviewWordIds: string[];
      grammarIds: string[];
      cefrLevel?: string;
      model?: string;
    },
  ) {
    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };
    const [newWords, reviewWords, grammars] = await Promise.all([
      this.prisma.englishVocab.findMany({ where: { ...visibleFilter, id: { in: body.newWordIds || [] } } }),
      this.prisma.englishVocab.findMany({ where: { ...visibleFilter, id: { in: body.reviewWordIds || [] } } }),
      this.prisma.englishGrammar.findMany({ where: { id: { in: body.grammarIds || [] } } }),
    ]);

    const newList = newWords.map((w) => `${w.word} (${w.meaning})`).join(', ');
    const oldList = reviewWords.slice(0, 15).map((w) => `${w.word} (${w.meaning})`).join(', ');
    const grammarText = grammars.map((g) => `${g.title}: ${g.pattern}`).join(' | ');

    const prompt = `Tạo bộ bài tập luyện viết tiếng Anh trình độ ${body.cefrLevel || 'A1-B2'} cho người Việt:
- Từ mới hôm nay: [${newList}]
- Từ cũ ôn tập: [${oldList}]
- Ngữ pháp trọng tâm: [${grammarText || 'Cơ bản'}]

Yêu cầu:
1. 15 câu dịch Việt -> Anh kết hợp từ mới + từ cũ + ngữ pháp trọng tâm.
2. 3 đề bài viết câu tự do (freePrompts) cho sẵn 2-3 từ khóa.

Trả về STRICT JSON:
{
  "translationExercises": [
    { "vietnamese": "Câu tiếng Việt", "referenceEnglish": "Natural English sentence", "targetWords": ["word1"], "grammarHint": "Gợi ý ngữ pháp" }
  ],
  "freePrompts": [
    { "instruction": "Yêu cầu đặt câu tiếng Việt", "targetWords": ["word1", "word2"], "grammarTitle": "Tên ngữ pháp" }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model: body.model,
      systemInstruction: 'You are an English exercise designer. Output valid JSON only.',
      temperature: 0.4,
    });

    return this.parseJsonSafe(raw);
  }

  async evaluateAttempt(body: {
    promptVietnamese: string;
    referenceEnglish?: string;
    targetWords?: string[];
    grammarTitle?: string;
    userEnglish: string;
    cefrLevel?: string;
    model?: string;
  }) {
    if (!body.userEnglish?.trim()) {
      throw new BadRequestException('Vui lòng nhập câu tiếng Anh để AI đánh giá.');
    }

    const prompt = `Bạn là gia sư tiếng Anh 1 kèm 1 cho học viên Việt Nam (trình độ mục tiêu ${body.cefrLevel || 'A1-B2'}).
Hãy chấm điểm & nhận xét CÁ NHÂN HÓA câu tiếng Anh sau:
- Đề bài: "${body.promptVietnamese}"
${body.referenceEnglish ? `- Đáp án tham khảo: "${body.referenceEnglish}"` : ''}
${body.targetWords?.length ? `- Từ mục tiêu: [${body.targetWords.join(', ')}]` : ''}
${body.grammarTitle ? `- Ngữ pháp: "${body.grammarTitle}"` : ''}
- Câu học viên viết: "${body.userEnglish.trim()}"

Trả về STRICT JSON:
{
  "score": 85,
  "isCorrect": true,
  "correctedEnglish": "Câu tiếng Anh tự nhiên & chuẩn xác nhất",
  "grammarFeedback": "Nhận xét chi tiết ngữ pháp",
  "vocabFeedback": "Nhận xét cách dùng từ & collocations",
  "naturalnessFeedback": "Người bản xứ có nói vậy không?",
  "personalizedTip": "1 lời khuyên cá nhân hóa ngắn gọn",
  "weakWordsDetected": ["từ dùng sai nếu có"]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model: body.model,
      systemInstruction: 'You are a supportive 1-on-1 English tutor for Vietnamese learners. Output valid JSON only.',
      temperature: 0.3,
    });

    return this.parseJsonSafe(raw);
  }

  async evaluateBatch(body: {
    items: Array<{
      key: string;
      promptVietnamese: string;
      referenceEnglish?: string;
      targetWords?: string[];
      grammarTitle?: string;
      userEnglish: string;
    }>;
    cefrLevel?: string;
    model?: string;
  }) {
    const validItems = (body.items || []).filter((i) => i.userEnglish && i.userEnglish.trim());
    if (validItems.length === 0) {
      throw new BadRequestException('Vui lòng viết ít nhất 1 câu tiếng Anh trước khi chấm bài.');
    }

    const itemsText = validItems
      .map(
        (item, idx) =>
          `${idx + 1}. [key="${item.key}"] Đề: "${item.promptVietnamese}" | Mục tiêu: [${(item.targetWords || []).join(', ')}] | Ngữ pháp: "${item.grammarTitle || ''}" | Học viên viết: "${item.userEnglish.trim()}"`,
      )
      .join('\n');

    const prompt = `Bạn là gia sư tiếng Anh 1 kèm 1 cho học viên Việt Nam (trình độ mục tiêu ${body.cefrLevel || 'A1-B2'}).
Hãy chấm điểm và nhận xét CÁ NHÂN HÓA TẤT CẢ ${validItems.length} câu sau trong một lần:
${itemsText}

Trả về STRICT JSON:
{
  "overallScore": 85,
  "overallComment": "Nhận xét tổng quan 2-3 câu",
  "results": [
    {
      "key": "đúng key ở trên",
      "score": 85,
      "isCorrect": true,
      "correctedEnglish": "Câu tiếng Anh tự nhiên & chuẩn xác nhất",
      "grammarFeedback": "Nhận xét ngắn gọn ngữ pháp",
      "vocabFeedback": "Nhận xét ngắn gọn từ vựng",
      "personalizedTip": "1 mẹo nhớ ngắn"
    }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model: body.model,
      systemInstruction: 'You are a supportive 1-on-1 English tutor grading a batch of exercises. Output valid JSON only.',
      temperature: 0.3,
    });

    return this.parseJsonSafe(raw);
  }

  async completeDailySession(
    userId: string,
    body: {
      minutesSpent: number;
      newWordsLearned: number;
      wordsReviewed: number;
      averageScore?: number;
      model?: string;
    },
  ) {
    const profile = await this.getOrCreateProfile(userId);
    const today = new Date().toISOString().slice(0, 10);

    let aiCoachingFeedback: any = {
      headline: `Hoàn thành Ngày ${profile.currentDayNumber} (${profile.currentLevel})!`,
      strengths: `Bạn đã ôn ${body.wordsReviewed} từ cũ và học ${body.newWordsLearned} từ mới.`,
      areasToImprove: 'Tiếp tục luyện đặt câu và nghe phát âm để phản xạ nhanh hơn.',
      tomorrowFocus: 'Ngày mai giữ nhịp ôn SRS và tăng dần câu phức.',
    };

    try {
      const prompt = `Cố vấn học tiếng Anh cá nhân hóa. Học viên ở trình độ ${profile.currentLevel} vừa xong Ngày ${profile.currentDayNumber}:
- Thời gian: ${body.minutesSpent} phút | Từ mới: ${body.newWordsLearned} | Từ cũ ôn: ${body.wordsReviewed} | Điểm TB: ${body.averageScore ?? 'Chưa chấm'}.
Trả về STRICT JSON: { "headline": "...", "strengths": "...", "areasToImprove": "...", "tomorrowFocus": "..." }`;
      const raw = await this.geminiService.generateText(prompt, {
        model: body.model || profile.preferredModel,
        systemInstruction: 'You are an English study coach. Output valid JSON only.',
        temperature: 0.4,
      });
      aiCoachingFeedback = this.parseJsonSafe(raw);
    } catch {
      // Fallback already set
    }

    const log = await this.prisma.englishStudyLog.create({
      data: {
        userId,
        date: today,
        dayNumber: profile.currentDayNumber,
        level: profile.currentLevel,
        minutesSpent: body.minutesSpent,
        newWordsLearned: body.newWordsLearned,
        wordsReviewed: body.wordsReviewed,
        score: body.averageScore ?? null,
        aiCoachingFeedback,
      },
    });

    await this.prisma.englishProfile.update({
      where: { userId },
      data: { currentDayNumber: profile.currentDayNumber + 1 },
    });

    return log;
  }

  async getVocabList(userId: string, level?: string) {
    await this.ensureSeeded();
    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };
    const where =
      level && LEVEL_ORDER.includes(level as any)
        ? { ...visibleFilter, cefrLevel: level }
        : visibleFilter;

    const words = await this.prisma.englishVocab.findMany({
      where,
      include: { progresses: { where: { userId } } },
      orderBy: { createdAt: 'asc' },
    });

    return words.map((w) => ({
      id: w.id,
      word: w.word,
      ipa: w.ipa,
      meaning: w.meaning,
      partOfSpeech: w.partOfSpeech,
      cefrLevel: w.cefrLevel,
      topic: w.topic,
      exampleEn: w.exampleEn,
      exampleVi: w.exampleVi,
      status: w.progresses[0]?.status || 'new',
      srsLevel: w.progresses[0]?.srsLevel || 0,
    }));
  }

  async getGrammarList(userId: string, level?: string) {
    await this.ensureSeeded();
    const grammars = await this.prisma.englishGrammar.findMany({
      where: level && LEVEL_ORDER.includes(level as any) ? { cefrLevel: level } : undefined,
      include: { progresses: { where: { userId } } },
      orderBy: [{ orderIndex: 'asc' }],
    });

    return grammars.map((g) => ({
      id: g.id,
      cefrLevel: g.cefrLevel,
      orderIndex: g.orderIndex,
      title: g.title,
      pattern: g.pattern,
      explanation: g.explanation,
      commonMistakes: g.commonMistakes,
      examples: g.examples,
      status: (g.progresses[0]?.status || 'new') as 'new' | 'learning' | 'mastered',
      practiceCount: g.progresses[0]?.practiceCount || 0,
      lastPracticedAt: g.progresses[0]?.lastPracticedAt || null,
    }));
  }

  async updateGrammarStatus(
    userId: string,
    id: string,
    status: 'new' | 'learning' | 'mastered',
  ) {
    const existing = await this.prisma.englishGrammar.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy điểm ngữ pháp.');

    const prev = await this.prisma.englishGrammarProgress.findUnique({
      where: { userId_englishGrammarId: { userId, englishGrammarId: id } },
    });

    return this.prisma.englishGrammarProgress.upsert({
      where: { userId_englishGrammarId: { userId, englishGrammarId: id } },
      create: {
        userId,
        englishGrammarId: id,
        status,
        practiceCount: 1,
        lastPracticedAt: new Date(),
      },
      update: {
        status,
        practiceCount: (prev?.practiceCount || 0) + 1,
        lastPracticedAt: new Date(),
      },
    });
  }
}
