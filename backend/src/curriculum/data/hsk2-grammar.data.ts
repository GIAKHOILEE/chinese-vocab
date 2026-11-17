export interface Hsk2GrammarSeed {
  unitNumber: number;
  orderIndex: number;
  title: string;
  pattern: string;
  explanation: string;
  commonMistakes: string;
  examples: Array<{
    chinese: string;
    pinyin: string;
    vietnamese: string;
  }>;
}

export const HSK2_GRAMMAR_DATA: Hsk2GrammarSeed[] = [
  {
    unitNumber: 1,
    orderIndex: 1,
    title: 'Đang diễn ra: 正在 / 在 ... 呢',
    pattern: 'Chủ ngữ + (正)在 + Động từ + (Tân ngữ) + 呢',
    explanation:
      'Diễn tả hành động đang diễn ra tại một thời điểm (hiện tại hoặc quá khứ). Có thể dùng 正在, 在 hoặc thêm 呢 ở cuối câu để nhấn mạnh trạng thái đang tiếp diễn.',
    commonMistakes: 'Không dùng 了 hoàn thành ở cuối câu khi đang dùng 正在...呢. Phủ định dùng 没(有)在, không dùng 不在.',
    examples: [
      { chinese: '我正在学习汉语呢。', pinyin: 'Wǒ zhèngzài xuéxí Hànyǔ ne.', vietnamese: 'Tôi đang học tiếng Hán đây.' },
      { chinese: '他没在看电视，他在写作业呢。', pinyin: 'Tā méi zài kàn diànshì, tā zài xiě zuòyè ne.', vietnamese: 'Anh ấy không đang xem TV, anh ấy đang làm bài tập.' },
    ],
  },
  {
    unitNumber: 1,
    orderIndex: 2,
    title: 'Trợ từ động thái 了 (Hoàn thành) vs Trợ từ ngữ khí 了 (Thay đổi)',
    pattern: 'S + V + 了 + (Số lượng) + O  |  Câu + 了 (thay đổi trạng thái)',
    explanation:
      '了 đứng sau động từ biểu thị hành động đã hoàn thành (thường đi với tân ngữ có số lượng/định ngữ). 了 đứng cuối câu biểu thị sự thay đổi trạng thái ("rồi") hoặc tình huống mới.',
    commonMistakes: 'Phủ định hành động đã xảy ra dùng 没(有) + V, tuyệt đối KHÔNG giữ 了 sau động từ (Sai: 我没去了 -> Đúng: 我没去).',
    examples: [
      { chinese: '我买了一本书。', pinyin: 'Wǒ mǎi le yì běn shū.', vietnamese: 'Tôi đã mua một quyển sách.' },
      { chinese: '天气冷了，多穿点儿衣服吧。', pinyin: 'Tiānqì lěng le, duō chuān diǎnr yīfu ba.', vietnamese: 'Trời lạnh rồi, mặc thêm chút quần áo đi.' },
    ],
  },
  {
    unitNumber: 1,
    orderIndex: 3,
    title: 'Kinh nghiệm đã từng: Động từ + 过',
    pattern: 'Chủ ngữ + Động từ + 过 + (Tân ngữ)  |  Phủ định: 没(有) + Động từ + 过',
    explanation:
      'Biểu thị ai đó đã từng có trải nghiệm làm việc gì trong quá khứ (nhưng hiện tại không còn tiếp tục hành động đó nữa).',
    commonMistakes: 'Khi phủ định với 没(有), vẫn phải giữ 过 ở sau động từ (khác với 了!).',
    examples: [
      { chinese: '我去过北京两次。', pinyin: 'Wǒ qù guo Běijīng liǎng cì.', vietnamese: 'Tôi đã từng đi Bắc Kinh hai lần.' },
      { chinese: '我没吃过这个菜。', pinyin: 'Wǒ méi chī guo zhège cài.', vietnamese: 'Tôi chưa từng ăn món này.' },
    ],
  },
  {
    unitNumber: 2,
    orderIndex: 4,
    title: 'Sắp sửa xảy ra: 快要 / 要 / 就要 ... 了',
    pattern: '(Chủ ngữ) + 快要 / 要 / 就要 + Động từ/Tính từ + 了',
    explanation:
      'Diễn tả một sự việc hoặc trạng thái sắp sửa xảy ra trong tương lai gần. Nếu có thời gian cụ thể đứng trước (ví dụ: 明天, 下个月), chỉ dùng 就要...了, không dùng 快要...了.',
    commonMistakes: 'Có mốc thời gian cụ thể như 明天 không được dùng 快要...了 (Sai: 明天快要下雨了 -> Đúng: 明天就要下雨了).',
    examples: [
      { chinese: '快要下雨了，我们快回家吧。', pinyin: 'Kuàiyào xiàyǔ le, wǒmen kuài huíjiā ba.', vietnamese: 'Sắp mưa rồi, chúng ta mau về nhà thôi.' },
      { chinese: '下个月我就要去上海工作了。', pinyin: 'Xià gè yuè wǒ jiùyào qù Shànghǎi gōngzuò le.', vietnamese: 'Tháng sau tôi sắp đi Thượng Hải làm việc rồi.' },
    ],
  },
  {
    unitNumber: 2,
    orderIndex: 5,
    title: 'Nguyên nhân – Kết quả: 因为 ... 所以 ...',
    pattern: '因为 + [Nguyên nhân], 所以 + [Kết quả]',
    explanation:
      'Cặp liên từ biểu thị quan hệ nhân quả ("Bởi vì... cho nên..."). Có thể dùng cả cặp hoặc lược bỏ một vế trong giao tiếp.',
    commonMistakes: 'Trong tiếng Việt hay nói "vì... nên...", tiếng Trung cũng dùng đủ 因为...所以... (khác tiếng Anh không dùng because...so cùng lúc).',
    examples: [
      { chinese: '因为今天下雨，所以我没去跑步。', pinyin: 'Yīnwèi jīntiān xiàyǔ, suǒyǐ wǒ méi qù pǎobù.', vietnamese: 'Bởi vì hôm nay trời mưa, nên tôi không đi chạy bộ.' },
      { chinese: '他因为生病了，所以没来上课。', pinyin: 'Tā yīnwèi shēngbìng le, suǒyǐ méi lái shàngkè.', vietnamese: 'Anh ấy vì bị ốm rồi nên không đến học.' },
    ],
  },
  {
    unitNumber: 2,
    orderIndex: 6,
    title: 'Nhượng bộ – Tương phản: 虽然 ... 但是 ...',
    pattern: '虽然 + [Mệnh đề 1], 但是 / 可是 + [Mệnh đề 2]',
    explanation:
      'Biểu thị quan hệ tương phản ("Tuy rằng... nhưng mà..."). Giống 因为...所以..., có thể dùng cả cặp.',
    commonMistakes: 'Tránh nhầm lẫn vị trí: nếu hai vế cùng chủ ngữ, chủ ngữ có thể đứng trước 虽然.',
    examples: [
      { chinese: '虽然汉字很难，但是我觉得很有意思。', pinyin: 'Suīrán Hànzì hěn nán, dànshì wǒ juéde hěn yǒuyìsi.', vietnamese: 'Tuy chữ Hán rất khó, nhưng tôi thấy rất thú vị.' },
      { chinese: '他虽然很忙，但是每天都锻炼身体。', pinyin: 'Tā suīrán hěn máng, dànshì měitiān dōu duànliàn shēntǐ.', vietnamese: 'Anh ấy tuy rất bận, nhưng ngày nào cũng rèn luyện sức khỏe.' },
    ],
  },
  {
    unitNumber: 3,
    orderIndex: 7,
    title: 'Câu điều kiện: 如果 ... 就 ...',
    pattern: '如果 + [Điều kiện], (Chủ ngữ) + 就 + [Kết quả]',
    explanation:
      'Diễn tả giả thiết "Nếu... thì...". Lưu ý 就 luôn đứng sau chủ ngữ và trước động từ ở vế sau.',
    commonMistakes: 'Không đặt 就 trước chủ ngữ (Sai: 如果下雨，就我不去 -> Đúng: 如果下雨，我就不去).',
    examples: [
      { chinese: '如果你有时间，就来我家玩吧。', pinyin: 'Rúguǒ nǐ yǒu shíjiān, jiù lái wǒ jiā wán ba.', vietnamese: 'Nếu bạn có thời gian thì đến nhà tôi chơi nhé.' },
      { chinese: '如果明天不下雨，我们就去爬山。', pinyin: 'Rúguǒ míngtiān bú xiàyǔ, wǒmen jiù qù páshān.', vietnamese: 'Nếu ngày mai trời không mưa thì chúng ta đi leo núi.' },
    ],
  },
  {
    unitNumber: 3,
    orderIndex: 8,
    title: 'So sánh hơn với 比 (bǐ)',
    pattern: 'A + 比 + B + Tính từ + (一点儿 / 得多 / Cụm số lượng)',
    explanation:
      'Dùng để so sánh A hơn B về một đặc điểm nào đó. Nếu muốn nói rõ hơn bao nhiêu, đặt mức độ sau tính từ.',
    commonMistakes: 'Tuyệt đối KHÔNG dùng 很, 非常 trước tính từ trong câu 比 (Sai: 他比我很高 -> Đúng: 他比我高 / 他比我高得多).',
    examples: [
      { chinese: '今天比昨天冷一点儿。', pinyin: 'Jīntiān bǐ zuótiān lěng yìdiǎnr.', vietnamese: 'Hôm nay lạnh hơn hôm qua một chút.' },
      { chinese: '哥哥比我大三岁。', pinyin: 'Gēge bǐ wǒ dà sān suì.', vietnamese: 'Anh trai lớn hơn tôi 3 tuổi.' },
    ],
  },
  {
    unitNumber: 3,
    orderIndex: 9,
    title: 'So sánh ngang bằng: A 跟/和 B (不)一样',
    pattern: 'A + 跟 / 和 + B + (不)一样 + (Tính từ)',
    explanation:
      'Dùng để so sánh A và B giống nhau hoặc không giống nhau về một mặt nào đó.',
    commonMistakes: 'Tính từ phải đặt SAU 一样, không đặt trước (Đúng: 跟他一样高).',
    examples: [
      { chinese: '我的爱好跟你一样。', pinyin: 'Wǒ de àihào gēn nǐ yíyàng.', vietnamese: 'Sở thích của tôi giống bạn.' },
      { chinese: '这件衣服和那件不一样贵。', pinyin: 'Zhè jiàn yīfu hé nà jiàn bù yíyàng guì.', vietnamese: 'Bộ quần áo này và bộ kia đắt không giống nhau.' },
    ],
  },
  {
    unitNumber: 4,
    orderIndex: 10,
    title: 'Bổ ngữ trạng thái với 得 (de)',
    pattern: 'Chủ ngữ + (Tân ngữ) + Động từ + 得 + (Phó từ mức độ) + Tính từ',
    explanation:
      'Dùng để miêu tả, đánh giá kết quả hoặc mức độ của hành động (làm thế nào, giỏi hay dở, nhanh hay chậm). Nếu động từ có tân ngữ, phải lặp lại động từ trước 得.',
    commonMistakes: 'Quên lặp lại động từ khi có tân ngữ (Sai: 他说汉语得很好 -> Đúng: 他说汉语说得很好).',
    examples: [
      { chinese: '他汉字写得非常漂亮。', pinyin: 'Tā Hànzì xiě de fēicháng piàoliang.', vietnamese: 'Anh ấy viết chữ Hán rất đẹp.' },
      { chinese: '我今天起得很早。', pinyin: 'Wǒ jīntiān qǐ de hěn zǎo.', vietnamese: 'Hôm nay tôi dậy rất sớm.' },
    ],
  },
  {
    unitNumber: 4,
    orderIndex: 11,
    title: 'Trạng thái đang duy trì: Động từ + 着 (zhe)',
    pattern: 'Chủ ngữ + Động từ + 着 + (Tân ngữ)',
    explanation:
      'Biểu thị trạng thái của hành động đang được giữ nguyên/duy trì (ví dụ: đang mặc, đang cầm, đang mở, đang ngồi).',
    commonMistakes: 'Phân biệt 着 (trạng thái tĩnh đang duy trì) với 正在 (hành động đang diễn ra). Phủ định dùng 没(有) + V + 着.',
    examples: [
      { chinese: '门开着呢，请进吧。', pinyin: 'Mén kāi zhe ne, qǐng jìn ba.', vietnamese: 'Cửa đang mở đấy, mời vào đi.' },
      { chinese: '他穿着一件白色的衬衫。', pinyin: 'Tā chuān zhe yí jiàn báisè de chènshān.', vietnamese: 'Anh ấy đang mặc một chiếc áo sơ mi trắng.' },
    ],
  },
  {
    unitNumber: 4,
    orderIndex: 12,
    title: 'Hai hành động đồng thời: 一边 ... 一边 ...',
    pattern: 'Chủ ngữ + 一边 + V1, 一边 + V2',
    explanation:
      'Diễn tả một chủ thể làm hai hành động cùng một lúc ("vừa... vừa...").',
    commonMistakes: 'Hai hành động phải có thể làm đồng thời và do cùng một chủ ngữ thực hiện.',
    examples: [
      { chinese: '我喜欢一边听音乐一边喝咖啡。', pinyin: 'Wǒ xǐhuan yìbiān tīng yīnyuè yìbiān hē kāfēi.', vietnamese: 'Tôi thích vừa nghe nhạc vừa uống cà phê.' },
      { chinese: '大家一边吃东西一边聊天。', pinyin: 'Dàjiā yìbiān chī dōngxi yìbiān liáotiān.', vietnamese: 'Mọi người vừa ăn đồ ăn vừa trò chuyện.' },
    ],
  },
  {
    unitNumber: 5,
    orderIndex: 13,
    title: 'Thứ tự hành động: 先 ... 再 / 然后 ...',
    pattern: 'Chủ ngữ + 先 + V1, 再 / 然后 + V2',
    explanation:
      'Diễn tả trình tự trước sau của các hành động ("Trước tiên... sau đó..."). 再 thường dùng cho việc chưa xảy ra; 然后 dùng được cả quá khứ lẫn tương lai.',
    commonMistakes: 'Đặt 先 sau chủ ngữ (trừ khi nhấn mạnh), không đặt 再 trước chủ ngữ.',
    examples: [
      { chinese: '我们先吃饭，然后再去看电影。', pinyin: 'Wǒmen xiān chīfàn, ránhòu zài qù kàn diànyǐng.', vietnamese: 'Chúng ta ăn cơm trước, sau đó đi xem phim.' },
      { chinese: '回家以后，我先洗手，再做饭。', pinyin: 'Huíjiā yǐhòu, wǒ xiān xǐshǒu, zài zuòfàn.', vietnamese: 'Sau khi về nhà, tôi rửa tay trước rồi mới nấu cơm.' },
    ],
  },
  {
    unitNumber: 5,
    orderIndex: 14,
    title: 'Câu chữ 把 (bǎ) cơ bản',
    pattern: 'Chủ ngữ + 把 + Tân ngữ xác định + Động từ + Thành phần khác (了/在/到/给/Kết quả)',
    explanation:
      'Nhấn mạnh sự tác động làm thay đổi vị trí hoặc trạng thái của tân ngữ xác định.',
    commonMistakes: 'Động từ trong câu 把 KHÔNG được đứng trơ trọi một mình, phía sau bắt buộc phải có thành phần khác (như 了, bổ ngữ kết quả, 在+nơi chốn...).',
    examples: [
      { chinese: '请把书放在桌子上。', pinyin: 'Qǐng bǎ shū fàng zài zhuōzi shàng.', vietnamese: 'Xin hãy đặt sách lên trên bàn.' },
      { chinese: '我已经把作业写完了。', pinyin: 'Wǒ yǐjīng bǎ zuòyè xiě wán le.', vietnamese: 'Tôi đã làm xong bài tập rồi.' },
    ],
  },
  {
    unitNumber: 5,
    orderIndex: 15,
    title: 'Câu bị động với 被 (bèi) / 让 / 叫',
    pattern: 'Đối tượng chịu tác động + 被 + (Tác nhân) + Động từ + Thành phần khác',
    explanation:
      'Diễn tả chủ ngữ bị/được tác động bởi một người hoặc sự việc khác. Có thể lược bỏ tác nhân sau 被 nếu không cần nêu rõ.',
    commonMistakes: 'Động từ sau 被 cũng thường cần đi kèm 了 hoặc bổ ngữ kết quả.',
    examples: [
      { chinese: '我的手机被弟弟拿走了。', pinyin: 'Wǒ de shǒujī bèi dìdi názǒu le.', vietnamese: 'Điện thoại của tôi bị em trai lấy mất rồi.' },
      { chinese: '蛋糕被他吃完了。', pinyin: 'Dàngāo bèi tā chī wán le.', vietnamese: 'Bánh ngọt bị anh ấy ăn hết rồi.' },
    ],
  },
  {
    unitNumber: 6,
    orderIndex: 16,
    title: 'Càng ngày càng: 越来越 + Tính từ / Động từ tâm lý',
    pattern: 'Chủ ngữ + 越来越 + Tính từ / Động từ tâm lý (喜欢, 明白...)',
    explanation:
      'Diễn tả mức độ thay đổi tăng dần theo thời gian ("càng ngày càng...").',
    commonMistakes: 'Không thêm 很, 非常 vào sau 越来越 (Sai: 越来越很热 -> Đúng: 越来越热).',
    examples: [
      { chinese: '你的汉语说得越来越好了。', pinyin: 'Nǐ de Hànyǔ shuō de yuèláiyuè hǎo le.', vietnamese: 'Tiếng Hán của bạn nói càng ngày càng tốt rồi.' },
      { chinese: '我越来越喜欢中国文化了。', pinyin: 'Wǒ yuèláiyuè xǐhuan Zhōngguó wénhuà le.', vietnamese: 'Tôi càng ngày càng thích văn hóa Trung Quốc.' },
    ],
  },
  {
    unitNumber: 6,
    orderIndex: 17,
    title: 'Càng ... càng ...: 越 A 越 B',
    pattern: '(Chủ ngữ) + 越 + A + 越 + B',
    explanation:
      'Biểu thị sự biến đổi của B phụ thuộc vào sự biến đổi tăng lên của A ("càng... càng...").',
    commonMistakes: 'Nếu có 2 chủ ngữ khác nhau, chủ ngữ thứ nhất đặt trước 越1, chủ ngữ thứ hai đặt trước 越2.',
    examples: [
      { chinese: '雨越下越大。', pinyin: 'Yǔ yuè xià yuè dà.', vietnamese: 'Mưa càng rơi càng lớn.' },
      { chinese: '这个故事我越看越喜欢。', pinyin: 'Zhège gùshi wǒ yuè kàn yuè xǐhuan.', vietnamese: 'Câu chuyện này tôi càng đọc càng thích.' },
    ],
  },
  {
    unitNumber: 6,
    orderIndex: 18,
    title: 'Ngoài ... ra: 除了 ... (以外)，还 / 都 ...',
    pattern: '除了 + A + (以外)，S + 还 / 也 / 都 + ...',
    explanation:
      'Dùng với 还/也 mang nghĩa bổ sung ("Ngoài A ra, còn..."); dùng với 都 mang nghĩa loại trừ ("Trừ A ra, tất cả đều...").',
    commonMistakes: 'Chú ý phó từ vế sau: 还/也 (bổ sung thêm) khác hẳn 都 (loại trừ).',
    examples: [
      { chinese: '除了汉语以外，我还会说英语。', pinyin: 'Chúle Hànyǔ yǐwài, wǒ hái huì shuō Yīngyǔ.', vietnamese: 'Ngoài tiếng Hán ra, tôi còn biết nói tiếng Anh.' },
      { chinese: '除了他以外，大家都去旅游了。', pinyin: 'Chúle tā yǐwài, dàjiā dōu qù lǚyóu le.', vietnamese: 'Trừ anh ấy ra, mọi người đều đi du lịch rồi.' },
    ],
  },
  {
    unitNumber: 7,
    orderIndex: 19,
    title: 'Khoảng cách & Thời gian: 离 / 从 ... 到 ...',
    pattern: 'A + 离 + B + 很近 / 很远 / 有 + Khoảng cách  |  从 + A + 到 + B',
    explanation:
      '离 dùng để nói khoảng cách không gian hoặc thời gian giữa hai mốc. 从...到... chỉ điểm bắt đầu và điểm kết thúc (không gian hoặc thời gian).',
    commonMistakes: 'Không dùng 从 thay cho 离 khi nói "cách đâu bao xa" (Sai: 我家从学校很近 -> Đúng: 我家离学校很近).',
    examples: [
      { chinese: '我家离公司很近，走路只要十分钟。', pinyin: 'Wǒ jiā lí gōngsī hěn jìn, zǒulù zhǐ yào shí fēnzhōng.', vietnamese: 'Nhà tôi cách công ty rất gần, đi bộ chỉ mất 10 phút.' },
      { chinese: '从星期一到星期五我都要上班。', pinyin: 'Từ Thứ Hai đến Thứ Sáu tôi đều phải đi làm -> Cóng Xīngqīyī dào Xīngqīwǔ wǒ dōu yào shàngbān.', vietnamese: 'Từ Thứ Hai đến Thứ Sáu tôi đều phải đi làm.' },
    ],
  },
  {
    unitNumber: 7,
    orderIndex: 20,
    title: 'Phân biệt 一点儿 và 有点儿',
    pattern: 'Tính từ + 一点儿 / 一点儿 + Danh từ  |  有点儿 + Tính từ',
    explanation:
      '一点儿 đứng SAU tính từ (so sánh/cầu khiến) hoặc TRƯỚC danh từ ("một chút"). 有点儿 đứng TRƯỚC tính từ hoặc động từ tâm lý, thường mang sắc thái không hài lòng ("hơi... một chút").',
    commonMistakes: 'Không nói 有点儿 + Danh từ, và không đặt 一点儿 trước tính từ.',
    examples: [
      { chinese: '这件衣服有点儿贵，能便宜一点儿吗？', pinyin: 'Zhè jiàn yīfu yǒudiǎnr guì, néng piányi yìdiǎnr ma?', vietnamese: 'Bộ quần áo này hơi đắt một chút, có thể rẻ hơn chút không?' },
      { chinese: '我有点儿累，想休息一下。', pinyin: 'Wǒ yǒudiǎnr lèi, xiǎng xiūxi yíxià.', vietnamese: 'Tôi hơi mệt, muốn nghỉ ngơi một lát.' },
    ],
  },
  {
    unitNumber: 7,
    orderIndex: 21,
    title: 'Phân biệt 就 (jiù) và 才 (cái) về thời gian',
    pattern: 'Thời gian + 就 + Động từ + 了 (sớm/nhanh)  |  Thời gian + 才 + Động từ (muộn/chậm)',
    explanation:
      '就 biểu thị hành động xảy ra sớm hơn, nhanh hơn hoặc dễ hơn dự kiến. 才 biểu thị hành động xảy ra muộn hơn, chậm hơn hoặc khó hơn dự kiến.',
    commonMistakes: 'Câu dùng 才 ở cuối thường KHÔNG có 了 (Sai: 他十点才来了 -> Đúng: 他十点才来).',
    examples: [
      { chinese: '他早上六点就起床了。', pinyin: 'Tā zǎoshang liù diǎn jiù qǐchuáng le.', vietnamese: 'Anh ấy mới 6 giờ sáng đã dậy rồi (sớm).' },
      { chinese: '我昨天晚上十一点才回家。', pinyin: 'Wǒ zuótiān wǎnshang shíyī diǎn cái huíjiā.', vietnamese: 'Tối qua tận 11 giờ tôi mới về nhà (muộn).' },
    ],
  },
  {
    unitNumber: 8,
    orderIndex: 22,
    title: 'Bổ ngữ kết quả: 完 / 好 / 懂 / 见 / 到',
    pattern: 'Động từ + 完 / 好 / 懂 / 见 / 到 + (了) + (Tân ngữ)',
    explanation:
      'Đứng ngay sau động từ để chỉ kết quả của hành động: 完 (xong), 好 (xong xuôi/tốt), 懂 (hiểu), 见 (thấy/nghe thấy), 到 (đạt được/tới).',
    commonMistakes: 'Phủ định dùng 没(有) + V + Kết quả, không đặt 没 giữa động từ và kết quả.',
    examples: [
      { chinese: '我看懂这篇文章了。', pinyin: 'Wǒ kàndǒng zhè piān wénzhāng le.', vietnamese: 'Tôi đọc hiểu bài văn này rồi.' },
      { chinese: '饭做好了，快来吃吧。', pinyin: 'Fàn zuò hǎo le, kuài lái chī ba.', vietnamese: 'Cơm nấu xong rồi, mau lại ăn đi.' },
    ],
  },
  {
    unitNumber: 8,
    orderIndex: 23,
    title: 'Bổ ngữ xu hướng đơn: Động từ + 来 / 去',
    pattern: 'Động từ + (Nơi chốn) + 来 / 去  |  Động từ + 来 / 去 + (Vật)',
    explanation:
      '来 chỉ hướng tiến về phía người nói; 去 chỉ hướng đi ra xa người nói.',
    commonMistakes: 'Nếu tân ngữ là nơi chốn, PHẢI đặt nơi chốn TRƯỚC 来/去 (Đúng: 进教室来, 回家去).',
    examples: [
      { chinese: '老师走进教室来了。', pinyin: 'Lǎoshī zǒu jìn jiàoshì lái le.', vietnamese: 'Thầy giáo đi vào trong lớp học rồi (người nói ở trong lớp).' },
      { chinese: '请把这些水果带回去吧。', pinyin: 'Qǐng bǎ zhèxiē shuǐguǒ dài huíqù ba.', vietnamese: 'Xin hãy mang số hoa quả này về đi.' },
    ],
  },
  {
    unitNumber: 8,
    orderIndex: 24,
    title: 'Động lượng từ: 次 (cì) và 遍 (biàn)',
    pattern: 'Động từ + (了/过) + Số từ + 次 / 遍 + (Tân ngữ)',
    explanation:
      '次 chỉ số lần nói chung; 遍 nhấn mạnh cả quá trình từ đầu đến cuối (thường dùng với đọc, nghe, xem, viết).',
    commonMistakes: 'Nếu tân ngữ là đại từ nhân xưng (我, 你, 他), đặt đại từ TRƯỚC số lượng từ (Đúng: 找过他两次).',
    examples: [
      { chinese: '这个电影我看了两遍。', pinyin: 'Zhège diànyǐng wǒ kàn le liǎng biàn.', vietnamese: 'Bộ phim này tôi xem 2 lượt (từ đầu đến cuối) rồi.' },
      { chinese: '我去年去过一次上海。', pinyin: 'Wǒ qùnián qù guo yí cì Shànghǎi.', vietnamese: 'Năm ngoái tôi từng đi Thượng Hải một lần.' },
    ],
  },
  {
    unitNumber: 9,
    orderIndex: 25,
    title: 'Quan tâm / Hứng thú: 对 ... 感兴趣 / 很好',
    pattern: 'Chủ ngữ + 对 + Đối tượng + (很 / 非常) + 感兴趣',
    explanation:
      'Biểu thị ai đó có hứng thú, quan tâm đến sự vật hoặc lĩnh vực nào đó.',
    commonMistakes: 'Không dùng phó từ mức độ trước 感 mà đặt trước toàn cụm hoặc không dùng (hoặc dùng 对...很感兴趣). Phủ định: 对...不感兴趣.',
    examples: [
      { chinese: '我对中国历史很感兴趣。', pinyin: 'Wǒ duì Zhōngguó lìshǐ hěn gǎn xìngqù.', vietnamese: 'Tôi rất có hứng thú với lịch sử Trung Quốc.' },
      { chinese: '他对打篮球不感兴趣。', pinyin: 'Tā duì dǎ lánqiú bù gǎn xìngqù.', vietnamese: 'Anh ấy không hứng thú với chơi bóng rổ.' },
    ],
  },
  {
    unitNumber: 9,
    orderIndex: 26,
    title: 'Phân biệt động từ năng nguyện: 会 / 能 / 可以',
    pattern: 'Chủ ngữ + 会 / 能 / 可以 + Động từ',
    explanation:
      '会: biết qua học tập (kỹ năng) hoặc khả năng xảy ra ("sẽ"). 能: có năng lực hoặc điều kiện khách quan cho phép. 可以: được phép (xin phép/cho phép) hoặc có thể.',
    commonMistakes: 'Xin phép dùng 可以吗？ hoặc 能...吗？, không dùng 会吗？.',
    examples: [
      { chinese: '我会写汉字，但是写得不太快。', pinyin: 'Wǒ huì xiě Hànzì, dànshì xiě de bú tài kuài.', vietnamese: 'Tôi biết viết chữ Hán, nhưng viết không nhanh lắm.' },
      { chinese: '这里可以拍照吗？', pinyin: 'Zhèlǐ kěyǐ pāizhào ma?', vietnamese: 'Ở đây có được chụp ảnh không?' },
    ],
  },
  {
    unitNumber: 9,
    orderIndex: 27,
    title: 'Nên & Phải: 应该 (yīnggāi) và 得 (děi)',
    pattern: 'Chủ ngữ + 应该 / 得 + Động từ',
    explanation:
      '应该 nghĩa là "nên" (lời khuyên, lẽ phải). 得 (děi) nghĩa là "phải" (bắt buộc do hoàn cảnh hoặc quy định).',
    commonMistakes: 'Phủ định của 得 (děi) là 不用 hoặc 不必 ("không cần phải"), KHÔNG nói 不得 (bù děi).',
    examples: [
      { chinese: '你生病了，应该去医院看看。', pinyin: 'Nǐ shēngbìng le, yīnggāi qù yīyuàn kànkan.', vietnamese: 'Bạn ốm rồi, nên đi bệnh viện khám xem.' },
      { chinese: '时间不早了，我得回去了。', pinyin: 'Shíjiān bù zǎo le, wǒ děi huíqù le.', vietnamese: 'Không còn sớm nữa rồi, tôi phải về đây.' },
    ],
  },
  {
    unitNumber: 10,
    orderIndex: 28,
    title: 'Lặp lại động từ & tính từ: AA / A一A / ABAB',
    pattern: 'V + V / V + 一 + V (thử làm nhẹ nhàng)  |  Adj + Adj (nhấn mạnh mức độ)',
    explanation:
      'Lặp lại động từ (看看, 听一听, 休息休息) làm ngữ khí nhẹ nhàng, thân mật ("xem thử, nghỉ một chút"). Lặp lại tính từ (高高的, 慢慢地) nhấn mạnh sắc thái miêu tả.',
    commonMistakes: 'Khi đã lặp lại động từ (看看) thì không thêm 一下 nữa (không nói 看看一下).',
    examples: [
      { chinese: '你帮我看一看这个句子对不对。', pinyin: 'Nǐ bāng wǒ kàn yi kàn zhège jùzi duì bu duì.', vietnamese: 'Bạn giúp tôi xem thử câu này đúng không.' },
      { chinese: '周末我想在家休息休息。', pinyin: 'Zhōumò wǒ xiǎng zài jiā xiūxi xiūxi.', vietnamese: 'Cuối tuần tôi muốn ở nhà nghỉ ngơi một chút.' },
    ],
  },
  {
    unitNumber: 10,
    orderIndex: 29,
    title: 'Cấu trúc "Để cho / Bảo ai làm gì": 让 / 叫 + Tân ngữ + Động từ',
    pattern: 'Chủ ngữ + 让 / 叫 + Người + (不/别) + Động từ',
    explanation:
      'Câu kiêm ngữ biểu thị yêu cầu, cho phép hoặc khiến ai đó làm gì.',
    commonMistakes: 'Phủ định đặt 别 hoặc 不要 trước động từ thứ 2 (Đúng: 老师让我们别说话).',
    examples: [
      { chinese: '妈妈让我每天早点儿睡觉。', pinyin: 'Māma ràng wǒ měitiān zǎodiǎnr shuìjiào.', vietnamese: 'Mẹ bảo tôi mỗi ngày đi ngủ sớm một chút.' },
      { chinese: '这件事让我很高兴。', pinyin: 'Zhè jiàn shì ràng wǒ hěn gāoxìng.', vietnamese: 'Chuyện này khiến tôi rất vui.' },
    ],
  },
  {
    unitNumber: 10,
    orderIndex: 30,
    title: 'Đại từ nghi vấn dùng phiếm chỉ (都 / 也)',
    pattern: '谁 / 什么 / 哪儿 / 怎么 + 都 / 也 + (不/没) + Động từ',
    explanation:
      'Dùng 谁, 什么, 哪儿 kết hợp với 都 hoặc 也 để diễn tả "ai cũng", "cái gì cũng", "đâu cũng" (hoặc phủ định "không ai/không gì/không đâu").',
    commonMistakes: 'Bắt buộc phải có 都 hoặc 也 đứng sau đại từ nghi vấn.',
    examples: [
      { chinese: '他什么菜都喜欢吃。', pinyin: 'Tā shénme cài dōu xǐhuan chī.', vietnamese: 'Anh ấy món gì cũng thích ăn.' },
      { chinese: '今天太累了，我哪儿也不想去。', pinyin: 'Jīntiān tài lèi le, wǒ nǎr yě bù xiǎng qù.', vietnamese: 'Hôm nay mệt quá, tôi chẳng muốn đi đâu cả.' },
    ],
  },
];
