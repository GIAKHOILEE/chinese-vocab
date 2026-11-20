export interface HskGrammarSeed {
  level?: 'HSK1' | 'HSK2' | 'HSK3';
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

export const HSK1_GRAMMAR_DATA: HskGrammarSeed[] = [
  {
    level: 'HSK1',
    unitNumber: 1,
    orderIndex: 1,
    title: 'HSK1 - Câu khẳng định & phủ định với 是 (shì)',
    pattern: 'Chủ ngữ + 是 / 不是 + Danh từ',
    explanation:
      'Động từ 是 nghĩa là "là", dùng để nối chủ ngữ với danh từ (nghề nghiệp, quốc tịch, thân phận). Phủ định thêm 不 (đọc bú trước thanh 4) thành 不是.',
    commonMistakes: 'Không dùng 是 trực tiếp trước tính từ kiểu "我是很高" (Đúng: 我很高).',
    examples: [
      { chinese: '我是学生，他不是老师。', pinyin: 'Wǒ shì xuésheng, tā bú shì lǎoshī.', vietnamese: 'Tôi là học sinh, anh ấy không phải giáo viên.' },
      { chinese: '这是我的中文书。', pinyin: 'Zhè shì wǒ de Zhōngwén shū.', vietnamese: 'Đây là sách tiếng Trung của tôi.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 1,
    orderIndex: 2,
    title: 'HSK1 - Câu hỏi Có/Không với 吗 (ma) & 呢 (ne)',
    pattern: 'Câu trần thuật + 吗？  |  Danh từ / Đại từ + 呢？',
    explanation:
      'Đặt 吗 ở cuối câu trần thuật để tạo thành câu hỏi Có/Không. Đặt 呢 sau danh từ/đại từ để hỏi ngược lại ("Còn ... thì sao?") hoặc hỏi vị trí ("... ở đâu rồi?").',
    commonMistakes: 'Đã dùng đại từ nghi vấn (什么, 谁, 哪儿) thì KHÔNG thêm 吗 ở cuối câu.',
    examples: [
      { chinese: '你是中国人吗？', pinyin: 'Nǐ shì Zhōngguórén ma?', vietnamese: 'Bạn là người Trung Quốc phải không?' },
      { chinese: '我很好，你呢？', pinyin: 'Wǒ hěn hǎo, nǐ ne?', vietnamese: 'Tôi rất khỏe, còn bạn thì sao?' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 1,
    orderIndex: 3,
    title: 'HSK1 - Câu vị ngữ tính từ với 很 / 非常 / 太...了',
    pattern: 'Chủ ngữ + 很 / 非常 + Tính từ  |  太 + Tính từ + 了！',
    explanation:
      'Trong tiếng Trung, tính từ làm vị ngữ thường đi kèm phó từ chỉ mức độ như 很 (mang tính trung hòa ngữ pháp, không nhất thiết dịch là "rất"), 非常 (vô cùng), hoặc 太...了 (quá... rồi!).',
    commonMistakes: 'Phủ định chỉ dùng 不 + Tính từ (không nói 不很 + Tính từ trừ khi nhấn mạnh tương phản).',
    examples: [
      { chinese: '今天天气很好，房间非常干净。', pinyin: 'Jīntiān tiānqì hěn hǎo, fángjiān fēicháng gānjìng.', vietnamese: 'Thời tiết hôm nay rất đẹp, căn phòng vô cùng sạch sẽ.' },
      { chinese: '这个菜太好吃了！', pinyin: 'Zhège cài tài hǎochī le!', vietnamese: 'Món này ngon quá đi mất!' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 2,
    orderIndex: 4,
    title: 'HSK1 - Đại từ nhân xưng & Số nhiều với 们 (men)',
    pattern: '我 / 你 / 您 / 他 / 她 + (们)',
    explanation:
      'Thêm 们 sau đại từ nhân xưng (我们, 你们, 他们, 她们) hoặc danh từ chỉ người (同学们, 朋友们) để chỉ số nhiều. 您 là dạng kính ngữ của 你.',
    commonMistakes: 'Khi đã có số lượng cụ thể đứng trước (như 三个学生), KHÔNG thêm 们 ở sau.',
    examples: [
      { chinese: '您好！请问您叫什么名字？', pinyin: 'Nín hǎo! Qǐngwèn nín jiào shénme míngzi?', vietnamese: 'Xin chào ngài! Xin hỏi ngài tên là gì?' },
      { chinese: '我们都是好朋友。', pinyin: 'Wǒmen dōu shì hǎo péngyou.', vietnamese: 'Chúng tôi đều là bạn tốt.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 2,
    orderIndex: 5,
    title: 'HSK1 - Trợ từ kết cấu 的 (de) biểu thị sở hữu & định ngữ',
    pattern: 'Chủ sở hữu / Định ngữ + 的 + Danh từ trung tâm',
    explanation:
      '的 nối định ngữ (người sở hữu, tính từ, cụm miêu tả) với danh từ đứng sau. Khi chỉ quan hệ gia đình thân thiết (我爸爸, 我家), có thể lược bỏ 的.',
    commonMistakes: 'Tiếng Trung đặt định ngữ TRƯỚC danh từ trung tâm, ngược với tiếng Việt (sách của tôi -> 我的书).',
    examples: [
      { chinese: '这是老师的新手机。', pinyin: 'Zhè shì lǎoshī de xīn shǒujī.', vietnamese: 'Đây là điện thoại mới của thầy giáo.' },
      { chinese: '我喜欢干净的房间。', pinyin: 'Wǒ xǐhuan gānjìng de fángjiān.', vietnamese: 'Tôi thích căn phòng sạch sẽ.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 2,
    orderIndex: 6,
    title: 'HSK1 - Đại từ nghi vấn: 什么, 谁, 哪, 哪儿, 怎么, 几, 多少',
    pattern: 'Vị trí đại từ nghi vấn trùng với vị trí câu trả lời',
    explanation:
      'Khác với tiếng Anh đảo từ hỏi lên đầu câu, tiếng Trung giữ nguyên trật tự câu trần thuật và thay đúng thành phần cần hỏi bằng 什么 (gì), 谁 (ai), 哪 (nào), 哪儿/哪里 (đâu), 怎么 (thế nào/bằng cách nào), 几 (mấy <10), 多少 (bao nhiêu).',
    commonMistakes: 'Hỏi tuổi người lớn dùng 多大, hỏi trẻ em dưới 10 tuổi dùng 几岁. Sau 多少 không bắt buộc có lượng từ.',
    examples: [
      { chinese: '你去哪儿？你怎么去医院？', pinyin: 'Nǐ qù nǎr? Nǐ zěnme qù yīyuàn?', vietnamese: 'Bạn đi đâu đấy? Bạn đi bệnh viện bằng cách nào?' },
      { chinese: '你们班有多少个学生？', pinyin: 'Nǐmen bān yǒu duōshao ge xuésheng?', vietnamese: 'Lớp các bạn có bao nhiêu học sinh?' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 3,
    orderIndex: 7,
    title: 'HSK1 - Động từ 有 (yǒu) chỉ sở hữu & tồn tại',
    pattern: 'A + 有 / 没有 + B  |  Nơi chốn + 有 / 没有 + Người/Vật',
    explanation:
      '有 vừa mang nghĩa "có" (sở hữu), vừa dùng để nói "ở đâu có cái gì" (tồn tại). Phủ định của 有 LUÔN là 没有 (hoặc 没), tuyệt đối KHÔNG dùng 不有.',
    commonMistakes: 'Phủ định là 没有, KHÔNG bao giờ nói 不有 (Sai: 我不有钱 -> Đúng: 我没有钱).',
    examples: [
      { chinese: '我家有四口人，我没有哥哥。', pinyin: 'Wǒ jiā yǒu sì kǒu rén, wǒ méiyǒu gēge.', vietnamese: 'Nhà tôi có 4 người, tôi không có anh trai.' },
      { chinese: '桌子上有一杯咖啡和两本书。', pinyin: 'Zhuōzi shàng yǒu yì bēi kāfēi hé liǎng běn shū.', vietnamese: 'Trên bàn có một cốc cà phê và hai quyển sách.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 3,
    orderIndex: 8,
    title: 'HSK1 - Động từ 在 (zài) & Giới từ 在 chỉ vị trí',
    pattern: 'Chủ ngữ + 在 + Nơi chốn  |  Chủ ngữ + 在 + Nơi chốn + Động từ + Tân ngữ',
    explanation:
      '在 làm động từ nghĩa là "ở tại". Khi làm giới từ chỉ địa điểm xảy ra hành động, cụm 在 + Nơi chốn PHẢI đứng TRƯỚC động từ chính.',
    commonMistakes: 'Người Việt hay đặt nơi chốn ở cuối câu (Sai: 我学习中文在学校 -> Đúng: 我在学校学习中文).',
    examples: [
      { chinese: '书在桌子上，手机在书包里。', pinyin: 'Shū zài zhuōzi shàng, shǒujī zài shūbāo lǐ.', vietnamese: 'Sách ở trên bàn, điện thoại ở trong cặp sách.' },
      { chinese: '哥哥在北京工作。', pinyin: 'Gēge zài Běijīng gōngzuò.', vietnamese: 'Anh trai làm việc ở Bắc Kinh.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 3,
    orderIndex: 9,
    title: 'HSK1 - Phương vị từ cơ bản (上, 下, 里, 外, 前, 后, 左, 右)',
    pattern: 'Danh từ + (的) + 上/下/里/外/前/后/东/南/西/北 (+ 边)',
    explanation:
      'Dùng để chỉ vị trí tương đối so với vật mốc. Phương vị từ đứng SAU danh từ mốc (ngược với tiếng Việt "trên bàn" -> 桌子上).',
    commonMistakes: 'Quên đặt danh từ trước phương vị từ (Sai: 上桌子 -> Đúng: 桌子上).',
    examples: [
      { chinese: '学校东边有一个图书馆。', pinyin: 'Xuéxiào dōngbiān yǒu yí ge túshūguǎn.', vietnamese: 'Phía đông trường học có một thư viện.' },
      { chinese: '房间里没有人。', pinyin: 'Fángjiān lǐ méiyǒu rén.', vietnamese: 'Trong phòng không có ai.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 4,
    orderIndex: 10,
    title: 'HSK1 - Số đếm, 二 vs 两, và Lượng từ thông dụng (个, 本, 杯, 口, 家, 块)',
    pattern: 'Số từ + Lượng từ + Danh từ',
    explanation:
      'Giữa số từ và danh từ BẮT BUỘC có lượng từ (个 dùng chung, 本 cho sách, 杯 cho cốc, 口 cho người trong gia đình, 家 cho cửa hàng/công ty, 块 cho miếng/tiền). Trước lượng từ dùng 两 (liǎng) thay vì 二.',
    commonMistakes: 'Dùng 二 thay vì 两 trước lượng từ (Sai: 二个人 -> Đúng: 两个人).',
    examples: [
      { chinese: '我要两杯牛奶和三块面包。', pinyin: 'Wǒ yào liǎng bēi niúnǎi hé sān kuài miànbāo.', vietnamese: 'Tôi muốn 2 cốc sữa bò và 3 miếng bánh mì.' },
      { chinese: '她买了两本中文书。', pinyin: 'Tā mǎi le liǎng běn Zhōngwén shū.', vietnamese: 'Cô ấy đã mua 2 quyển sách tiếng Trung.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 4,
    orderIndex: 11,
    title: 'HSK1 - Cách nói Thời gian: Giờ, Phút, Ngày, Tháng, Năm, Thứ',
    pattern: 'Năm 年 + Tháng 月 + Ngày 号/日 + Thứ 星期X + Buổi + Giờ 点 + Phút 分',
    explanation:
      'Tiếng Trung sắp xếp thời gian từ LỚN đến NHỎ. Giờ dùng 点 (diǎn), rưỡi dùng 半 (bàn), kém dùng 差 (chà). Trạng ngữ chỉ thời gian đứng trước hoặc ngay sau chủ ngữ.',
    commonMistakes: 'Không đặt thời gian ở cuối câu như tiếng Việt; thứ 2 là 星期一, Chủ nhật là 星期天/星期日.',
    examples: [
      { chinese: '现在是上午八点半。', pinyin: 'Xiànzài shì shàngwǔ bā diǎn bàn.', vietnamese: 'Bây giờ là 8 giờ 30 phút sáng.' },
      { chinese: '我明天下午三点去医院。', pinyin: 'Wǒ míngtiān xiàwǔ sān diǎn qù yīyuàn.', vietnamese: '3 giờ chiều mai tôi đi bệnh viện.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 4,
    orderIndex: 12,
    title: 'HSK1 - Cách nói Tiền tệ (元/块, 角/毛, 分)',
    pattern: 'Số + 块 (元) + Số + 毛 (角) + Số + 分',
    explanation:
      'Trong khẩu ngữ dùng 块 (kuài - đồng/tệ), 毛 (máo - hào), 分 (fēn - xu). Trong văn viết trang trọng dùng 元 (yuán) và 角 (jiǎo).',
    commonMistakes: '2 tệ dùng 两块 (liǎng kuài), nhưng 2 hào trong 1.20 tệ là 一块二(毛).',
    examples: [
      { chinese: '这杯茶十五块五毛。', pinyin: 'Zhè bēi chá shíwǔ kuài wǔ máo.', vietnamese: 'Cốc trà này giá 15 tệ 5 hào.' },
      { chinese: '那件衣服两百块钱。', pinyin: 'Nà jiàn yīfu liǎngbǎi kuài qián.', vietnamese: 'Bộ quần áo kia 200 tệ.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 5,
    orderIndex: 13,
    title: 'HSK1 - Động từ năng nguyện: 想 (muốn), 要 (muốn/cần/sẽ), 会 (biết), 能 (có thể)',
    pattern: 'Chủ ngữ + 想 / 要 / 会 / 能 + Động từ + (Tân ngữ)',
    explanation:
      '想: mong muốn nhẹ nhàng; 要: muốn/cần/sắp làm (phủ định muốn là 不想, đừng dùng 不要 vì 不要 nghĩa là "đừng!"); 会: biết kỹ năng qua học tập hoặc "sẽ"; 能: có khả năng/điều kiện.',
    commonMistakes: 'Phủ định của "tôi muốn" (我要) là 我不想, không dùng 我不要 (trừ khi từ chối thẳng hoặc khuyên "đừng").',
    examples: [
      { chinese: '我想喝茶，不想喝咖啡。', pinyin: 'Wǒ xiǎng hē chá, bù xiǎng hē kāfēi.', vietnamese: 'Tôi muốn uống trà, không muốn uống cà phê.' },
      { chinese: '我会说一点儿汉语，明天能来上课。', pinyin: 'Wǒ huì shuō yìdiǎnr Hànyǔ, míngtiān néng lái shàngkè.', vietnamese: 'Tôi biết nói một chút tiếng Hán, ngày mai có thể đến học.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 5,
    orderIndex: 14,
    title: 'HSK1 - Phủ định 不 (bù) vs 没 / 没有 (méiyǒu)',
    pattern: '不 + Động từ/Tính từ (hiện tại, tương lai, thói quen)  |  没(有) + Động từ (quá khứ)',
    explanation:
      '不 dùng để phủ định ý muốn, thói quen, sự thật ở hiện tại/tương lai hoặc tính từ. 没(有) dùng để phủ định hành động ĐÃ xảy ra trong quá khứ hoặc phủ định động từ 有.',
    commonMistakes: 'Nói về việc hôm qua không làm phải dùng 没(有), không dùng 不 (Đúng: 昨天我没去学校).',
    examples: [
      { chinese: '今天不冷，他不去公园。', pinyin: 'Jīntiān bù lěng, tā bú qù gōngyuán.', vietnamese: 'Hôm nay không lạnh, anh ấy không đi công viên.' },
      { chinese: '我昨天没有吃早饭。', pinyin: 'Wǒ zuótiān méiyǒu chī zǎofàn.', vietnamese: 'Hôm qua tôi đã không ăn sáng.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 6,
    orderIndex: 15,
    title: 'HSK1 - Câu hỏi Chính-Phản (V不V / Adj不Adj / V没V)',
    pattern: 'Chủ ngữ + V 不 V + (Tân ngữ)?  |  Chủ ngữ + V + Tân ngữ + 了没有?',
    explanation:
      'Lặp lại động từ/tính từ ở dạng khẳng định + phủ định để đặt câu hỏi Có/Không (thân mật hơn 吗). Hỏi việc đã xảy ra chưa dùng V没V hoặc ...了没有.',
    commonMistakes: 'Đã dùng câu hỏi chính-phản thì KHÔNG thêm 吗 ở cuối câu.',
    examples: [
      { chinese: '你喝不喝牛奶？今天冷不冷？', pinyin: 'Nǐ hē bu hē niúnǎi? Jīntiān lěng bu lěng?', vietnamese: 'Bạn có uống sữa không? Hôm nay có lạnh không?' },
      { chinese: '他回家了没有？', pinyin: 'Tā huíjiā le méiyǒu?', vietnamese: 'Anh ấy đã về nhà chưa?' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 6,
    orderIndex: 16,
    title: 'HSK1 - Câu hỏi lựa chọn với 还是 (háishi)',
    pattern: 'Chủ ngữ + A + 还是 + B？',
    explanation:
      'Dùng 还是 ("hay là") để nối 2 lựa chọn trong CÂU HỎI. (Lưu ý ở HSK 2 sẽ học 或者 dùng cho câu trần thuật).',
    commonMistakes: 'Không dùng 吗 ở cuối câu hỏi đã có 还是.',
    examples: [
      { chinese: '你喝茶还是喝水？', pinyin: 'Nǐ hē chá háishi hē shuǐ?', vietnamese: 'Bạn uống trà hay uống nước?' },
      { chinese: '你爸爸是老师还是医生？', pinyin: 'Nǐ bàba shì lǎoshī háishi yīshēng?', vietnamese: 'Bố bạn là giáo viên hay bác sĩ?' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 6,
    orderIndex: 17,
    title: 'HSK1 - Phó từ phạm vi & liên kết cơ bản: 都, 也, 还, 一起/一块儿',
    pattern: 'Chủ ngữ + 都 / 也 / 还 / 一起 + Động từ',
    explanation:
      'Phó từ tiếng Trung LUÔN đứng SAU chủ ngữ và TRƯỚC động từ/tính từ. 都 (đều - chỉ từ 2 đối tượng trở lên đứng trước), 也 (cũng), 还 (còn), 一起/一块儿 (cùng nhau).',
    commonMistakes: 'Không đặt 也 hay 都 trước chủ ngữ (Sai: 也我是学生 -> Đúng: 我也是学生).',
    examples: [
      { chinese: '我和弟弟都学习中文。', pinyin: 'Wǒ hé dìdi dōu xuéxí Zhōngwén.', vietnamese: 'Tôi và em trai đều học tiếng Trung.' },
      { chinese: '明天我们一起去图书馆吧。', pinyin: 'Míngtiān wǒmen yìqǐ qù túshūguǎn ba.', vietnamese: 'Ngày mai chúng ta cùng nhau đi thư viện nhé.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 7,
    orderIndex: 18,
    title: 'HSK1 - Hành động đang diễn ra (在 / 正在 ... 呢) & Trợ từ 了 cơ bản',
    pattern: 'Chủ ngữ + (正)在 + Động từ + (呢)  |  Chủ ngữ + Động từ + 了 + Tân ngữ',
    explanation:
      '在/正在...呢 diễn tả việc đang làm ngay lúc này. 了 sau động từ diễn tả hành động đã hoàn tất; 了 cuối câu diễn tả trạng thái mới ("rồi", ví dụ 下雨了 - trời mưa rồi).',
    commonMistakes: 'Khi phủ định việc đã làm bằng 没(有), phải bỏ 了 sau động từ.',
    examples: [
      { chinese: '外边正在下雨呢。', pinyin: 'Wàibian zhèngzài xiàyǔ ne.', vietnamese: 'Bên ngoài trời đang mưa đấy.' },
      { chinese: '他买了两个面包。', pinyin: 'Tā mǎi le liǎng ge miànbāo.', vietnamese: 'Anh ấy đã mua hai cái bánh mì.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 7,
    orderIndex: 19,
    title: 'HSK1 - Câu cầu khiến & đề nghị: 请 (qǐng), 别 (bié), ...吧 (ba)',
    pattern: '请 + Động từ...  |  别 + Động từ (+ 了)!  |  Câu + 吧',
    explanation:
      '请 (xin mời) làm câu lịch sự; 别 (đừng) dùng để khuyên ngăn; 吧 ở cuối câu biểu thị lời đề nghị nhẹ nhàng, rủ rê ("nhé, đi thôi").',
    commonMistakes: '别 luôn đứng trước động từ; dùng 别...了 khi bảo ai dừng việc đang làm.',
    examples: [
      { chinese: '请进！请坐！', pinyin: 'Qǐng jìn! Qǐng zuò!', vietnamese: 'Mời vào! Mời ngồi!' },
      { chinese: '孩子在睡觉，你别说话了。', pinyin: 'Háizi zài shuìjiào, nǐ bié shuōhuà le.', vietnamese: 'Em bé đang ngủ, bạn đừng nói chuyện nữa.' },
    ],
  },
  {
    level: 'HSK1',
    unitNumber: 8,
    orderIndex: 20,
    title: 'HSK1 - Câu liên động (Đi đâu làm gì) & Giới từ 从 / 跟 / 和',
    pattern: 'Chủ ngữ + 去/来 + Nơi chốn + Động từ  |  从 + Điểm đầu + 到 + Điểm cuối',
    explanation:
      'Hai động từ liên tiếp cùng chủ ngữ biểu thị mục đích (đi đâu để làm gì, đến đâu làm gì). 从...到... chỉ khoảng thời gian/địa điểm từ A đến B; 跟/和 + người + cùng làm gì.',
    commonMistakes: 'Không thêm từ nối giữa Nơi chốn và Động từ mục đích (Đúng: 去商店买水果).',
    examples: [
      { chinese: '妈妈去超市买苹果。', pinyin: 'Māma qù chāoshì mǎi píngguǒ.', vietnamese: 'Mẹ đi siêu thị mua táo.' },
      { chinese: '我们从星期一到星期五上课。', pinyin: 'Wǒmen cóng Xīngqīyī dào Xīngqīwǔ shàngkè.', vietnamese: 'Chúng tôi đi học từ thứ Hai đến thứ Sáu.' },
    ],
  },
];
