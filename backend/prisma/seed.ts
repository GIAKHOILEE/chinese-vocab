import { PrismaClient } from '@prisma/client';
import { pinyin } from 'pinyin-pro';

const prisma = new PrismaClient();

const initialVocabulary = [
  { word: '我', meaning: 'tôi', level: 'HSK1' },
  { word: '你', meaning: 'bạn', level: 'HSK1' },
  { word: '他', meaning: 'anh ấy', level: 'HSK1' },
  { word: '是', meaning: 'là', level: 'HSK1' },
  { word: '学生', meaning: 'học sinh', level: 'HSK1' },
  { word: '老师', meaning: 'giáo viên', level: 'HSK1' },
  { word: '朋友', meaning: 'bạn bè', level: 'HSK1' },
  { word: '学习', meaning: 'học', level: 'HSK1' },
  { word: '中文', meaning: 'tiếng Trung', level: 'HSK1' },
  { word: '学校', meaning: 'trường học', level: 'HSK1' },
  { word: '喜欢', meaning: 'thích', level: 'HSK1' },
  { word: '吃', meaning: 'ăn', level: 'HSK1' },
  { word: '喝', meaning: 'uống', level: 'HSK1' },
  { word: '水', meaning: 'nước', level: 'HSK1' },
  { word: '饭', meaning: 'cơm', level: 'HSK1' },
  { word: '今天', meaning: 'hôm nay', level: 'HSK1' },
  { word: '明天', meaning: 'ngày mai', level: 'HSK1' },
  { word: '昨天', meaning: 'hôm qua', level: 'HSK1' },
  { word: '家', meaning: 'nhà', level: 'HSK1' },
  { word: '工作', meaning: 'làm việc', level: 'HSK1' },
];

async function main() {
  console.log('Bắt đầu seed dữ liệu mẫu...');

  // 1. Thêm 20 từ vựng HSK1
  const createdVocabIds: string[] = [];
  for (const item of initialVocabulary) {
    const py = pinyin(item.word, { toneType: 'symbol', type: 'string' });
    const vocab = await prisma.vocabulary.create({
      data: {
        word: item.word,
        meaning: item.meaning,
        pinyin: py,
        level: item.level,
      },
    });
    createdVocabIds.push(vocab.id);
  }

  console.log(`Đã seed thành công ${createdVocabIds.length} từ vựng HSK1 mẫu.`);

  // 2. Tạo một bộ bài tập mẫu
  const samplePractice = await prisma.practiceSet.create({
    data: {
      title: 'Bài tập mẫu HSK1 (2026-09-09)',
      vocabularyIds: createdVocabIds,
      difficulty: 'HSK1',
      questionCount: 3,
      questions: {
        create: [
          {
            vietnamese: 'Tôi thích học tiếng Trung.',
            chinese: '我喜欢学习中文。',
            pinyin: 'Wǒ xǐhuan xuéxí Zhōngwén.',
            usedVocabulary: ['我', '喜欢', '学习', '中文'],
          },
          {
            vietnamese: 'Tôi và bạn bè cùng nhau học tập.',
            chinese: '我和朋友一起学习。',
            pinyin: 'Wǒ hé péngyou yīqǐ xuéxí.',
            usedVocabulary: ['我', '朋友', '学习'],
          },
          {
            vietnamese: 'Tôi thích học ở trường học.',
            chinese: '我喜欢在学校学习。',
            pinyin: 'Wǒ xǐhuan zài xuéxiào xuéxí.',
            usedVocabulary: ['我', '喜欢', '学校', '学习'],
          },
        ],
      },
    },
  });

  console.log('Đã seed 1 bài luyện tập mẫu với ID:', samplePractice.id);
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
