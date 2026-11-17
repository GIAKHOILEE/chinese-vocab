import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { PinyinService } from '../chinese/pinyin.service';
import { HSK2_VOCAB_DATA } from './data/hsk2-vocab.data';
import { HSK2_GRAMMAR_DATA } from './data/hsk2-grammar.data';

@Injectable()
export class CurriculumService {
  private readonly wordTopicMap: Map<string, string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly pinyinService: PinyinService,
  ) {
    this.wordTopicMap = new Map(HSK2_VOCAB_DATA.map((item) => [item.word.trim(), item.topic]));
  }

  private parseJsonSafe<T>(raw: string): T {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  }

  async getOrCreateProfile() {
    let profile = await this.prisma.studyProfile.findUnique({ where: { id: 'default' } });
    if (!profile) {
      profile = await this.prisma.studyProfile.create({
        data: {
          id: 'default',
          dailyMinutesTarget: 90,
          newWordsPerDay: 15,
          reviewWordsPerDay: 25,
          grammarPerDay: 1,
          preferredModel: 'gemini-2.5-flash',
          currentDayNumber: 1,
        },
      });
    }
    return profile;
  }

  async updateProfile(data: {
    dailyMinutesTarget?: number;
    newWordsPerDay?: number;
    reviewWordsPerDay?: number;
    grammarPerDay?: number;
    preferredModel?: string;
  }) {
    await this.getOrCreateProfile();
    return this.prisma.studyProfile.update({
      where: { id: 'default' },
      data,
    });
  }

  async getDashboardSummary() {
    const profile = await this.getOrCreateProfile();
    const now = new Date();

    const [hsk1Count, hsk2Count, progressGroups, dueReviewCount, grammarTotal, grammarMastered, recentLogs] =
      await Promise.all([
        this.prisma.vocabulary.count({ where: { level: 'HSK1' } }),
        this.prisma.vocabulary.count({ where: { level: 'HSK2' } }),
        this.prisma.vocabProgress.groupBy({
          by: ['status'],
          where: { vocabulary: { level: 'HSK2' } },
          _count: true,
        }),
        this.prisma.vocabProgress.count({
          where: {
            status: { not: 'new' },
            nextReviewAt: { lte: now },
          },
        }),
        this.prisma.grammarPoint.count(),
        this.prisma.grammarPoint.count({ where: { status: 'mastered' } }),
        this.prisma.studyLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 7,
        }),
      ]);

    const hsk2Breakdown: Record<string, number> = {
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    };
    let trackedHsk2 = 0;
    for (const g of progressGroups) {
      hsk2Breakdown[g.status] = g._count;
      trackedHsk2 += g._count;
    }
    hsk2Breakdown.new += Math.max(0, hsk2Count - trackedHsk2);

    return {
      profile,
      stats: {
        hsk1Count,
        hsk2Count,
        hsk2Target: 772,
        builtInBankCount: HSK2_VOCAB_DATA.length,
        hsk2Breakdown,
        dueReviewCount,
        grammarTotal,
        grammarMastered,
      },
      recentLogs,
    };
  }

  async syncHsk2Curriculum() {
    // 1. Lấy toàn bộ từ đã có trong DB để tránh trùng lặp
    const existingVocabs = await this.prisma.vocabulary.findMany({
      select: { id: true, word: true, progress: { select: { id: true } } },
    });
    const existingWordSet = new Set(existingVocabs.map((v) => v.word.trim()));

    // Khởi tạo VocabProgress cho các từ đã có mà chưa có progress
    const missingProgressIds = existingVocabs.filter((v) => !v.progress).map((v) => v.id);
    if (missingProgressIds.length > 0) {
      await this.prisma.vocabProgress.createMany({
        data: missingProgressIds.map((vocabularyId) => ({
          vocabularyId,
          status: 'new',
        })),
        skipDuplicates: true,
      });
    }

    // 2. Thêm các từ HSK 2 (3.0) còn thiếu từ bộ chuẩn
    let addedWords = 0;
    for (const item of HSK2_VOCAB_DATA) {
      if (existingWordSet.has(item.word)) continue;
      try {
        const pinyin = this.pinyinService.generatePinyin(item.word);
        const created = await this.prisma.vocabulary.create({
          data: {
            word: item.word,
            meaning: item.meaning,
            pinyin,
            partOfSpeech: item.partOfSpeech,
            level: 'HSK2',
          },
        });
        await this.prisma.vocabProgress.create({
          data: {
            vocabularyId: created.id,
            status: 'new',
          },
        });
        existingWordSet.add(item.word);
        addedWords++;
      } catch {
        // Bỏ qua nếu trùng unique key
      }
    }

    // 3. Đồng bộ 30 điểm ngữ pháp HSK 2 (3.0)
    let addedGrammar = 0;
    for (const g of HSK2_GRAMMAR_DATA) {
      const existing = await this.prisma.grammarPoint.findUnique({ where: { title: g.title } });
      if (!existing) {
        await this.prisma.grammarPoint.create({
          data: {
            level: 'HSK2',
            unitNumber: g.unitNumber,
            orderIndex: g.orderIndex,
            title: g.title,
            pattern: g.pattern,
            explanation: g.explanation,
            commonMistakes: g.commonMistakes,
            examples: g.examples,
            status: 'new',
          },
        });
        addedGrammar++;
      }
    }

    const totalHsk2 = await this.prisma.vocabulary.count({ where: { level: 'HSK2' } });
    return {
      addedWords,
      addedGrammar,
      totalHsk2,
      message: `Đã đồng bộ +${addedWords} từ HSK 2 (3.0) mới và +${addedGrammar} điểm ngữ pháp.`,
    };
  }

  async aiExpandHsk2Words(topic?: string, count = 25, model?: string) {
    const existing = await this.prisma.vocabulary.findMany({
      select: { word: true },
    });
    const existingSet = new Set(existing.map((e) => e.word.trim()));
    const sampleExisting = Array.from(existingSet).slice(-120).join(', ');

    const prompt = `Bạn là chuyên gia biên soạn giáo trình HSK 3.0 (Bản mới).
Hãy cung cấp ${count} từ vựng chuẩn thuộc cấp độ **HSK 2 (phiên bản 3.0)** ${topic ? `về chủ đề "${topic}"` : 'đa dạng chủ đề thường gặp'} mà CHƯA nằm trong danh sách sau:
[${sampleExisting}]

Yêu cầu:
- Chỉ chọn từ HSK 2 (3.0) thực sự thông dụng, hữu ích cho giao tiếp & viết câu.
- Nghĩa tiếng Việt ngắn gọn, chính xác, tự nhiên.
- Từ loại tiếng Việt (Danh từ, Động từ, Tính từ, Phó từ, Lượng từ, Liên từ, Giới từ).
- Trả về STRICT JSON:
{
  "words": [
    { "word": "汉字", "meaning": "nghĩa tiếng Việt", "partOfSpeech": "Động từ" }
  ]
}`;

    const raw = await this.geminiService.generateText(prompt, {
      model,
      systemInstruction: 'You are an HSK 3.0 Level 2 Chinese curriculum expert. Output valid JSON only.',
      temperature: 0.4,
    });

    const parsed = this.parseJsonSafe<{ words: Array<{ word: string; meaning: string; partOfSpeech: string }> }>(raw);
    const candidates = parsed?.words || [];

    let addedCount = 0;
    const addedWords: Array<{ word: string; meaning: string; pinyin: string }> = [];

    for (const item of candidates) {
      const w = item.word?.trim();
      if (!w || existingSet.has(w)) continue;
      try {
        const pinyin = this.pinyinService.generatePinyin(w);
        const created = await this.prisma.vocabulary.create({
          data: {
            word: w,
            meaning: item.meaning?.trim() || '',
            pinyin,
            partOfSpeech: item.partOfSpeech?.trim() || '',
            level: 'HSK2',
          },
        });
        await this.prisma.vocabProgress.create({
          data: { vocabularyId: created.id, status: 'new' },
        });
        existingSet.add(w);
        addedCount++;
        addedWords.push({ word: w, meaning: created.meaning, pinyin });
      } catch {
        // Ignore duplicate
      }
    }

    return {
      addedCount,
      addedWords,
    };
  }

  async getTodayPlan(requestedTopic?: string) {
    const profile = await this.getOrCreateProfile();
    const now = new Date();

    // Đảm bảo các từ chưa có VocabProgress đều được khởi tạo
    const vocabsWithoutProgress = await this.prisma.vocabulary.findMany({
      where: { progress: null },
      select: { id: true },
    });
    if (vocabsWithoutProgress.length > 0) {
      await this.prisma.vocabProgress.createMany({
        data: vocabsWithoutProgress.map((v) => ({ vocabularyId: v.id, status: 'new' })),
        skipDuplicates: true,
      });
    }

    // 1. Chặng 1: Từ cũ cần ôn (ưu tiên từ đến hạn SRS & từ hay sai thuộc cả HSK1 và HSK2)
    let reviewList = await this.prisma.vocabulary.findMany({
      where: {
        progress: {
          status: { not: 'new' },
          nextReviewAt: { lte: now },
        },
      },
      include: { progress: true },
      orderBy: [
        { progress: { wrongCount: 'desc' } },
        { progress: { nextReviewAt: 'asc' } },
      ],
      take: profile.reviewWordsPerDay,
    });

    // Nếu chưa đủ số từ ôn, lấy thêm các từ HSK1 cũ (để ôn xen kẽ từ nền tảng) hoặc từ lâu chưa ôn
    if (reviewList.length < profile.reviewWordsPerDay) {
      const existingIds = reviewList.map((r) => r.id);
      const extraOld = await this.prisma.vocabulary.findMany({
        where: {
          id: { notIn: existingIds },
          level: 'HSK1',
        },
        include: { progress: true },
        orderBy: [
          { progress: { lastReviewedAt: 'asc' } },
          { createdAt: 'asc' },
        ],
        take: profile.reviewWordsPerDay - reviewList.length,
      });
      reviewList = [...reviewList, ...extraOld];
    }

    // 2. Chặng 2: Gom từ mới HSK 2 (3.0) theo chủ đề để dễ tạo hội thoại & nhớ sâu
    const allNewHsk2 = await this.prisma.vocabulary.findMany({
      where: {
        level: 'HSK2',
        progress: { status: 'new' },
      },
      include: { progress: true },
      orderBy: { createdAt: 'asc' },
    });

    const topicGroups = new Map<string, typeof allNewHsk2>();
    for (const w of allNewHsk2) {
      const topic = this.wordTopicMap.get(w.word.trim()) || 'Từ vựng cá nhân & Mở rộng';
      const arr = topicGroups.get(topic) || [];
      arr.push(w);
      topicGroups.set(topic, arr);
    }

    const availableTopics = Array.from(topicGroups.entries()).map(([topic, words]) => ({
      topic,
      remainingCount: words.length,
    }));

    // Chọn chủ đề: ưu tiên chủ đề người dùng chọn, hoặc chủ đề đầu tiên có từ
    let selectedTopic = requestedTopic && topicGroups.has(requestedTopic)
      ? requestedTopic
      : availableTopics[0]?.topic || 'Giao tiếp & Cảm xúc';

    let selectedNewWords = (topicGroups.get(selectedTopic) || []).slice(0, profile.newWordsPerDay);

    // Nếu chủ đề hiện tại còn ít hơn số từ mục tiêu, gom thêm từ chủ đề kế tiếp để đủ buổi học
    if (selectedNewWords.length < profile.newWordsPerDay && allNewHsk2.length > selectedNewWords.length) {
      const pickedIds = new Set(selectedNewWords.map((w) => w.id));
      const extras = allNewHsk2.filter((w) => !pickedIds.has(w.id)).slice(0, profile.newWordsPerDay - selectedNewWords.length);
      selectedNewWords = [...selectedNewWords, ...extras];
    }

    const newHsk2WordsWithTopic = selectedNewWords.map((w) => ({
      ...w,
      topic: this.wordTopicMap.get(w.word.trim()) || 'Từ vựng cá nhân & Mở rộng',
    }));

    // 3. Chặng 3: Ngữ pháp trọng tâm hôm nay
    const grammarPoints = await this.prisma.grammarPoint.findMany({
      where: { status: { not: 'mastered' } },
      orderBy: [{ unitNumber: 'asc' }, { orderIndex: 'asc' }],
      take: profile.grammarPerDay,
    });

    const totalMinutes = profile.dailyMinutesTarget;
    const schedule = {
      reviewMinutes: Math.round(totalMinutes * 0.22),
      newWordsMinutes: Math.round(totalMinutes * 0.28),
      grammarMinutes: Math.round(totalMinutes * 0.17),
      mixedPracticeMinutes: Math.round(totalMinutes * 0.33),
    };

    return {
      profile,
      schedule,
      currentTopic: selectedTopic,
      availableTopics,
      reviewWords: reviewList,
      newWords: newHsk2WordsWithTopic,
      grammarPoints,
    };
  }

  async generateTopicDialogue(body: {
    newWordIds: string[];
    oldWordIds?: string[];
    topic?: string;
    model?: string;
  }) {
    const [newWords, passedOldWords, extraHsk1] = await Promise.all([
      this.prisma.vocabulary.findMany({ where: { id: { in: body.newWordIds || [] } } }),
      body.oldWordIds?.length
        ? this.prisma.vocabulary.findMany({ where: { id: { in: body.oldWordIds } } })
        : Promise.resolve([]),
      this.prisma.vocabulary.findMany({
        where: { level: 'HSK1' },
        take: 35,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    if (newWords.length === 0) {
      throw new BadRequestException('Không có từ mới nào để tạo hội thoại.');
    }

    const oldMap = new Map<string, { word: string; meaning: string }>();
    for (const w of [...passedOldWords, ...extraHsk1]) {
      oldMap.set(w.word, { word: w.word, meaning: w.meaning });
    }

    const newListStr = newWords.map((w) => `${w.word} (${w.meaning})`).join(', ');
    const oldListStr = Array.from(oldMap.values())
      .slice(0, 35)
      .map((w) => `${w.word} (${w.meaning})`)
      .join(', ');

    const prompt = `Bạn là giáo viên tiếng Trung HSK 2 (3.0) xuất sắc cho người Việt.
Học viên đang học nhóm từ mới theo chủ đề **"${body.topic || 'Giao tiếp hàng ngày'}"**:
- Từ mới hôm nay (CẦN ĐƯA VÀO TỐI ĐA): [${newListStr}]
- Từ cũ đã học (TÁI SỬ DỤNG THOẢI MÁI & LẶP LẠI NHIỀU ĐỂ NHỚ SÂU): [${oldListStr}]

Hãy tạo:
1. Một đoạn hội thoại ngắn, tự nhiên, sinh động (6 đến 10 câu thoại giữa 2 người A và B) xoay quanh chủ đề này, lồng ghép khéo léo các từ mới hôm nay VÀ lặp lại nhiều lần các từ cũ đã học để học viên dễ nhớ, dễ vào đầu.
2. 4 mẫu câu giao tiếp ngắn gọn (keySentences) kết hợp từ mới + từ cũ để học viên đọc to và ghi nhớ ngay.
3. Giải thích ngắn gọn cách các từ mới hôm nay liên kết với nhau trong tình huống này.

Trả về STRICT JSON:
{
  "dialogueTitle": "Tên đoạn hội thoại tiếng Việt hấp dẫn",
  "context": "Mô tả bối cảnh 1-2 câu bằng tiếng Việt",
  "topicConnectionNote": "Giải thích ngắn gọn cách nhóm từ mới này gắn với chủ đề để dễ nhớ cả cụm",
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
      systemInstruction: 'You are a Chinese HSK 2 conversation & vocabulary coach. Output valid JSON only.',
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

  async submitSrsReview(vocabularyId: string, quality: 'again' | 'hard' | 'good' | 'easy') {
    const vocab = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      include: { progress: true },
    });
    if (!vocab) {
      throw new NotFoundException('Không tìm thấy từ vựng.');
    }

    const prev = vocab.progress || (await this.prisma.vocabProgress.create({
      data: { vocabularyId, status: 'new' },
    }));

    let srsLevel = prev.srsLevel;
    let intervalDays = prev.intervalDays;
    let easeFactor = prev.easeFactor;
    let correctCount = prev.correctCount;
    let wrongCount = prev.wrongCount;

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

    return this.prisma.vocabProgress.update({
      where: { vocabularyId },
      data: {
        status,
        srsLevel,
        intervalDays,
        easeFactor,
        nextReviewAt,
        lastReviewedAt: new Date(),
        reviewCount: prev.reviewCount + 1,
        correctCount,
        wrongCount,
      },
    });
  }

  async getWordDeepDive(vocabularyId: string, model?: string) {
    const vocab = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      include: { progress: true },
    });
    if (!vocab) {
      throw new NotFoundException('Không tìm thấy từ vựng.');
    }

    if (vocab.progress?.aiMnemonic && vocab.progress?.aiExamples) {
      return {
        cached: true,
        word: vocab.word,
        pinyin: vocab.pinyin,
        meaning: vocab.meaning,
        deepDive: JSON.parse(vocab.progress.aiMnemonic),
        examples: vocab.progress.aiExamples,
      };
    }

    const prompt = `Hãy phân tích chuyên sâu giúp người Việt học hiểu và nhớ sâu từ tiếng Trung HSK 2 sau:
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
  "distinguish": "Phân biệt nhanh với từ đồng nghĩa/dễ nhầm trong HSK1-2 (nếu có, không thì ghi mẹo dùng ngữ cảnh)",
  "examples": [
    { "chinese": "Câu ví dụ ngắn gọn, thực tế trình độ HSK1-2", "vietnamese": "Nghĩa tiếng Việt" }
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

    if (!vocab.progress) {
      await this.prisma.vocabProgress.create({
        data: {
          vocabularyId: vocab.id,
          status: 'new',
          aiMnemonic: JSON.stringify(deepDivePayload),
          aiExamples: examplesWithPinyin,
        },
      });
    } else {
      await this.prisma.vocabProgress.update({
        where: { vocabularyId: vocab.id },
        data: {
          aiMnemonic: JSON.stringify(deepDivePayload),
          aiExamples: examplesWithPinyin,
        },
      });
    }

    return {
      cached: false,
      word: vocab.word,
      pinyin: vocab.pinyin,
      meaning: vocab.meaning,
      deepDive: deepDivePayload,
      examples: examplesWithPinyin,
    };
  }

  async generateMixedPractice(body: {
    newWordIds: string[];
    reviewWordIds: string[];
    grammarIds: string[];
    model?: string;
  }) {
    const [newWords, reviewWords, grammars] = await Promise.all([
      this.prisma.vocabulary.findMany({ where: { id: { in: body.newWordIds || [] } } }),
      this.prisma.vocabulary.findMany({ where: { id: { in: body.reviewWordIds || [] } } }),
      this.prisma.grammarPoint.findMany({ where: { id: { in: body.grammarIds || [] } } }),
    ]);

    if (newWords.length === 0 && reviewWords.length === 0) {
      throw new BadRequestException('Cần ít nhất từ mới hoặc từ cũ để tạo bài luyện tập kết hợp.');
    }

    const newList = newWords.map((w) => `${w.word} (${w.meaning})`).join(', ');
    const oldList = reviewWords.slice(0, 20).map((w) => `${w.word} (${w.meaning})`).join(', ');
    const grammarText = grammars.map((g) => `${g.title}: ${g.pattern}`).join(' | ');

    const prompt = `Hãy tạo một bộ bài tập luyện viết kết hợp từ mới HSK 2, từ cũ đã học và ngữ pháp trọng tâm cho học viên người Việt:
- Từ mới HSK 2 hôm nay: [${newList || 'Không có'}]
- Từ cũ cần ôn xen kẽ: [${oldList || 'Không có'}]
- Ngữ pháp trọng tâm hôm nay: [${grammarText || 'Câu giao tiếp HSK 2'}]

Yêu cầu tạo:
1. 15 câu dịch Việt -> Trung: Mỗi câu PHẢI kết hợp khéo léo ít nhất 1-2 từ mới hôm nay + 1-2 từ cũ cần ôn + áp dụng ngữ pháp trọng tâm (nếu phù hợp). Câu đa dạng tình huống đời sống, đi từ ngắn dễ đến vừa phải.
2. 3 đề bài đặt câu tự do (freePrompts): Cho sẵn 2-3 từ khóa (gồm cả từ mới + từ cũ) và yêu cầu đặt 1 câu hoàn chỉnh theo ngữ pháp hôm nay.

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
      systemInstruction: 'You are a Chinese HSK 2 curriculum designer. Output valid JSON only.',
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

  async evaluateAttempt(body: {
    promptVietnamese: string;
    referenceChinese?: string;
    targetWords?: string[];
    grammarTitle?: string;
    userChinese: string;
    model?: string;
  }) {
    if (!body.userChinese || !body.userChinese.trim()) {
      throw new BadRequestException('Vui lòng nhập câu tiếng Trung của bạn để AI đánh giá.');
    }

    const prompt = `Bạn là gia sư tiếng Trung 1 kèm 1 tận tâm cho học viên người Việt đang học HSK 2 (bản 3.0).
Hãy chấm điểm và nhận xét CÁ NHÂN HÓA câu tiếng Trung của học viên:
- Đề bài / Yêu cầu: "${body.promptVietnamese}"
${body.referenceChinese ? `- Đáp án tham khảo: "${body.referenceChinese}"` : ''}
${body.targetWords?.length ? `- Từ vựng mục tiêu cần dùng: [${body.targetWords.join(', ')}]` : ''}
${body.grammarTitle ? `- Ngữ pháp mục tiêu: "${body.grammarTitle}"` : ''}
- Câu học viên viết: "${body.userChinese.trim()}"

Yêu cầu đánh giá chi tiết, khích lệ nhưng chỉ rõ lỗi sai để học viên nhớ sâu:
Trả về STRICT JSON:
{
  "score": 85,
  "isCorrect": true,
  "correctedChinese": "Câu tiếng Trung chuẩn/tự nhiên nhất (giữ nguyên ý học viên nếu đã đúng)",
  "grammarFeedback": "Nhận xét cụ thể về cấu trúc ngữ pháp, trật tự từ, trợ từ 了/过/着/得...",
  "vocabFeedback": "Nhận xét cách dùng từ mới & từ cũ, có dùng đúng ngữ cảnh không",
  "naturalnessFeedback": "Người Trung Quốc bản xứ có nói câu này tự nhiên không? Có cách nói nào hay hơn?",
  "personalizedTip": "1 lời khuyên cá nhân hóa ngắn gọn để lần sau không mắc lỗi này nữa và nhớ sâu hơn",
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

    // Lưu ghi chú lỗi sai vào VocabProgress nếu phát hiện từ yếu
    if (parsed.weakWordsDetected && parsed.weakWordsDetected.length > 0) {
      await this.prisma.vocabProgress.updateMany({
        where: {
          vocabulary: { word: { in: parsed.weakWordsDetected } },
        },
        data: {
          lastMistakeNote: parsed.personalizedTip,
        },
      });
    }

    return {
      ...parsed,
      correctedPinyin: this.pinyinService.generatePinyin(parsed.correctedChinese || body.userChinese),
    };
  }

  async evaluateBatch(body: {
    items: Array<{
      key: string;
      promptVietnamese: string;
      referenceChinese?: string;
      targetWords?: string[];
      grammarTitle?: string;
      userChinese: string;
    }>;
    model?: string;
  }) {
    const validItems = (body.items || []).filter((i) => i.userChinese && i.userChinese.trim());
    if (validItems.length === 0) {
      throw new BadRequestException('Vui lòng viết ít nhất 1 câu tiếng Trung trước khi chấm bài.');
    }

    const itemsText = validItems
      .map(
        (item, idx) =>
          `${idx + 1}. [key="${item.key}"] Đề: "${item.promptVietnamese}" | Mục tiêu: [${(item.targetWords || []).join(', ')}] | Ngữ pháp: "${item.grammarTitle || ''}" | Học viên viết: "${item.userChinese.trim()}"`,
      )
      .join('\n');

    const prompt = `Bạn là gia sư tiếng Trung 1 kèm 1 cho học viên người Việt học HSK 2 (3.0).
Hãy chấm điểm và nhận xét CÁ NHÂN HÓA TẤT CẢ ${validItems.length} câu sau trong một lần:
${itemsText}

Trả về STRICT JSON:
{
  "overallScore": 85,
  "overallComment": "Nhận xét tổng quan 2-3 câu về điểm mạnh, lỗi hệ thống hay gặp trong bài làm này và lời khuyên cá nhân hóa",
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
        where: { vocabulary: { word: { in: Array.from(allWeakWords) } } },
        data: { lastMistakeNote: parsed.overallComment },
      });
    }

    return {
      overallScore: parsed.overallScore,
      overallComment: parsed.overallComment,
      results: enrichedResults,
    };
  }

  async completeDailySession(body: {
    minutesSpent: number;
    newWordsLearned: number;
    wordsReviewed: number;
    grammarPracticed: number;
    averageScore?: number;
    weakWords?: string[];
    model?: string;
  }) {
    const profile = await this.getOrCreateProfile();
    const today = new Date().toISOString().slice(0, 10);

    const prompt = `Bạn là cố vấn học tập HSK 2 (3.0) cá nhân hóa. Học viên vừa hoàn thành Ngày ${profile.currentDayNumber} trong lộ trình 1-2 tiếng/ngày:
- Thời gian học: ${body.minutesSpent} phút (Mục tiêu: ${profile.dailyMinutesTarget} phút)
- Từ mới HSK 2 đã học: ${body.newWordsLearned}
- Từ cũ đã ôn (HSK 1 & 2): ${body.wordsReviewed}
- Ngữ pháp đã luyện: ${body.grammarPracticed}
- Điểm luyện viết trung bình: ${body.averageScore ?? 'Chưa chấm'}
- Các từ còn yếu/hay nhầm: [${(body.weakWords || []).join(', ') || 'Không có'}]

Hãy viết nhận xét tổng kết cá nhân hóa bằng tiếng Việt thật thực tế và truyền cảm hứng. Trả về STRICT JSON:
{
  "headline": "Tiêu đề ngắn gọn nhận xét buổi học hôm nay",
  "strengths": "Điểm mạnh nổi bật hôm nay",
  "areasToImprove": "Điểm cần cải thiện cụ thể",
  "tomorrowFocus": "Chiến lược học ngày mai (nên giữ nguyên tốc độ, tăng ôn từ yếu hay điều chỉnh gì)"
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
        strengths: `Bạn đã ôn ${body.wordsReviewed} từ cũ và học ${body.newWordsLearned} từ mới HSK 2.`,
        areasToImprove: 'Tiếp tục duy trì kết hợp đặt câu với các từ hay quên.',
        tomorrowFocus: 'Ngày mai ưu tiên ôn lại các từ vừa học hôm nay bằng SRS.',
      };
    }

    const log = await this.prisma.studyLog.create({
      data: {
        date: today,
        dayNumber: profile.currentDayNumber,
        minutesSpent: body.minutesSpent,
        newWordsLearned: body.newWordsLearned,
        wordsReviewed: body.wordsReviewed,
        grammarPracticed: body.grammarPracticed,
        score: body.averageScore ?? null,
        aiCoachingFeedback,
      },
    });

    await this.prisma.studyProfile.update({
      where: { id: 'default' },
      data: { currentDayNumber: profile.currentDayNumber + 1 },
    });

    return log;
  }

  async getGrammarList() {
    const count = await this.prisma.grammarPoint.count();
    if (count === 0) {
      await this.syncHsk2Curriculum();
    }
    return this.prisma.grammarPoint.findMany({
      orderBy: [{ unitNumber: 'asc' }, { orderIndex: 'asc' }],
    });
  }

  async updateGrammarStatus(id: string, status: 'new' | 'learning' | 'mastered') {
    const existing = await this.prisma.grammarPoint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy điểm ngữ pháp.');
    }
    return this.prisma.grammarPoint.update({
      where: { id },
      data: {
        status,
        practiceCount: existing.practiceCount + 1,
        lastPracticedAt: new Date(),
      },
    });
  }
}
