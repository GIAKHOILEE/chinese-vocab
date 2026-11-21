import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { HSK_VOCAB_DATA } from '../src/curriculum/data/hsk-curriculum.data';
import { HSK1_GRAMMAR_DATA } from '../src/curriculum/data/hsk1-grammar.data';
import { HSK2_GRAMMAR_DATA } from '../src/curriculum/data/hsk2-grammar.data';
import { HSK3_GRAMMAR_DATA } from '../src/curriculum/data/hsk3-grammar.data';
import { ENGLISH_VOCAB_DATA } from '../src/english/data/english-vocab.data';
import { ENGLISH_GRAMMAR_DATA } from '../src/english/data/english-grammar.data';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu seed dữ liệu đa người dùng & giáo trình chuẩn...');

  // 1. Tạo tài khoản mặc định nếu chưa có user nào
  const userCount = await prisma.user.count();
  let defaultUserId: string;

  if (userCount === 0) {
    const passwordHash = await bcrypt.hash('123456', 12);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash,
        displayName: 'Học viên chính',
        role: 'ADMIN',
      },
    });
    defaultUserId = admin.id;

    await prisma.studyProfile.create({
      data: {
        userId: defaultUserId,
        currentLevel: 'HSK1',
        dailyMinutesTarget: 90,
        newWordsPerDay: 15,
        reviewWordsPerDay: 25,
        grammarPerDay: 1,
        preferredModel: 'gemini-3-flash-preview',
        currentDayNumber: 1,
      },
    });

    await prisma.englishProfile.create({
      data: {
        userId: defaultUserId,
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

    console.log('Đã tạo tài khoản mặc định: admin / 123456');
  } else {
    const first = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    defaultUserId = first!.id;
  }

  // 2. Seed kho từ vựng HSK 1-3 dùng chung
  const zhChunk = 500;
  let zhAdded = 0;
  for (let i = 0; i < HSK_VOCAB_DATA.length; i += zhChunk) {
    const batch = HSK_VOCAB_DATA.slice(i, i + zhChunk).map((item) => ({
      ownerId: null,
      scopeKey: 'GLOBAL',
      word: item.word,
      meaning: item.meaning,
      pinyin: item.pinyin,
      partOfSpeech: item.partOfSpeech || '',
      level: item.level,
      topic: item.topic || 'Từ vựng cốt lõi',
    }));
    const res = await prisma.vocabulary.createMany({ data: batch, skipDuplicates: true });
    zhAdded += res.count;
  }
  console.log(`Đã seed +${zhAdded} từ vựng HSK 1-3 dùng chung.`);

  // 3. Seed ngữ pháp HSK 1-3 dùng chung
  const allZhGrammar = [
    ...HSK1_GRAMMAR_DATA.map((g) => ({ ...g, level: 'HSK1' })),
    ...HSK2_GRAMMAR_DATA.map((g) => ({ ...g, level: 'HSK2' })),
    ...HSK3_GRAMMAR_DATA.map((g) => ({ ...g, level: 'HSK3' })),
  ];
  for (const g of allZhGrammar) {
    await prisma.grammarPoint.upsert({
      where: { title: g.title },
      create: {
        level: g.level,
        unitNumber: g.unitNumber,
        orderIndex: g.orderIndex,
        title: g.title,
        pattern: g.pattern,
        explanation: g.explanation,
        commonMistakes: g.commonMistakes,
        examples: g.examples,
      },
      update: {},
    });
  }
  console.log(`Đã seed ${allZhGrammar.length} điểm ngữ pháp HSK 1-3.`);

  // 4. Seed kho từ vựng Tiếng Anh A1-B2 dùng chung
  let enAdded = 0;
  for (let i = 0; i < ENGLISH_VOCAB_DATA.length; i += 500) {
    const batch = ENGLISH_VOCAB_DATA.slice(i, i + 500).map((item) => ({
      ownerId: null,
      scopeKey: 'GLOBAL',
      word: item.word,
      ipa: item.ipa || '',
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech || '',
      cefrLevel: item.cefrLevel,
      topic: item.topic || 'Daily Life & Greetings',
      exampleEn: item.exampleEn || '',
      exampleVi: item.exampleVi || '',
    }));
    const res = await prisma.englishVocab.createMany({ data: batch, skipDuplicates: true });
    enAdded += res.count;
  }
  console.log(`Đã seed +${enAdded} từ vựng Tiếng Anh A1-B2 dùng chung.`);

  // 5. Seed ngữ pháp Tiếng Anh A1-B2
  for (const g of ENGLISH_GRAMMAR_DATA) {
    await prisma.englishGrammar.upsert({
      where: { title: g.title },
      create: {
        cefrLevel: g.cefrLevel,
        orderIndex: g.orderIndex,
        title: g.title,
        pattern: g.pattern,
        explanation: g.explanation,
        commonMistakes: g.commonMistakes,
        examples: g.examples,
      },
      update: {},
    });
  }
  console.log(`Đã seed ${ENGLISH_GRAMMAR_DATA.length} điểm ngữ pháp Tiếng Anh.`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
