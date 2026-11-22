import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { PinyinService } from '../chinese/pinyin.service';
import { HSK_VOCAB_DATA } from './data/hsk-curriculum.data';
import { HSK1_GRAMMAR_DATA } from './data/hsk1-grammar.data';
import { HSK2_GRAMMAR_DATA } from './data/hsk2-grammar.data';
import { HSK3_GRAMMAR_DATA } from './data/hsk3-grammar.data';

const HSK_LEVELS = ['HSK1', 'HSK2', 'HSK3'] as const;
type HskLevel = (typeof HSK_LEVELS)[number];

@Injectable()
export class CurriculumService {
  private readonly wordTopicMap: Map<string, string>;
  private seedingPromise: Promise<void> | null = null;
  private isSeeded = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly pinyinService: PinyinService,
  ) {
    this.wordTopicMap = new Map(HSK_VOCAB_DATA.map((item) => [item.word.trim(), item.topic]));
  }

  private parseJsonSafe<T>(raw: string): T {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  }

  private normalizeLevel(level?: string): HskLevel {
    const upper = (level || '').trim().toUpperCase();
    return (HSK_LEVELS as readonly string[]).includes(upper) ? (upper as HskLevel) : 'HSK1';
  }

  async ensureSeeded(): Promise<void> {
    if (this.isSeeded) return;
    if (this.seedingPromise) return this.seedingPromise;

    this.seedingPromise = (async () => {
      try {
        const [vocabCount, grammarCount] = await Promise.all([
          this.prisma.vocabulary.count({ where: { ownerId: null } }),
          this.prisma.grammarPoint.count(),
        ]);
        const expectedGrammar =
          HSK1_GRAMMAR_DATA.length + HSK2_GRAMMAR_DATA.length + HSK3_GRAMMAR_DATA.length;

        if (vocabCount < HSK_VOCAB_DATA.length || grammarCount < expectedGrammar) {
          await this.syncCurriculum();
        }
        this.isSeeded = true;
      } finally {
        this.seedingPromise = null;
      }
    })();

    return this.seedingPromise;
  }

  private async syncCurriculum() {
    // 1. Lấy tất cả từ GLOBAL hiện có để tránh trùng (theo word hoặc word+pos)
    const existingGlobal = await this.prisma.vocabulary.findMany({
      where: { scopeKey: 'GLOBAL' },
      select: { id: true, word: true, partOfSpeech: true, topic: true, level: true },
    });

    const existingWordsOnly = new Set(existingGlobal.map((v) => v.word.trim()));
    const existingKeys = new Set(
      existingGlobal.map((v) => `${v.word.trim()}|||${v.partOfSpeech || ''}`),
    );

    // Cập nhật topic cho các từ cũ nếu chưa có topic
    const topicUpdates = existingGlobal.filter(
      (v) => (!v.topic || v.topic === '') && this.wordTopicMap.has(v.word.trim()),
    );
    for (const row of topicUpdates) {
      const topic = this.wordTopicMap.get(row.word.trim());
      if (topic) {
        await this.prisma.vocabulary.update({
          where: { id: row.id },
          data: { topic },
        });
      }
    }

    // 2. Chèn hàng loạt các từ HSK 1, 2, 3 (3.0) còn thiếu
    const toInsert: Array<{
      ownerId: null;
      scopeKey: string;
      word: string;
      meaning: string;
      pinyin: string;
      partOfSpeech: string;
      level: string;
      topic: string;
    }> = [];

    for (const item of HSK_VOCAB_DATA) {
      const w = item.word.trim();
      const pos = item.partOfSpeech?.trim() || '';
      const key = `${w}|||${pos}`;
      // Tránh tạo bản sao nếu từ đã tồn tại ở kho GLOBAL (kể cả khi bản cũ chưa có POS)
      if (existingKeys.has(key) || existingWordsOnly.has(w)) continue;

      existingKeys.add(key);
      existingWordsOnly.add(w);

      toInsert.push({
        ownerId: null,
        scopeKey: 'GLOBAL',
        word: w,
        meaning: item.meaning.trim(),
        pinyin: item.pinyin?.trim() || this.pinyinService.generatePinyin(w),
        partOfSpeech: pos,
        level: item.level,
        topic: item.topic || 'Từ vựng cốt lõi',
      });
    }

    let addedWords = 0;
    const CHUNK = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const res = await this.prisma.vocabulary.createMany({
        data: toInsert.slice(i, i + CHUNK),
        skipDuplicates: true,
      });
      addedWords += res.count;
    }

    // 3. Đồng bộ ngữ pháp HSK 1, HSK 2, HSK 3 (3.0)
    const allGrammar = [
      ...HSK1_GRAMMAR_DATA.map((g) => ({ ...g, level: 'HSK1' })),
      ...HSK2_GRAMMAR_DATA.map((g) => ({ ...g, level: 'HSK2' })),
      ...HSK3_GRAMMAR_DATA.map((g) => ({ ...g, level: 'HSK3' })),
    ];

    const existingGrammarTitles = new Set(
      (await this.prisma.grammarPoint.findMany({ select: { title: true } })).map((g) => g.title),
    );

    const grammarToInsert = allGrammar
      .filter((g) => !existingGrammarTitles.has(g.title))
      .map((g) => ({
        level: g.level,
        unitNumber: g.unitNumber,
        orderIndex: g.orderIndex,
        title: g.title,
        pattern: g.pattern,
        explanation: g.explanation,
        commonMistakes: g.commonMistakes,
        examples: g.examples,
      }));

    let addedGrammar = 0;
    if (grammarToInsert.length > 0) {
      const res = await this.prisma.grammarPoint.createMany({
        data: grammarToInsert,
        skipDuplicates: true,
      });
      addedGrammar = res.count;
    }

    const [hsk1Total, hsk2Total, hsk3Total] = await Promise.all([
      this.prisma.vocabulary.count({ where: { scopeKey: 'GLOBAL', level: 'HSK1' } }),
      this.prisma.vocabulary.count({ where: { scopeKey: 'GLOBAL', level: 'HSK2' } }),
      this.prisma.vocabulary.count({ where: { scopeKey: 'GLOBAL', level: 'HSK3' } }),
    ]);

    return {
      addedWords,
      addedGrammar,
      hsk1Total,
      hsk2Total,
      hsk3Total,
      message: `Đã đồng bộ +${addedWords} từ HSK 3.0 (HSK1: ${hsk1Total}, HSK2: ${hsk2Total}, HSK3: ${hsk3Total}) và +${addedGrammar} điểm ngữ pháp.`,
    };
  }

  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.studyProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.studyProfile.create({
        data: {
          userId,
          currentLevel: 'HSK1',
          dailyMinutesTarget: 90,
          newWordsPerDay: 15,
          reviewWordsPerDay: 25,
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
    const cleanData: Record<string, any> = {};
    if (data.currentLevel !== undefined) cleanData.currentLevel = this.normalizeLevel(data.currentLevel);
    if (data.dailyMinutesTarget !== undefined) cleanData.dailyMinutesTarget = data.dailyMinutesTarget;
    if (data.newWordsPerDay !== undefined) cleanData.newWordsPerDay = data.newWordsPerDay;
    if (data.reviewWordsPerDay !== undefined) cleanData.reviewWordsPerDay = data.reviewWordsPerDay;
    if (data.grammarPerDay !== undefined) cleanData.grammarPerDay = data.grammarPerDay;
    if (data.preferredModel !== undefined) cleanData.preferredModel = data.preferredModel.trim();
    return this.prisma.studyProfile.update({
      where: { userId },
      data: cleanData,
    });
  }

  async getDashboardSummary(userId: string) {
    await this.ensureSeeded();
    const profile = await this.getOrCreateProfile(userId);
    const now = new Date();

    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };

    const [
      hsk1Count,
      hsk2Count,
      hsk3Count,
      progressByLevelAndStatus,
      dueReviewCount,
      grammarTotal,
      grammarMastered,
      recentLogs,
      totalLogs,
    ] = await Promise.all([
      this.prisma.vocabulary.count({ where: { ...visibleFilter, level: 'HSK1' } }),
      this.prisma.vocabulary.count({ where: { ...visibleFilter, level: 'HSK2' } }),
      this.prisma.vocabulary.count({ where: { ...visibleFilter, level: 'HSK3' } }),
      this.prisma.vocabProgress.findMany({
        where: { userId, vocabulary: { level: { in: ['HSK1', 'HSK2', 'HSK3'] } } },
        select: { status: true, vocabulary: { select: { level: true } } },
      }),
      this.prisma.vocabProgress.count({
        where: {
          userId,
          status: { not: 'new' },
          nextReviewAt: { lte: now },
        },
      }),
      this.prisma.grammarPoint.count(),
      this.prisma.grammarProgress.count({ where: { userId, status: 'mastered' } }),
      this.prisma.studyLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.studyLog.count({ where: { userId } }),
    ]);

    const levelTotals: Record<HskLevel, number> = {
      HSK1: hsk1Count,
      HSK2: hsk2Count,
      HSK3: hsk3Count,
    };

    const levelBreakdowns: Record<HskLevel, Record<string, number>> = {
      HSK1: { new: 0, learning: 0, review: 0, mastered: 0 },
      HSK2: { new: 0, learning: 0, review: 0, mastered: 0 },
      HSK3: { new: 0, learning: 0, review: 0, mastered: 0 },
    };

    const trackedPerLevel: Record<HskLevel, number> = { HSK1: 0, HSK2: 0, HSK3: 0 };
    for (const row of progressByLevelAndStatus) {
      const lv = row.vocabulary.level as HskLevel;
      if (!levelBreakdowns[lv]) continue;
      const st = row.status || 'new';
      levelBreakdowns[lv][st] = (levelBreakdowns[lv][st] || 0) + 1;
      trackedPerLevel[lv]++;
    }

    for (const lv of HSK_LEVELS) {
      levelBreakdowns[lv].new += Math.max(0, levelTotals[lv] - trackedPerLevel[lv]);
    }

    return {
      profile,
      stats: {
        hsk1Count,
        hsk2Count,
        hsk3Count,
        hsk1Target: 500,
        hsk2Target: 772,
        hsk3Target: 973,
        builtInBankCount: HSK_VOCAB_DATA.length,
        levelBreakdowns,
        hsk2Breakdown: levelBreakdowns.HSK2,
        dueReviewCount,
        grammarTotal,
        grammarMastered,
      },
      recentLogs,
      totalLogs,
    };
  }

  async getStudyLogs(userId: string, limit = 100) {
    return this.prisma.studyLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTodayPlan(userId: string, requestedTopic?: string, requestedLevel?: string) {
    await this.ensureSeeded();
    const profile = await this.getOrCreateProfile(userId);
    const activeLevel = requestedLevel
      ? this.normalizeLevel(requestedLevel)
      : this.normalizeLevel(profile.currentLevel);
    const now = new Date();
    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };

    const progressBriefSelect = {
      id: true,
      status: true,
      srsLevel: true,
      intervalDays: true,
      easeFactor: true,
      nextReviewAt: true,
      lastReviewedAt: true,
      reviewCount: true,
      correctCount: true,
      wrongCount: true,
      lastMistakeNote: true,
    } as const;

    // 1 & 2 & 3: Chạy song song 3 truy vấn chính độc lập để giảm số vòng RTT qua DB
    const [dueProgresses, unlearnedLight, levelGrammar] = await Promise.all([
      this.prisma.vocabProgress.findMany({
        where: {
          userId,
          status: { not: 'new' },
          nextReviewAt: { lte: now },
          vocabulary: visibleFilter,
        },
        select: { ...progressBriefSelect, vocabulary: true },
        orderBy: [{ wrongCount: 'desc' }, { nextReviewAt: 'asc' }],
        take: profile.reviewWordsPerDay,
      }),
      this.prisma.vocabulary.findMany({
        where: {
          ...visibleFilter,
          level: activeLevel,
          NOT: {
            progresses: {
              some: {
                userId,
                status: { not: 'new' },
              },
            },
          },
        },
        select: { id: true, word: true, topic: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.grammarPoint.findMany({
        where: { level: activeLevel },
        include: { progresses: { where: { userId } } },
        orderBy: [{ unitNumber: 'asc' }, { orderIndex: 'asc' }],
      }),
    ]);

    let reviewList: Array<any> = dueProgresses.map(({ vocabulary, ...prog }) => ({
      ...vocabulary,
      progress: prog,
    }));

    const topicGroups = new Map<string, string[]>();
    const allUnlearnedIds: string[] = [];
    for (const w of unlearnedLight) {
      allUnlearnedIds.push(w.id);
      const topic = w.topic?.trim() || this.wordTopicMap.get(w.word.trim()) || 'Từ vựng mở rộng';
      const arr = topicGroups.get(topic) || [];
      arr.push(w.id);
      topicGroups.set(topic, arr);
    }

    const availableTopics = Array.from(topicGroups.entries()).map(([topic, ids]) => ({
      topic,
      remainingCount: ids.length,
    }));

    const selectedTopic =
      requestedTopic && topicGroups.has(requestedTopic)
        ? requestedTopic
        : availableTopics[0]?.topic || 'Giao tiếp & Cảm xúc';

    let pickedNewIds = (topicGroups.get(selectedTopic) || []).slice(0, profile.newWordsPerDay);

    if (pickedNewIds.length < profile.newWordsPerDay && allUnlearnedIds.length > pickedNewIds.length) {
      const pickedSet = new Set(pickedNewIds);
      const extras = allUnlearnedIds
        .filter((id) => !pickedSet.has(id))
        .slice(0, profile.newWordsPerDay - pickedNewIds.length);
      pickedNewIds = [...pickedNewIds, ...extras];
    }

    // Chạy song song truy vấn bổ sung review (nếu thiếu) và chi tiết các từ mới hôm nay
    const remainingReviewNeed = Math.max(0, profile.reviewWordsPerDay - reviewList.length);
    const pickedReviewIds = reviewList.map((r) => r.id);

    const [extraStartedRes, selectedVocabsRes] = await Promise.all([
      remainingReviewNeed > 0
        ? this.prisma.vocabProgress.findMany({
            where: {
              userId,
              vocabularyId: { notIn: pickedReviewIds },
              status: { not: 'new' },
              vocabulary: visibleFilter,
            },
            select: { ...progressBriefSelect, vocabulary: true },
            orderBy: [{ lastReviewedAt: 'asc' }],
            take: remainingReviewNeed,
          })
        : null,
      pickedNewIds.length > 0
        ? this.prisma.vocabulary.findMany({
            where: { id: { in: pickedNewIds } },
            include: { progresses: { where: { userId }, select: progressBriefSelect } },
          })
        : null,
    ]);

    const extraStarted = extraStartedRes ?? [];
    const selectedVocabs = selectedVocabsRes ?? [];

    if (extraStarted.length > 0) {
      reviewList = [
        ...reviewList,
        ...extraStarted.map(({ vocabulary, ...prog }) => ({ ...vocabulary, progress: prog })),
      ];
    }

    if (reviewList.length < profile.reviewWordsPerDay && activeLevel !== 'HSK1') {
      const lowerLevels = activeLevel === 'HSK2' ? ['HSK1'] : ['HSK1', 'HSK2'];
      const pickedIds = reviewList.map((r) => r.id);
      const extraFoundation = await this.prisma.vocabulary.findMany({
        where: {
          ...visibleFilter,
          id: { notIn: pickedIds },
          level: { in: lowerLevels },
        },
        include: {
          progresses: { where: { userId }, select: progressBriefSelect },
        },
        orderBy: { createdAt: 'asc' },
        take: profile.reviewWordsPerDay - reviewList.length,
      });

      reviewList = [
        ...reviewList,
        ...extraFoundation.map((v) => ({
          ...v,
          progress: v.progresses[0] || null,
        })),
      ];
    }

    const selectedById = new Map(selectedVocabs.map((v) => [v.id, v]));

    const newWordsWithTopic = pickedNewIds
      .map((id) => selectedById.get(id))
      .filter((w): w is NonNullable<typeof w> => Boolean(w))
      .map((w) => ({
        ...w,
        progress: w.progresses[0] || null,
        topic: w.topic?.trim() || this.wordTopicMap.get(w.word.trim()) || 'Từ vựng mở rộng',
      }));

    const grammarPoints = levelGrammar
      .map((g) => ({
        ...g,
        status: (g.progresses[0]?.status || 'new') as 'new' | 'learning' | 'mastered',
        practiceCount: g.progresses[0]?.practiceCount || 0,
        lastPracticedAt: g.progresses[0]?.lastPracticedAt || null,
      }))
      .filter((g) => g.status !== 'mastered')
      .slice(0, profile.grammarPerDay);

    const totalMinutes = profile.dailyMinutesTarget;
    const schedule = {
      reviewMinutes: Math.round(totalMinutes * 0.22),
      newWordsMinutes: Math.round(totalMinutes * 0.28),
      grammarMinutes: Math.round(totalMinutes * 0.17),
      mixedPracticeMinutes: Math.round(totalMinutes * 0.33),
    };

    return {
      profile,
      activeLevel,
      schedule,
      currentTopic: selectedTopic,
      availableTopics,
      reviewWords: reviewList,
      newWords: newWordsWithTopic,
      grammarPoints,
    };
  }

  async generateTopicDialogue(
    userId: string,
    body: {
      newWordIds: string[];
      oldWordIds?: string[];
      topic?: string;
      level?: string;
      model?: string;
    },
  ) {
    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };
    const level = this.normalizeLevel(body.level);

    const [newWords, passedOldWords, extraFoundation] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where: { ...visibleFilter, id: { in: body.newWordIds || [] } },
      }),
      body.oldWordIds?.length
        ? this.prisma.vocabulary.findMany({
            where: { ...visibleFilter, id: { in: body.oldWordIds } },
          })
        : Promise.resolve([]),
      this.prisma.vocabulary.findMany({
        where: { ...visibleFilter, level: 'HSK1' },
        take: 35,
      }),
    ]);

    if (newWords.length === 0) {
      throw new BadRequestException('Không có từ mới nào để tạo hội thoại.');
    }

    const oldMap = new Map<string, { word: string; meaning: string }>();
    for (const w of [...passedOldWords, ...extraFoundation]) {
      oldMap.set(w.word, { word: w.word, meaning: w.meaning });
    }

    const newListStr = newWords.map((w) => `${w.word} (${w.meaning})`).join(', ');
    const oldListStr = Array.from(oldMap.values())
      .slice(0, 35)
      .map((w) => `${w.word} (${w.meaning})`)
      .join(', ');

    const prompt = `Bạn là giáo viên tiếng Trung ${level} (chuẩn HSK 3.0) xuất sắc cho người Việt.
Học viên đang học nhóm từ mới theo chủ đề **"${body.topic || 'Giao tiếp hàng ngày'}"**:
- Từ mới hôm nay (CẦN ĐƯA VÀO TỐI ĐA): [${newListStr}]
- Từ cũ đã học (TÁI SỬ DỤNG THOẢI MÁI & LẶP LẠI NHIỀU ĐỂ NHỚ SÂU): [${oldListStr}]

Hãy tạo:
1. Một đoạn hội thoại ngắn, tự nhiên, sinh động (6 đến 10 câu thoại giữa 2 người A và B) xoay quanh chủ đề này, lồng ghép khéo léo các từ mới hôm nay VÀ lặp lại nhiều lần các từ cũ đã học.
2. 4 mẫu câu giao tiếp ngắn gọn (keySentences) kết hợp từ mới + từ cũ.
3. Giải thích ngắn gọn cách các từ mới hôm nay liên kết với nhau trong tình huống này.

Trả về STRICT JSON:
{
  "dialogueTitle": "Tên đoạn hội thoại tiếng Việt hấp dẫn",
  "context": "Mô tả bối cảnh 1-2 câu bằng tiếng Việt",
  "topicConnectionNote": "Giải thích ngắn gọn cách nhóm từ mới này gắn với chủ đề",
  "dialogue": [
    {
      "speaker": "A",
      "chinese": "Câu tiếng Trung tự nhiên",
      "vietnamese": "Nghĩa tiếng Việt",
      "usedNewWords": ["từ mới xuất hiện trong câu"]
    }
  ],
  "keySentences": [
    {
      "chinese": "Mẫu câu ngắn dễ nhớ",
      "vietnamese": "Nghĩa tiếng Việt",
      "usedWords": ["từ mới", "từ cũ"]
    }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model: body.model,
      systemInstruction: `You are a Chinese ${level} conversation & vocabulary coach. Output valid JSON only.`,
      temperature: 0.45,
    });

    const parsed = this.parseJsonSafe<{
      dialogueTitle: string;
      context: string;
      topicConnectionNote: string;
      dialogue: Array<{
        speaker: string;
        chinese: string;
        vietnamese: string;
        usedNewWords: string[];
      }>;
      keySentences: Array<{
        chinese: string;
        vietnamese: string;
        usedWords: string[];
      }>;
    }>(raw);

    return {
      dialogueTitle: parsed.dialogueTitle,
      context: parsed.context,
      topicConnectionNote: parsed.topicConnectionNote,
      dialogue: (parsed.dialogue || []).map((line) => ({
        ...line,
        pinyin: this.pinyinService.generatePinyin(line.chinese),
      })),
      keySentences: (parsed.keySentences || []).map((s) => ({
        ...s,
        pinyin: this.pinyinService.generatePinyin(s.chinese),
      })),
    };
  }

  async submitSrsReview(
    userId: string,
    vocabularyId: string,
    quality: 'again' | 'hard' | 'good' | 'easy',
  ) {
    const [vocab, prev] = await Promise.all([
      this.prisma.vocabulary.findFirst({
        where: {
          id: vocabularyId,
          OR: [{ ownerId: null }, { ownerId: userId }],
        },
        select: { id: true },
      }),
      this.prisma.vocabProgress.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId } },
      }),
    ]);
    if (!vocab) {
      throw new NotFoundException('Không tìm thấy từ vựng.');
    }

    let srsLevel = prev?.srsLevel ?? 0;
    let intervalDays = prev?.intervalDays ?? 0;
    let easeFactor = prev?.easeFactor ?? 2.5;
    let correctCount = prev?.correctCount ?? 0;
    let wrongCount = prev?.wrongCount ?? 0;

    if (quality === 'again') {
      srsLevel = 0;
      intervalDays = 0.5;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      wrongCount += 1;
    } else if (quality === 'hard') {
      srsLevel = Math.max(1, srsLevel);
      intervalDays = Math.max(1, intervalDays * 1.2 || 1);
      easeFactor = Math.max(1.3, easeFactor - 0.1);
      correctCount += 1;
    } else if (quality === 'good') {
      srsLevel += 1;
      const steps = [1, 3, 7, 14, 30, 60];
      intervalDays = steps[Math.min(srsLevel - 1, steps.length - 1)];
      correctCount += 1;
    } else if (quality === 'easy') {
      srsLevel += 2;
      const steps = [3, 7, 15, 30, 60, 90];
      intervalDays = steps[Math.min(srsLevel - 1, steps.length - 1)];
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      correctCount += 1;
    }

    const status =
      quality === 'again'
        ? 'learning'
        : srsLevel >= 4
          ? 'mastered'
          : srsLevel >= 2
            ? 'review'
            : 'learning';

    const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const srsFields = {
      status,
      srsLevel,
      intervalDays,
      easeFactor,
      nextReviewAt,
      lastReviewedAt: now,
      reviewCount: (prev?.reviewCount ?? 0) + 1,
      correctCount,
      wrongCount,
    };

    return this.prisma.vocabProgress.upsert({
      where: { userId_vocabularyId: { userId, vocabularyId } },
      create: {
        userId,
        vocabularyId,
        ...srsFields,
      },
      update: srsFields,
    });
  }

  async getWordDeepDive(userId: string, vocabularyId: string, model?: string) {
    const vocab = await this.prisma.vocabulary.findFirst({
      where: {
        id: vocabularyId,
        OR: [{ ownerId: null }, { ownerId: userId }],
      },
    });
    if (!vocab) {
      throw new NotFoundException('Không tìm thấy từ vựng.');
    }

    const userProgress = await this.prisma.vocabProgress.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });

    if (userProgress?.aiMnemonic && userProgress?.aiExamples) {
      return {
        cached: true,
        word: vocab.word,
        pinyin: vocab.pinyin,
        meaning: vocab.meaning,
        deepDive: JSON.parse(userProgress.aiMnemonic),
        examples: userProgress.aiExamples,
      };
    }

    const level = vocab.level || 'HSK1-3';
    const prompt = `Hãy phân tích chuyên sâu giúp người Việt học hiểu và nhớ sâu từ tiếng Trung ${level} sau:
- Từ: ${vocab.word}
- Pinyin: ${vocab.pinyin || ''}
- Nghĩa tiếng Việt: ${vocab.meaning}
- Từ loại: ${vocab.partOfSpeech || 'Chưa rõ'}

Trả về STRICT JSON với cấu trúc:
{
  "radicalAnalysis": "Phân tích cấu tạo chữ Hán / bộ thủ ngắn gọn, dễ hình dung",
  "memoryHook": "Mẹo liên tưởng hoặc câu chuyện ngắn bằng tiếng Việt để nhớ mặt chữ & nghĩa ngay lập tức",
  "collocations": [
    { "phrase": "cụm từ hay dùng", "pinyin": "pinyin", "meaning": "nghĩa tiếng Việt" }
  ],
  "distinguish": "Phân biệt nhanh với từ đồng nghĩa/dễ nhầm trong ${level}",
  "examples": [
    { "chinese": "Câu ví dụ ngắn gọn, thực tế trình độ ${level}", "vietnamese": "Nghĩa tiếng Việt" }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model,
      systemInstruction: 'You are a helpful Chinese language tutor for Vietnamese learners. Output valid JSON only.',
      temperature: 0.4,
    });

    const parsed = this.parseJsonSafe<{
      radicalAnalysis: string;
      memoryHook: string;
      collocations: Array<{ phrase: string; pinyin: string; meaning: string }>;
      distinguish: string;
      examples: Array<{ chinese: string; vietnamese: string }>;
    }>(raw);

    const examplesWithPinyin = (parsed.examples || []).map((ex) => ({
      ...ex,
      pinyin: this.pinyinService.generatePinyin(ex.chinese),
    }));

    const deepDivePayload = {
      radicalAnalysis: parsed.radicalAnalysis,
      memoryHook: parsed.memoryHook,
      collocations: parsed.collocations || [],
      distinguish: parsed.distinguish || '',
    };

    await this.prisma.vocabProgress.upsert({
      where: { userId_vocabularyId: { userId, vocabularyId: vocab.id } },
      create: {
        userId,
        vocabularyId: vocab.id,
        status: 'new',
        aiMnemonic: JSON.stringify(deepDivePayload),
        aiExamples: examplesWithPinyin,
      },
      update: {
        aiMnemonic: JSON.stringify(deepDivePayload),
        aiExamples: examplesWithPinyin,
      },
    });

    return {
      cached: false,
      word: vocab.word,
      pinyin: vocab.pinyin,
      meaning: vocab.meaning,
      deepDive: deepDivePayload,
      examples: examplesWithPinyin,
    };
  }

  async generateMixedPractice(
    userId: string,
    body: {
      newWordIds: string[];
      reviewWordIds: string[];
      grammarIds: string[];
      level?: string;
      model?: string;
    },
  ) {
    const visibleFilter = { OR: [{ ownerId: null }, { ownerId: userId }] };
    const level = this.normalizeLevel(body.level);

    const [newWords, reviewWords, grammars] = await Promise.all([
      this.prisma.vocabulary.findMany({ where: { ...visibleFilter, id: { in: body.newWordIds || [] } } }),
      this.prisma.vocabulary.findMany({ where: { ...visibleFilter, id: { in: body.reviewWordIds || [] } } }),
      this.prisma.grammarPoint.findMany({ where: { id: { in: body.grammarIds || [] } } }),
    ]);

    if (newWords.length === 0 && reviewWords.length === 0) {
      throw new BadRequestException('Cần ít nhất từ mới hoặc từ cũ để tạo bài luyện tập kết hợp.');
    }

    const newList = newWords.map((w) => `${w.word} (${w.meaning})`).join(', ');
    const oldList = reviewWords.slice(0, 20).map((w) => `${w.word} (${w.meaning})`).join(', ');
    const grammarText = grammars.map((g) => `${g.title}: ${g.pattern}`).join(' | ');

    const prompt = `Hãy tạo một bộ bài tập luyện viết kết hợp từ mới ${level}, từ cũ đã học và ngữ pháp trọng tâm cho học viên người Việt:
- Từ mới ${level} hôm nay: [${newList || 'Không có'}]
- Từ cũ cần ôn xen kẽ: [${oldList || 'Không có'}]
- Ngữ pháp trọng tâm hôm nay: [${grammarText || `Câu giao tiếp ${level}`}]

Yêu cầu tạo:
1. 15 câu dịch Việt -> Trung: Mỗi câu PHẢI kết hợp khéo léo ít nhất 1-2 từ mới hôm nay + 1-2 từ cũ cần ôn + áp dụng ngữ pháp trọng tâm (nếu phù hợp).
2. 3 đề bài đặt câu tự do (freePrompts): Cho sẵn 2-3 từ khóa và yêu cầu đặt 1 câu hoàn chỉnh.

Trả về STRICT JSON:
{
  "translationExercises": [
    {
      "vietnamese": "Câu tiếng Việt cần dịch",
      "referenceChinese": "Câu tiếng Trung đáp án chuẩn",
      "targetWords": ["từ1", "từ2"],
      "grammarHint": "Gợi ý ngữ pháp ngắn"
    }
  ],
  "freePrompts": [
    {
      "instruction": "Yêu cầu đặt câu bằng tiếng Việt",
      "targetWords": ["từ mới", "từ cũ"],
      "grammarTitle": "Tên ngữ pháp"
    }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model: body.model,
      systemInstruction: `You are a Chinese ${level} curriculum designer. Output valid JSON only.`,
      temperature: 0.4,
    });

    const parsed = this.parseJsonSafe<{
      translationExercises: Array<{
        vietnamese: string;
        referenceChinese: string;
        targetWords: string[];
        grammarHint: string;
      }>;
      freePrompts: Array<{
        instruction: string;
        targetWords: string[];
        grammarTitle: string;
      }>;
    }>(raw);

    return {
      translationExercises: (parsed.translationExercises || []).map((ex) => ({
        ...ex,
        referencePinyin: this.pinyinService.generatePinyin(ex.referenceChinese),
      })),
      freePrompts: parsed.freePrompts || [],
    };
  }

  async evaluateAttempt(
    userId: string,
    body: {
      promptVietnamese: string;
      referenceChinese?: string;
      targetWords?: string[];
      grammarTitle?: string;
      userChinese: string;
      level?: string;
      model?: string;
    },
  ) {
    if (!body.userChinese || !body.userChinese.trim()) {
      throw new BadRequestException('Vui lòng nhập câu tiếng Trung của bạn để AI đánh giá.');
    }

    const level = body.level || 'HSK 1-3 (chuẩn 3.0)';
    const prompt = `Bạn là gia sư tiếng Trung 1 kèm 1 tận tâm cho học viên người Việt đang học ${level}.
Hãy chấm điểm và nhận xét CÁ NHÂN HÓA câu tiếng Trung của học viên:
- Đề bài / Yêu cầu: "${body.promptVietnamese}"
${body.referenceChinese ? `- Đáp án tham khảo: "${body.referenceChinese}"` : ''}
${body.targetWords?.length ? `- Từ vựng mục tiêu cần dùng: [${body.targetWords.join(', ')}]` : ''}
${body.grammarTitle ? `- Ngữ pháp mục tiêu: "${body.grammarTitle}"` : ''}
- Câu học viên viết: "${body.userChinese.trim()}"

Trả về STRICT JSON:
{
  "score": 85,
  "isCorrect": true,
  "correctedChinese": "Câu tiếng Trung chuẩn/tự nhiên nhất",
  "grammarFeedback": "Nhận xét cụ thể về cấu trúc ngữ pháp",
  "vocabFeedback": "Nhận xét cách dùng từ mới & từ cũ",
  "naturalnessFeedback": "Người bản xứ có nói câu này tự nhiên không?",
  "personalizedTip": "1 lời khuyên cá nhân hóa ngắn gọn để nhớ sâu hơn",
  "weakWordsDetected": ["từ bị dùng sai hoặc quên nếu có"]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model: body.model,
      systemInstruction: 'You are a supportive, sharp 1-on-1 Chinese tutor for Vietnamese learners. Output valid JSON only.',
      temperature: 0.3,
    });

    const parsed = this.parseJsonSafe<{
      score: number;
      isCorrect: boolean;
      correctedChinese: string;
      grammarFeedback: string;
      vocabFeedback: string;
      naturalnessFeedback: string;
      personalizedTip: string;
      weakWordsDetected?: string[];
    }>(raw);

    if (parsed.weakWordsDetected && parsed.weakWordsDetected.length > 0) {
      await this.prisma.vocabProgress.updateMany({
        where: {
          userId,
          vocabulary: { word: { in: parsed.weakWordsDetected } },
        },
        data: { lastMistakeNote: parsed.personalizedTip },
      });
    }

    return {
      ...parsed,
      correctedPinyin: this.pinyinService.generatePinyin(parsed.correctedChinese || body.userChinese),
    };
  }

  async evaluateBatch(
    userId: string,
    body: {
      items: Array<{
        key: string;
        promptVietnamese: string;
        referenceChinese?: string;
        targetWords?: string[];
        grammarTitle?: string;
        userChinese: string;
      }>;
      level?: string;
      model?: string;
    },
  ) {
    const validItems = (body.items || []).filter((i) => i.userChinese && i.userChinese.trim());
    if (validItems.length === 0) {
      throw new BadRequestException('Vui lòng viết ít nhất 1 câu tiếng Trung trước khi chấm bài.');
    }

    const level = body.level || 'HSK 1-3 (chuẩn 3.0)';
    const itemsText = validItems
      .map(
        (item, idx) =>
          `${idx + 1}. [key="${item.key}"] Đề: "${item.promptVietnamese}" | Mục tiêu: [${(item.targetWords || []).join(', ')}] | Ngữ pháp: "${item.grammarTitle || ''}" | Học viên viết: "${item.userChinese.trim()}"`,
      )
      .join('\n');

    const prompt = `Bạn là gia sư tiếng Trung 1 kèm 1 cho học viên người Việt học ${level}.
Hãy chấm điểm và nhận xét CÁ NHÂN HÓA TẤT CẢ ${validItems.length} câu sau trong một lần:
${itemsText}

Trả về STRICT JSON:
{
  "overallScore": 85,
  "overallComment": "Nhận xét tổng quan 2-3 câu về điểm mạnh, lỗi hay gặp và lời khuyên cá nhân hóa",
  "results": [
    {
      "key": "đúng key ở trên",
      "score": 85,
      "isCorrect": true,
      "correctedChinese": "Câu tiếng Trung chuẩn/tự nhiên nhất",
      "grammarFeedback": "Nhận xét ngắn gọn ngữ pháp",
      "vocabFeedback": "Nhận xét ngắn gọn từ vựng",
      "personalizedTip": "1 mẹo nhớ ngắn cho câu này",
      "weakWordsDetected": ["từ dùng sai nếu có"]
    }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model: body.model,
      systemInstruction: 'You are a supportive 1-on-1 Chinese tutor grading a batch of exercises. Output valid JSON only.',
      temperature: 0.3,
    });

    const parsed = this.parseJsonSafe<{
      overallScore: number;
      overallComment: string;
      results: Array<{
        key: string;
        score: number;
        isCorrect: boolean;
        correctedChinese: string;
        grammarFeedback: string;
        vocabFeedback: string;
        personalizedTip: string;
        weakWordsDetected?: string[];
      }>;
    }>(raw);

    const allWeakWords = new Set<string>();
    const enrichedResults = (parsed.results || []).map((r) => {
      for (const w of r.weakWordsDetected || []) {
        allWeakWords.add(w);
      }
      return {
        ...r,
        correctedPinyin: this.pinyinService.generatePinyin(r.correctedChinese || ''),
      };
    });

    if (allWeakWords.size > 0) {
      await this.prisma.vocabProgress.updateMany({
        where: {
          userId,
          vocabulary: { word: { in: Array.from(allWeakWords) } },
        },
        data: { lastMistakeNote: parsed.overallComment },
      });
    }

    return {
      overallScore: parsed.overallScore,
      overallComment: parsed.overallComment,
      results: enrichedResults,
    };
  }

  async completeDailySession(
    userId: string,
    body: {
      minutesSpent: number;
      newWordsLearned: number;
      wordsReviewed: number;
      grammarPracticed: number;
      averageScore?: number;
      weakWords?: string[];
      model?: string;
    },
  ) {
    const profile = await this.getOrCreateProfile(userId);
    const today = new Date().toISOString().slice(0, 10);

    const prompt = `Bạn là cố vấn học tập ${profile.currentLevel} (chuẩn HSK 3.0) cá nhân hóa. Học viên vừa hoàn thành Ngày ${profile.currentDayNumber}:
- Thời gian học: ${body.minutesSpent} phút (Mục tiêu: ${profile.dailyMinutesTarget} phút)
- Từ mới ${profile.currentLevel} đã học: ${body.newWordsLearned}
- Từ cũ đã ôn: ${body.wordsReviewed}
- Ngữ pháp đã luyện: ${body.grammarPracticed}
- Điểm luyện viết trung bình: ${body.averageScore ?? 'Chưa chấm'}
- Các từ còn yếu/hay nhầm: [${(body.weakWords || []).join(', ') || 'Không có'}]

Hãy viết nhận xét tổng kết cá nhân hóa bằng tiếng Việt thật thực tế và truyền cảm hứng. Trả về STRICT JSON:
{
  "headline": "Tiêu đề ngắn gọn nhận xét buổi học hôm nay",
  "strengths": "Điểm mạnh nổi bật hôm nay",
  "areasToImprove": "Điểm cần cải thiện cụ thể",
  "tomorrowFocus": "Chiến lược học ngày mai"
}`;

    let aiCoachingFeedback: any = null;
    try {
      const raw = await this.geminiService.generateText(prompt, {
        model: body.model || profile.preferredModel,
        systemInstruction: 'You are a personalized Chinese study coach. Output valid JSON only.',
        temperature: 0.4,
      });
      aiCoachingFeedback = this.parseJsonSafe(raw);
    } catch {
      aiCoachingFeedback = {
        headline: 'Hoàn thành xuất sắc buổi học hôm nay!',
        strengths: `Bạn đã ôn ${body.wordsReviewed} từ cũ và học ${body.newWordsLearned} từ mới ${profile.currentLevel}.`,
        areasToImprove: 'Tiếp tục duy trì kết hợp đặt câu với các từ hay quên.',
        tomorrowFocus: 'Ngày mai ưu tiên ôn lại các từ vừa học hôm nay bằng SRS.',
      };
    }

    const log = await this.prisma.studyLog.create({
      data: {
        userId,
        date: today,
        dayNumber: profile.currentDayNumber,
        level: profile.currentLevel,
        minutesSpent: body.minutesSpent,
        newWordsLearned: body.newWordsLearned,
        wordsReviewed: body.wordsReviewed,
        grammarPracticed: body.grammarPracticed,
        score: body.averageScore ?? null,
        aiCoachingFeedback,
      },
    });

    await this.prisma.studyProfile.update({
      where: { userId },
      data: { currentDayNumber: profile.currentDayNumber + 1 },
    });

    return log;
  }

  async getGrammarList(userId: string, level?: string) {
    await this.ensureSeeded();
    const where =
      level && (HSK_LEVELS as readonly string[]).includes(level.toUpperCase())
        ? { level: level.toUpperCase() }
        : undefined;

    const points = await this.prisma.grammarPoint.findMany({
      where,
      include: {
        progresses: { where: { userId } },
      },
      orderBy: [{ level: 'asc' }, { unitNumber: 'asc' }, { orderIndex: 'asc' }],
    });

    return points.map((g) => ({
      id: g.id,
      level: g.level,
      unitNumber: g.unitNumber,
      orderIndex: g.orderIndex,
      title: g.title,
      pattern: g.pattern,
      explanation: g.explanation,
      examples: g.examples,
      commonMistakes: g.commonMistakes,
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
    const existing = await this.prisma.grammarPoint.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy điểm ngữ pháp.');
    }

    const now = new Date();
    return this.prisma.grammarProgress.upsert({
      where: { userId_grammarPointId: { userId, grammarPointId: id } },
      create: {
        userId,
        grammarPointId: id,
        status,
        practiceCount: 1,
        lastPracticedAt: now,
      },
      update: {
        status,
        practiceCount: { increment: 1 },
        lastPracticedAt: now,
      },
    });
  }
}
