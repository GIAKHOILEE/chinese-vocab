import { HskGrammarSeed } from './hsk1-grammar.data';

export const HSK3_GRAMMAR_DATA: HskGrammarSeed[] = [
  {
    level: 'HSK3',
    unitNumber: 1,
    orderIndex: 1,
    title: 'HSK3 - Tiền tố & Hậu tố cấu tạo từ: 第-, 老-, 小-, -们, -头, -子',
    pattern: '第 + Số từ (thứ tự)  |  老 / 小 + Họ  |  Danh từ + 们 / 头 / 子',
    explanation:
      '第 đứng trước số tạo số thứ tự (第一, 第三). 老/小 + Họ gọi thân mật (老王, 小李). Các hậu tố 们 (nhóm người), 头 (石头, 里头), 子 (瓶子, 屋子) tạo danh từ phổ biến trong HSK 3.',
    commonMistakes: 'Không dùng 第 với tháng hoặc năm (tháng 1 là 一月, không nói 第一月).',
    examples: [
      { chinese: '这是我第一次来西安旅游。', pinyin: 'Zhè shì wǒ dì yī cì lái Xīān lǚyóu.', vietnamese: 'Đây là lần đầu tiên tôi đến Tây An du lịch.' },
      { chinese: '朋友们都在屋子里聊天呢。', pinyin: 'Péngyoumen dōu zài wūzi lǐ liáotiān ne.', vietnamese: 'Bạn bè đều đang nói chuyện trong phòng.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 1,
    orderIndex: 2,
    title: 'HSK3 - Động từ ly hợp (离合词): 帮忙, 见面, 结婚, 睡觉, 洗澡, 放假',
    pattern: 'V + Thành phần xen giữa (了 / 过 / Định ngữ / Số lượng) + O',
    explanation:
      'Các từ 2 âm tiết có kết cấu Động-Tân (như 帮忙, 见面, 结婚, 放假) khi mang tân ngữ hoặc số lần PHẢI tách ra để chèn vào giữa, không đặt tân ngữ trực tiếp phía sau.',
    commonMistakes: 'Sai: 我见面了他 / 我帮忙你 -> Đúng: 我跟他见面了 / 我帮你的忙.',
    examples: [
      { chinese: '来中国以后，我们只见过一次面。', pinyin: 'Lái Zhōngguó yǐhòu, wǒmen zhǐ jiàn guo yí cì miàn.', vietnamese: 'Sau khi đến Trung Quốc, chúng tôi mới gặp mặt một lần.' },
      { chinese: '他经常帮我的忙。', pinyin: 'Tā jīngcháng bāng wǒ de máng.', vietnamese: 'Anh ấy thường xuyên giúp đỡ tôi.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 1,
    orderIndex: 3,
    title: 'HSK3 - Động từ năng nguyện: 敢 (dám) & 需要 (cần)',
    pattern: 'Chủ ngữ + (不)敢 + V  |  Chủ ngữ + (不)需要 + V / N',
    explanation:
      '敢 diễn tả sự can đảm ("dám làm gì"). 需要 diễn tả nhu cầu khách quan ("cần", phủ định là 不需要 hoặc 不用).',
    commonMistakes: 'Phủ định nhẹ nhàng của 需要 (khi khuyên không cần) thường dùng 不用 thay vì 不需要.',
    examples: [
      { chinese: '我不敢在河里游泳。', pinyin: 'Wǒ bù gǎn zài hé lǐ yóuyǒng.', vietnamese: 'Tôi không dám bơi ở dưới sông.' },
      { chinese: '她生病了，需要好好休息。', pinyin: 'Tā shēngbìng le, xūyào hǎohāo xiūxi.', vietnamese: 'Cô ấy bị ốm rồi, cần nghỉ ngơi thật tốt.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 2,
    orderIndex: 4,
    title: 'HSK3 - Phiếm chỉ nâng cao: Đại từ nghi vấn + Đại từ nghi vấn',
    pattern: '想吃什么吃什么 / 谁 + ... + 谁 + 就... / 怎么 + ... + 就怎么...',
    explanation:
      'Lặp lại cùng một đại từ nghi vấn ở hai vế biểu thị sự tự do, tương ứng ("muốn gì được nấy", "ai muốn làm thì làm", "làm sao cũng được").',
    commonMistakes: 'Hai đại từ nghi vấn ở hai vế phải giống hệt nhau và cùng chỉ một đối tượng.',
    examples: [
      { chinese: '你们随便吃，想吃什么就吃什么。', pinyin: 'Nǐmen suíbiàn chī, xiǎng chī shénme jiù chī shénme.', vietnamese: 'Các bạn cứ ăn tự nhiên, muốn ăn gì thì ăn nấy.' },
      { chinese: '你怎么说，我就怎么做。', pinyin: 'Nǐ zěnme shuō, wǒ jiù zěnme zuò.', vietnamese: 'Bạn nói thế nào thì tôi làm thế ấy.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 2,
    orderIndex: 5,
    title: 'HSK3 - Nhấn mạnh phủ định hoàn toàn: 一 + Lượng từ + 也/都 + 不/没',
    pattern: 'Chủ ngữ + 一 + Lượng từ / 点儿 + (Danh từ) + 也 / 都 + 不 / 没 + V/Adj',
    explanation:
      'Diễn tả mức độ phủ định tuyệt đối ("một chút cũng không", "một cái cũng không", "chẳng hề..."). Với tính từ thường dùng 一点儿也不 + Adj.',
    commonMistakes: 'Quên 也/都 trước 不/没 (Sai: 我一个苹果没吃 -> Đúng: 我一个苹果也没吃).',
    examples: [
      { chinese: '我上午一口水也没喝，现在渴极了。', pinyin: 'Wǒ shàngwǔ yì kǒu shuǐ yě méi hē, xiànzài kě jíle.', vietnamese: 'Buổi sáng tôi một ngụm nước cũng chưa uống, giờ khát chết mất.' },
      { chinese: '中文一点儿也不难，越学越有意思。', pinyin: 'Zhōngwén yìdiǎnr yě bù nán, yuè xué yuè yǒuyìsi.', vietnamese: 'Tiếng Trung chẳng khó chút nào, càng học càng thấy thú vị.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 2,
    orderIndex: 6,
    title: 'HSK3 - Lặp lại lượng từ & số lượng: AA (家家, 天天) và 一AA (一排一排)',
    pattern: 'Lượng từ lặp (家家, 件件, 天天) = "Mỗi/Tất cả"  |  一 + Lượng từ + 一 + Lượng từ',
    explanation:
      'Lượng từ lặp lại (家家, 次次, 天天) mang nghĩa "mỗi..., cái nào cũng...". Cấu trúc 一 + Q + 一 + Q (一排一排, 一遍一遍) nhấn mạnh số lượng nhiều hoặc lặp đi lặp lại.',
    commonMistakes: 'Sau lượng từ lặp lại thường đi cùng 都 ở vị ngữ (天天都练习).',
    examples: [
      { chinese: '妈妈一遍一遍地告诉我要注意安全。', pinyin: 'Māma yí biàn yí biàn de gàosu wǒ yào zhùyì ānquán.', vietnamese: 'Mẹ hết lần này đến lần khác dặn tôi phải chú ý an toàn.' },
      { chinese: '我们天天都要复习生词。', pinyin: 'Wǒmen tiāntiān dōu yào fùxí shēngcí.', vietnamese: 'Ngày nào chúng tôi cũng phải ôn từ mới.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 3,
    orderIndex: 7,
    title: 'HSK3 - Bổ ngữ khả năng (可能补语): V + 得/不 + Kết quả / Xu hướng / 了',
    pattern: 'V + 得 + Bổ ngữ (có thể)  |  V + 不 + Bổ ngữ (không thể)  |  V + 得/不 + 了 (liǎo)',
    explanation:
      'Biểu thị điều kiện chủ quan hoặc khách quan có cho phép thực hiện kết quả của hành động hay không. V得/不了(liǎo) biểu thị có làm nổi/hết hay không.',
    commonMistakes: 'Không dùng 能 trước bổ ngữ khả năng (Sai: 我不能听得懂 -> Đúng: 我听得懂 / 我听不懂).',
    examples: [
      { chinese: '老师的话我都听得懂。', pinyin: 'Lǎoshī de huà wǒ dōu tīngdedǒng.', vietnamese: 'Lời thầy nói tôi đều nghe hiểu được.' },
      { chinese: '我生病了，明天的比赛参加不了了。', pinyin: 'Wǒ shēngbìng le, míngtiān de bǐsài cānjiābuliǎo le.', vietnamese: 'Tôi ốm rồi, cuộc thi ngày mai không tham gia được rồi.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 3,
    orderIndex: 8,
    title: 'HSK3 - Bổ ngữ xu hướng kép (复合趋向补语): V + 出来 / 回去 / 起来 / 下去...',
    pattern: 'Động từ + 上/下/进/出/回/过/起 + 来/去',
    explanation:
      'Kết hợp hướng hành động (lên, xuống, vào, ra, về...) với hướng tiến về người nói (来) hay ra xa người nói (去). Lưu ý 起来 còn mang nghĩa bắt đầu hoặc đánh giá ("trông có vẻ").',
    commonMistakes: 'Khi có tân ngữ chỉ địa điểm, đặt địa điểm trước 来/去 (走进教室来); tân ngữ là vật thường đặt trước 来/去 hoặc sau cả cụm.',
    examples: [
      { chinese: '他从书包里拿出一本书来。', pinyin: 'Tā cóng shūbāo lǐ ná chū yì běn shū lái.', vietnamese: 'Anh ấy lấy từ trong cặp ra một quyển sách.' },
      { chinese: '天气暖和起来了，大家快站起来吧。', pinyin: 'Tiānqì nuǎnhuo qǐlái le, dàjiā kuài zhàn qǐlái ba.', vietnamese: 'Trời ấm dần lên rồi, mọi người mau đứng dậy đi.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 3,
    orderIndex: 9,
    title: 'HSK3 - Bổ ngữ kết quả nâng cao: V + 到 / 住 / 走 / 清楚 / 干净',
    pattern: 'V + 到 (đạt tới) / 住 (giữ chặt) / 走 (rời đi) / 干净 / 整齐',
    explanation:
      'Mở rộng bổ ngữ kết quả: 到 (tìm được, mua được), 住 (nắm bắt/nhớ vững/dừng lại: 记住, 接住, 站住), 走 (mang đi, lấy đi).',
    commonMistakes: 'Trong câu có tân ngữ, 到/住 đứng NGAY SAU động từ (买到票了, 记住这个词).',
    examples: [
      { chinese: '他终于买到回家的火车票了。', pinyin: 'Tā zhōngyú mǎidào huíjiā de huǒchēpiào le.', vietnamese: 'Anh ấy cuối cùng cũng mua được vé tàu về nhà rồi.' },
      { chinese: '请把这些新词都记住。', pinyin: 'Qǐng bǎ zhèxiē xīncí dōu jìzhù.', vietnamese: 'Xin hãy ghi nhớ hết những từ mới này.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 4,
    orderIndex: 10,
    title: 'HSK3 - Bổ ngữ thời lượng (时量补语): Hành động kéo dài & Khoảng thời gian đã qua',
    pattern: 'V + 了 + Thời lượng + (的) + O  |  S + V + Thời lượng + 了 (tính đến nay)',
    explanation:
      'Khi động từ có tân ngữ, phải lặp lại động từ (学中文学了两年) hoặc đặt thời lượng trước tân ngữ (学了两年中文). Nếu có 了 ở cuối câu (来中国两个月了), biểu thị trạng thái kéo dài từ lúc xong đến hiện tại.',
    commonMistakes: 'Không đặt đại từ nhân xưng sau thời lượng (Đúng: 我等了他半个小时, không nói 等了半个小时他).',
    examples: [
      { chinese: '我学中文已经学了两年了。', pinyin: 'Wǒ xué Zhōngwén yǐjīng xué le liǎng nián le.', vietnamese: 'Tôi học tiếng Trung đã được 2 năm rồi.' },
      { chinese: '他们来北京工作一个星期了。', pinyin: 'Tāmen lái Běijīng gōngzuò yí ge xīngqī le.', vietnamese: 'Họ đến Bắc Kinh làm việc được một tuần rồi.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 4,
    orderIndex: 11,
    title: 'HSK3 - Bổ ngữ mức độ cao: 得很 / 极了 / 死了',
    pattern: 'Tính từ / Động từ tâm lý + 得很 / 极了 / 死了',
    explanation:
      'Dùng sau tính từ hoặc động từ tâm lý (喜欢, 想, 怕) để nhấn mạnh mức độ rất cao ("cực kỳ", "lắm", "chết mất").',
    commonMistakes: 'Khi dùng 极了/死了/得很 thì KHÔNG thêm 很 hoặc 非常 ở trước tính từ nữa.',
    examples: [
      { chinese: '这个游戏孩子们喜欢极了。', pinyin: 'Zhège yóuxì háizimen xǐhuan jíle.', vietnamese: 'Trò chơi này bọn trẻ thích cực kỳ.' },
      { chinese: '今天工作忙死了，我累得很。', pinyin: 'Jīntiān gōngzuò máng sǐ le, wǒ lèi de hěn.', vietnamese: 'Hôm nay công việc bận chết đi được, tôi mệt lắm rồi.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 4,
    orderIndex: 12,
    title: 'HSK3 - Mở rộng câu chữ 把 (bǎ) với bổ ngữ & tân ngữ thứ 2',
    pattern: 'S + 把 + O1 + V + 给 + O2  |  S + 把 + O + V + Kết quả / 出来 / 得...',
    explanation:
      'Ngoài 把 + O + V + 在/到, HSK 3 dùng 把 với động từ trao tặng (送给, 交给) hoặc kết hợp với bổ ngữ xu hướng kép/trạng thái.',
    commonMistakes: 'Động từ năng nguyện (想, 要, 应该) và phủ định (没, 别) phải đặt TRƯỚC 把.',
    examples: [
      { chinese: '请把作业交给老师，别忘了。', pinyin: 'Qǐng bǎ zuòyè jiāo gěi lǎoshī, bié wàng le.', vietnamese: 'Xin hãy nộp bài tập cho thầy giáo, đừng quên nhé.' },
      { chinese: '孩子们把手洗得干干净净的。', pinyin: 'Háizimen bǎ shǒu xǐ de gāngānjìngjìng de.', vietnamese: 'Lũ trẻ rửa tay sạch sẽ tinh tươm.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 5,
    orderIndex: 13,
    title: 'HSK3 - So sánh mở rộng với 比 (bǐ): Động từ+得, 不比, 多/少/早/晚',
    pattern: 'A 比 B + V + 得 + Adj  |  A 不比 B + Adj  |  A 比 B + 多/少/早/晚 + V + Số lượng',
    explanation:
      'So sánh mức độ của hành động (我比他跑得快 hoặc 我跑得比他快). 不比 nghĩa là "không hơn" (tức là bằng hoặc kém hơn). Khi hơn/kém số lượng cụ thể, đặt 多/少/早/晚 trước động từ.',
    commonMistakes: 'Số lượng chênh lệch cụ thể đặt SAU động từ (多吃了五个, không nói 吃多五个).',
    examples: [
      { chinese: '姐姐说中文比我说得流利。', pinyin: 'Jiějie shuō Zhōngwén bǐ wǒ shuō de liúlì.', vietnamese: 'Chị gái nói tiếng Trung lưu loát hơn tôi.' },
      { chinese: '我比他早回来十分钟，多买了一个苹果。', pinyin: 'Wǒ bǐ tā zǎo huílái shí fēnzhōng, duō mǎi le yí ge píngguǒ.', vietnamese: 'Tôi về sớm hơn anh ấy 10 phút và mua nhiều hơn một quả táo.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 5,
    orderIndex: 14,
    title: 'HSK3 - Phó từ ngữ khí: 其实, 果然, 简直, 难道, 到底, 千万, 只好',
    pattern: '其实 (thực ra) | 果然 (quả nhiên) | 简直 (quả thực) | 难道...吗 (lẽ nào) | 千万 (nhất định phải)',
    explanation:
      'Nhóm phó từ cực kỳ quan trọng giúp diễn đạt thái độ tự nhiên trong giao tiếp HSK 3: 其实 (nêu sự thật), 果然 (đúng như dự đoán), 简直 (cường điệu), 难道...吗 (hỏi tu từ), 千万 (căn dặn khẩn thiết), 只好 (đành phải).',
    commonMistakes: '千万 thường đi với 要 hoặc 别 (千万要小心 / 千万别迟到).',
    examples: [
      { chinese: '大家都以为他回国了，其实他去南方旅行了。', pinyin: 'Dàjiā dōu yǐwéi tā huíguó le, qíshí tā qù nánfāng lǚyóu le.', vietnamese: 'Mọi người đều tưởng anh ấy về nước rồi, thực ra anh ấy đi du lịch miền Nam rồi.' },
      { chinese: '别人都能学会，难道我就学不会吗？', pinyin: 'Biérén dōu néng xuéhuì, nándào wǒ jiù xuébuhuì ma?', vietnamese: 'Người khác đều học được, lẽ nào tôi lại không học được sao?' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 5,
    orderIndex: 15,
    title: 'HSK3 - Phó từ thời gian & mức độ: 曾经, 从来, 一直/始终, 终于, 赶紧/立刻',
    pattern: '曾经 + V + 过  |  从来 + 不/没 + V  |  始终 + V  |  终于 + V + 了',
    explanation:
      '曾经 (đã từng, thường đi với 过). 从来 luôn đi với câu phủ định ("từ trước tới nay chưa từng/không bao giờ"). 始终 (trước sau như một). 赶紧/赶快/立刻 (lập tức, mau chóng).',
    commonMistakes: 'Không dùng 从来 trong câu khẳng định (Sai: 我从来喜欢吃面 -> Đúng: 我一直喜欢吃面).',
    examples: [
      { chinese: '他从来不喝酒，始终坚持每天锻炼。', pinyin: 'Tā cónglái bù hējiǔ, shǐzhōng jiānchí měitiān duànliàn.', vietnamese: 'Anh ấy chưa bao giờ uống rượu, trước sau như một kiên trì tập luyện mỗi ngày.' },
      { chinese: '听到这个消息，他赶紧跑回家去了。', pinyin: 'Tīngdào zhège xiāoxi, tā gǎnjǐn pǎo huíjiā qù le.', vietnamese: 'Nghe được tin này, anh ấy vội vàng chạy về nhà.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 6,
    orderIndex: 16,
    title: 'HSK3 - Giới từ chỉ nguồn, hướng, đối tượng & căn cứ: 由, 自从, 朝, 向, 为, 按照',
    pattern: '自从 + Mốc quá khứ  |  朝 / 向 + Hướng/Đối tượng  |  为 + Người (vì/cho)  |  按照 + Quy định',
    explanation:
      '自从 (kể từ khi...); 朝 (hướng về phương hướng); 向 (hướng về phía / đối tượng như 向老师请假, 向榜样学习); 为 (vì, cho ai); 按照 (dựa theo, chiếu theo).',
    commonMistakes: '自从 chỉ dùng cho mốc thời gian ở quá khứ đến hiện tại, không dùng cho tương lai.',
    examples: [
      { chinese: '自从来到中国，他就喜欢上了中国菜。', pinyin: 'Zìcóng láidào Zhōngguó, tā jiù xǐhuan shàng le Zhōngguó cài.', vietnamese: 'Kể từ khi đến Trung Quốc, anh ấy đã thích món ăn Trung Quốc.' },
      { chinese: '他们按照地图找到了全部东西。', pinyin: 'Tāmen ànzhào dìtú zhǎodào le quánbù dōngxi.', vietnamese: 'Họ dựa theo bản đồ đã tìm thấy toàn bộ đồ vật.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 6,
    orderIndex: 17,
    title: 'HSK3 - Cụm cố định: 对...来说, 从...起, 看起来 / 看上去, 有的是',
    pattern: '对 + Người + 来说  |  从 + Thời gian + 起  |  S + 看起来/看上去 + Adj',
    explanation:
      '对...来说 ("đối với ai đó mà nói"); 从...起 ("bắt đầu từ..."); 看起来/看上去 ("trông có vẻ"); 有的是 ("có thừa, có rất nhiều").',
    commonMistakes: 'Không dùng 对...来说 để chỉ thái độ yêu ghét (nói về quan điểm dùng 对...来说, nói về hứng thú dùng 对...感兴趣).',
    examples: [
      { chinese: '对我来说，每天写汉字很有意思。', pinyin: 'Duì wǒ lái shuō, měitiān xiě Hànzì hěn yǒuyìsi.', vietnamese: 'Đối với tôi mà nói, mỗi ngày viết chữ Hán rất thú vị.' },
      { chinese: '这件衣服看上去非常不错。', pinyin: 'Zhè jiàn yīfu kàn shàngqù fēicháng búcuò.', vietnamese: 'Bộ quần áo này trông có vẻ rất ổn đấy.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 6,
    orderIndex: 18,
    title: 'HSK3 - Trợ từ kết cấu 地 (de) & Chủ vị vị ngữ (主谓谓语句)',
    pattern: 'Tính từ / Trạng thái + 地 + Động từ  |  Chủ ngữ lớn + (Chủ ngữ nhỏ + Vị ngữ)',
    explanation:
      '地 (trợ từ trạng ngữ) đặt giữa tính từ/phó từ miêu tả cách thức và động từ (认真地回答, 慢慢地走). Câu chủ-vị làm vị ngữ dùng để miêu tả đặc điểm bộ phận của chủ ngữ lớn (奶奶身体很好).',
    commonMistakes: 'Phân biệt 的 (trước Danh từ), 地 (trước Động từ), 得 (sau Động từ).',
    examples: [
      { chinese: '同学们认真地回答了老师的问题。', pinyin: 'Tóngxuémen rènzhēn de huídá le lǎoshī de wèntí.', vietnamese: 'Các bạn học sinh đã chăm chú trả lời câu hỏi của thầy giáo.' },
      { chinese: '这件衣服颜色很好看，那本书我没看过。', pinyin: 'Zhè jiàn yīfu yánsè hěn hǎokàn, nà běn shū wǒ méi kàn guo.', vietnamese: 'Bộ quần áo này màu sắc rất đẹp, quyển sách kia tôi chưa từng đọc.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 7,
    orderIndex: 19,
    title: 'HSK3 - Câu phức tăng tiến & song song: 不仅/不光...而且/还..., 又...又..., 一会儿...一会儿...',
    pattern: '不仅/不光 A，而且/还 B  |  又 A 又 B  |  一会儿 A，一会儿 B',
    explanation:
      '不仅...而且/还... ("không những... mà còn..."); 又...又... ("vừa... vừa..." nối 2 tính chất hoặc hành động cùng tồn tại); 一会儿...一会儿... ("lúc thì... lúc thì..." thay đổi liên tục).',
    commonMistakes: 'Nếu 2 vế của 不仅...而且... khác chủ ngữ, 不仅 phải đặt TRƯỚC chủ ngữ thứ nhất.',
    examples: [
      { chinese: '不光我会说中文，而且我姐姐也会说中文。', pinyin: 'Bùguāng wǒ huì shuō Zhōngwén, érqiě wǒ jiějie yě huì shuō Zhōngwén.', vietnamese: 'Không chỉ tôi biết nói tiếng Trung, mà chị gái tôi cũng biết nói tiếng Trung.' },
      { chinese: '最近天气一会儿冷，一会儿热。', pinyin: 'Zuìjìn tiānqì yíhuìr lěng, yíhuìr rè.', vietnamese: 'Gần đây thời tiết lúc thì lạnh, lúc thì nóng.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 7,
    orderIndex: 20,
    title: 'HSK3 - Câu phức điều kiện & giả thiết: 只有...才... và 要是...就...',
    pattern: '只有 + Điều kiện duy nhất，S + 才 + Kết quả  |  要是 + Giả thiết，S + 就 + Kết quả',
    explanation:
      '只有...才... ("Chỉ có... mới...") nhấn mạnh điều kiện cần thiết duy nhất (khác với 只要...就... là điều kiện đủ). 要是...就... ("Nếu như... thì...") tương tự 如果...就... nhưng khẩu ngữ tự nhiên hơn.',
    commonMistakes: '才 và 就 luôn đứng SAU chủ ngữ của vế thứ 2.',
    examples: [
      { chinese: '只有多听多说，你才能提高中文水平。', pinyin: 'Zhǐyǒu duō tīng duō shuō, nǐ cái néng tígāo Zhōngwén shuǐpíng.', vietnamese: 'Chỉ có nghe nhiều nói nhiều, bạn mới có thể nâng cao trình độ tiếng Trung.' },
      { chinese: '要是明天有时间，就跟我一起去爬山吧。', pinyin: 'Yàoshi míngtiān yǒu shíjiān, jiù gēn wǒ yìqǐ qù páshān ba.', vietnamese: 'Nếu ngày mai có thời gian thì cùng tôi đi leo núi nhé.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 8,
    orderIndex: 21,
    title: 'HSK3 - Câu phức mục đích, nhân quả & chuyển ngoặt: 为了..., 由于...因此..., A是A，就是...',
    pattern: '为了 + Mục đích，S + V...  |  由于 + Nguyên nhân，因此/所以...  |  X 是 X，就是/不过...',
    explanation:
      '为了 ("để, nhằm mục đích..."); 由于...因此 ("do... cho nên..." trang trọng hơn 因为...所以); X是X，就是/不过... ("đúng là X thật, có điều là..." thừa nhận vế trước để chê/nhượng bộ nhẹ ở vế sau).',
    commonMistakes: 'Cấu trúc X是X, 就是... chỉ lặp lại tính từ hoặc động từ đơn âm/song âm, rồi nêu điểm chưa ưng ở sau 就是.',
    examples: [
      { chinese: '为了保持健康，他每天坚持运动。', pinyin: 'Wèile bǎochí jiànkāng, tā měitiān jiānchí yùndòng.', vietnamese: 'Để giữ gìn sức khỏe, anh ấy kiên trì vận động mỗi ngày.' },
      { chinese: '这件衣服好看是好看，就是有点儿贵。', pinyin: 'Zhè jiàn yīfu hǎokàn shì hǎokàn, jiùshì yǒudiǎnr guì.', vietnamese: 'Bộ quần áo này đẹp thì có đẹp thật, có điều hơi đắt một chút.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 8,
    orderIndex: 22,
    title: 'HSK3 - Câu phức lựa chọn, trình tự & kết nối chặt: 不是...就是..., 首先...然后..., V了...就...',
    pattern: '不是 A，就是 B  |  首先...然后...  |  S + V1 + 了 + ... + 就 + V2',
    explanation:
      '不是...就是... ("không phải A thì là B" - một trong hai khả năng). 首先...然后... ("trước tiên... sau đó..."). V1了...就V2 diễn tả hai hành động nối tiếp nhau ngay lập tức ("hễ làm X xong là làm Y ngay").',
    commonMistakes: 'Phân biệt 不是...就是... (chỉ 1 trong 2) với 既...又... (cả 2 cùng lúc).',
    examples: [
      { chinese: '他不是在办公室，就是在图书馆。', pinyin: 'Tā bú shì zài bàngōngshì, jiùshì zài túshūguǎn.', vietnamese: 'Anh ấy không ở văn phòng thì cũng đang ở thư viện.' },
      { chinese: '他下了课就去食堂吃饭。', pinyin: 'Tā xià le kè jiù qù shítáng chīfàn.', vietnamese: 'Anh ấy tan học là đi nhà ăn ăn cơm ngay.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 9,
    orderIndex: 23,
    title: 'HSK3 - Số ước lượng & Khẩu ngữ: 左右/前后, 都...了, X就X吧, X什么啊',
    pattern: 'Số lượng + 左右  |  都 + Thời gian/Số lượng + 了  |  Adj就Adj(点儿)吧',
    explanation:
      '左右 (khoảng chừng, đặt sau số); 前后 (trước sau dịp lễ/mốc thời gian). 都...了 biểu thị trách móc/nhấn mạnh ("đã... rồi đấy!"). X就X吧 ("thì đành chấp nhận vậy"). X什么啊 ("có gì mà X!").',
    commonMistakes: '左右 có thể dùng với tuổi, giờ, tiền, số lượng; 前后 dùng với ngày lễ/mùa (春节前后).',
    examples: [
      { chinese: '都十一点了，你别看电视了。', pinyin: 'Dōu shíyī diǎn le, nǐ bié kàn diànshì le.', vietnamese: 'Đã 11 giờ rồi đấy, bạn đừng xem TV nữa.' },
      { chinese: '我的中文老师大约三十岁左右。', pinyin: 'Wǒ de Zhōngwén lǎoshī dàyuē sānshí suì zuǒyòu.', vietnamese: 'Giáo viên tiếng Trung của tôi khoảng chừng 30 tuổi.' },
    ],
  },
  {
    level: 'HSK3',
    unitNumber: 9,
    orderIndex: 24,
    title: 'HSK3 - Câu phản vấn & Nhấn mạnh với 是: 不是...吗？ và 是 + 很/非常 + Adj',
    pattern: '不是 + ... + 吗？  |  S + 是 + Phó từ mức độ + Tính từ',
    explanation:
      '不是...吗？("Chẳng phải là... sao?" dùng để nhắc lại điều hiển nhiên). Đặt 是 trước phó từ mức độ + tính từ để khẳng định, thừa nhận ("đúng là rất...").',
    commonMistakes: 'Nhấn mạnh 是 đọc nhẹ, phần được nhấn mạnh là từ ngay sau 是.',
    examples: [
      { chinese: '今天不是星期天吗？你怎么去上班？', pinyin: 'Jīntiān bú shì Xīngqītiān ma? Nǐ zěnme qù shàngbān?', vietnamese: 'Hôm nay chẳng phải Chủ nhật sao? Sao bạn lại đi làm?' },
      { chinese: '我同意，那个电影是很有意思。', pinyin: 'Wǒ tóngyì, nàge diànyǐng shì hěn yǒuyìsi.', vietnamese: 'Tôi đồng ý, bộ phim đó đúng là rất thú vị.' },
    ],
  },
];
