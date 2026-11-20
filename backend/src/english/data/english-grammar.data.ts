export interface EnglishGrammarSeed {
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  orderIndex: number;
  title: string;
  pattern: string;
  explanation: string;
  commonMistakes: string;
  examples: Array<{ english: string; vietnamese: string }>;
}

export const ENGLISH_GRAMMAR_DATA: EnglishGrammarSeed[] = [
  // A1
  {
    cefrLevel: 'A1',
    orderIndex: 1,
    title: 'Thì Hiện tại đơn (Present Simple) với To be & Động từ thường',
    pattern: 'S + am/is/are + N/Adj  |  S + V(s/es) + O',
    explanation:
      'Dùng để nói về sự thật hiển nhiên, thói quen hàng ngày hoặc lịch trình cố định. Với chủ ngữ ngôi thứ 3 số ít (he, she, it), động từ thêm -s/-es; phủ định dùng doesn\'t + V nguyên mẫu.',
    commonMistakes: 'Quên thêm -s/-es với he/she/it hoặc dùng "am/is/are" đi chung với động từ thường (Sai: I am work -> Đúng: I work).',
    examples: [
      { english: 'I usually study English for one hour every evening.', vietnamese: 'Tôi thường học tiếng Anh một tiếng mỗi tối.' },
      { english: 'She works in an office near her house.', vietnamese: 'Cô ấy làm việc ở một văn phòng gần nhà.' },
    ],
  },
  {
    cefrLevel: 'A1',
    orderIndex: 2,
    title: 'Thì Hiện tại tiếp diễn (Present Continuous)',
    pattern: 'S + am / is / are + V-ing',
    explanation:
      'Diễn tả hành động đang xảy ra ngay tại thời điểm nói hoặc kế hoạch chắc chắn trong tương lai gần.',
    commonMistakes: 'Quên động từ to be trước V-ing (Sai: He studying -> Đúng: He is studying).',
    examples: [
      { english: 'I am practicing my pronunciation right now.', vietnamese: 'Ngay lúc này tôi đang luyện phát âm.' },
      { english: 'They are preparing dinner in the kitchen.', vietnamese: 'Họ đang chuẩn bị bữa tối trong bếp.' },
    ],
  },
  {
    cefrLevel: 'A1',
    orderIndex: 3,
    title: 'There is / There are & Mạo từ cơ bản (a / an / the)',
    pattern: 'There is + Danh từ số ít / không đếm được  |  There are + Danh từ số nhiều',
    explanation:
      'There is/are dùng để nói "có cái gì ở đâu". Dùng "a/an" khi nhắc đến lần đầu (an trước nguyên âm u,e,o,a,i), dùng "the" khi cả hai đều biết rõ đối tượng.',
    commonMistakes: 'Người Việt hay dịch "có" thành "Have a book on the table" -> Phải dùng "There is a book on the table".',
    examples: [
      { english: 'There is an apple on the table.', vietnamese: 'Có một quả táo ở trên bàn.' },
      { english: 'There are many good books in the library.', vietnamese: 'Có nhiều cuốn sách hay trong thư viện.' },
    ],
  },
  {
    cefrLevel: 'A1',
    orderIndex: 4,
    title: 'Động từ khuyết thiếu cơ bản: Can / Should / Must',
    pattern: 'S + can / should / must + V (nguyên mẫu không "to")',
    explanation:
      'Can: có thể (khả năng/xin phép). Should: nên (lời khuyên). Must: phải (bắt buộc). Động từ theo sau luôn ở dạng nguyên mẫu.',
    commonMistakes: 'Thêm "to" hoặc chia -s sau can/should/must (Sai: He can speaks -> Đúng: He can speak).',
    examples: [
      { english: 'You should review old words every day.', vietnamese: 'Bạn nên ôn lại từ cũ mỗi ngày.' },
      { english: 'Can you help me explain this sentence?', vietnamese: 'Bạn có thể giúp tôi giải thích câu này không?' },
    ],
  },
  // A2
  {
    cefrLevel: 'A2',
    orderIndex: 5,
    title: 'Thì Quá khứ đơn (Past Simple)',
    pattern: 'S + V-ed / V2  |  Phủ định: S + didn\'t + V nguyên mẫu',
    explanation:
      'Diễn tả hành động đã xảy ra và kết thúc hoàn toàn trong quá khứ (yesterday, last week, two days ago).',
    commonMistakes: 'Chia V-ed/V2 cả trong câu phủ định hoặc câu hỏi (Sai: I didn\'t went -> Đúng: I didn\'t go).',
    examples: [
      { english: 'Yesterday I decided to start a new study plan.', vietnamese: 'Hôm qua tôi đã quyết định bắt đầu một kế hoạch học mới.' },
      { english: 'Did you arrive at the airport on time?', vietnamese: 'Bạn có đến sân bay đúng giờ không?' },
    ],
  },
  {
    cefrLevel: 'A2',
    orderIndex: 6,
    title: 'So sánh hơn & So sánh nhất (Comparatives & Superlatives)',
    pattern: 'Tính từ ngắn + -er than / the + -est  |  more + Tính từ dài + than / the most + Tính từ dài',
    explanation:
      'Dùng để so sánh 2 đối tượng (so sánh hơn) hoặc 3 đối tượng trở lên (so sánh nhất). Bất quy tắc: good → better → the best; bad → worse → the worst.',
    commonMistakes: 'Dùng cả "more" và "-er" cùng lúc (Sai: more cheaper -> Đúng: cheaper).',
    examples: [
      { english: 'Studying in the morning is more effective than late at night.', vietnamese: 'Học vào buổi sáng hiệu quả hơn khuya.' },
      { english: 'This is the most convenient way to travel.', vietnamese: 'Đây là cách di chuyển thuận tiện nhất.' },
    ],
  },
  {
    cefrLevel: 'A2',
    orderIndex: 7,
    title: 'Tương lai: Will vs. Be going to',
    pattern: 'S + will + V  (quyết định tức thì/dự đoán)  |  S + am/is/are going to + V (kế hoạch đã định)',
    explanation:
      'Be going to dùng cho dự định đã có kế hoạch từ trước. Will dùng cho quyết định ngay lúc nói, lời hứa hoặc dự đoán.',
    commonMistakes: 'Quên "to" trong "be going to" hoặc thiếu động từ to be.',
    examples: [
      { english: 'I am going to improve my English to B2 this year.', vietnamese: 'Năm nay tôi dự định nâng tiếng Anh lên B2.' },
      { english: 'Wait a second, I will help you carry that luggage.', vietnamese: 'Đợi chút, tôi sẽ giúp bạn mang hành lý đó.' },
    ],
  },
  // B1
  {
    cefrLevel: 'B1',
    orderIndex: 8,
    title: 'Thì Hiện tại hoàn thành (Present Perfect)',
    pattern: 'S + have / has + V3/V-ed (Past Participle)',
    explanation:
      'Diễn tả hành động bắt đầu trong quá khứ kéo dài đến hiện tại (for/since), hoặc trải nghiệm/kết quả ảnh hưởng đến hiện tại (already, yet, ever, recently).',
    commonMistakes: 'Dùng quá khứ đơn khi có "since" hoặc "for + khoảng thời gian kéo dài tới nay".',
    examples: [
      { english: 'I have learned English for two months, and I feel more confident now.', vietnamese: 'Tôi đã học tiếng Anh được 2 tháng và giờ tôi thấy tự tin hơn.' },
      { english: 'Have you ever had an opportunity to work abroad?', vietnamese: 'Bạn đã từng có cơ hội làm việc ở nước ngoài chưa?' },
    ],
  },
  {
    cefrLevel: 'B1',
    orderIndex: 9,
    title: 'Câu điều kiện loại 1 & loại 2 (Conditionals 1 & 2)',
    pattern: 'Loại 1: If + S + V(hiện tại), S + will + V  |  Loại 2: If + S + V(quá khứ/were), S + would + V',
    explanation:
      'Loại 1: điều kiện có thật, có thể xảy ra ở hiện tại/tương lai. Loại 2: giả định không có thật ở hiện tại ("Nếu bây giờ tôi có... thì tôi sẽ...").',
    commonMistakes: 'Dùng "will" trong mệnh đề If (Sai: If it will rain -> Đúng: If it rains).',
    examples: [
      { english: 'If you practice speaking daily, you will communicate much better.', vietnamese: 'Nếu bạn luyện nói hàng ngày, bạn sẽ giao tiếp tốt hơn nhiều.' },
      { english: 'If I had more free time, I would read more English books.', vietnamese: 'Nếu tôi có nhiều thời gian rảnh hơn, tôi sẽ đọc nhiều sách tiếng Anh hơn.' },
    ],
  },
  {
    cefrLevel: 'B1',
    orderIndex: 10,
    title: 'Câu bị động (Passive Voice) & Mệnh đề quan hệ (Relative Clauses)',
    pattern: 'S + be + V3/V-ed (+ by O)  |  Noun + who / which / that + Mệnh đề',
    explanation:
      'Bị động nhấn mạnh đối tượng chịu tác động. Mệnh đề quan hệ (who cho người, which cho vật, that cho cả hai) giúp nối câu tự nhiên ở trình độ B1.',
    commonMistakes: 'Quên động từ "be" trong bị động hoặc lặp lại đại từ ("the book which I bought it" -> bỏ "it").',
    examples: [
      { english: 'English is spoken in many countries around the world.', vietnamese: 'Tiếng Anh được nói ở nhiều quốc gia trên thế giới.' },
      { english: 'The method that you suggested works very well.', vietnamese: 'Phương pháp mà bạn gợi ý hoạt động rất tốt.' },
    ],
  },
  // B2
  {
    cefrLevel: 'B2',
    orderIndex: 11,
    title: 'Động từ khuyết thiếu phỏng đoán quá khứ (Modal Perfects)',
    pattern: 'S + must / might / could / should + have + V3/V-ed',
    explanation:
      'must have V3: chắc hẳn đã. might/could have V3: có lẽ đã. should have V3: lẽ ra nên làm (nhưng đã không làm — tiếc nuối).',
    commonMistakes: 'Dùng "must had" thay vì "must have + V3".',
    examples: [
      { english: 'You must have worked very hard to achieve such a significant result.', vietnamese: 'Bạn hẳn đã làm việc rất chăm chỉ để đạt được kết quả đáng kể như vậy.' },
      { english: 'I should have maintained my study habit earlier.', vietnamese: 'Lẽ ra tôi nên duy trì thói quen học sớm hơn.' },
    ],
  },
  {
    cefrLevel: 'B2',
    orderIndex: 12,
    title: 'Câu điều kiện loại 3 & Mệnh đề phân từ (Participle Clauses)',
    pattern: 'If + S + had + V3, S + would have + V3  |  V-ing / V3..., S + V...',
    explanation:
      'Điều kiện loại 3 nói về giả định trái với quá khứ. Mệnh đề phân từ rút gọn 2 mệnh đề cùng chủ ngữ giúp câu văn B2 súc tích, học thuật hơn.',
    commonMistakes: 'Hai vế mệnh đề phân từ phải có cùng chủ ngữ.',
    examples: [
      { english: 'Having implemented the new schedule, we became much more efficient.', vietnamese: 'Sau khi triển khai lịch trình mới, chúng tôi trở nên hiệu quả hơn nhiều.' },
      { english: 'If she had adapted faster, she would have avoided that consequence.', vietnamese: 'Nếu cô ấy thích nghi nhanh hơn, cô ấy đã tránh được hệ quả đó.' },
    ],
  },
  {
    cefrLevel: 'A1',
    orderIndex: 13,
    title: 'Giới từ chỉ thời gian & nơi chốn (in / on / at)',
    pattern: 'at + giờ/địa điểm cụ thể  |  on + ngày/thứ/bề mặt  |  in + tháng/năm/không gian kín',
    explanation:
      'at dùng cho giờ giấc (at 7 a.m.) hoặc điểm cụ thể (at home, at work). on dùng cho thứ/ngày (on Monday) và bề mặt (on the table). in dùng cho tháng, năm, buổi trong ngày (in the morning) và bên trong (in Hanoi).',
    commonMistakes: 'Nói "in Monday" hoặc "on the morning" -> Đúng: on Monday, in the morning.',
    examples: [
      { english: 'I usually wake up at 6:30 in the morning.', vietnamese: 'Tôi thường thức dậy lúc 6:30 vào buổi sáng.' },
      { english: 'We have an English class on Tuesday.', vietnamese: 'Chúng tôi có lớp tiếng Anh vào thứ Ba.' },
    ],
  },
  {
    cefrLevel: 'A1',
    orderIndex: 14,
    title: 'Trạng từ tần suất (always / usually / often / sometimes / never)',
    pattern: 'S + Trạng từ tần suất + V thường  |  S + am/is/are + Trạng từ tần suất',
    explanation:
      'Trạng từ tần suất đứng TRƯỚC động từ thường nhưng đứng SAU động từ to be (am/is/are).',
    commonMistakes: 'Đặt "usually" trước to be (Sai: She usually is late -> Đúng: She is usually late).',
    examples: [
      { english: 'He always reviews new vocabulary before sleeping.', vietnamese: 'Anh ấy luôn ôn lại từ vựng mới trước khi ngủ.' },
      { english: 'They are never late for important meetings.', vietnamese: 'Họ không bao giờ đi trễ các cuộc họp quan trọng.' },
    ],
  },
  {
    cefrLevel: 'A2',
    orderIndex: 15,
    title: 'Danh từ đếm được & không đếm được (much / many / a lot of / some / any)',
    pattern: 'many + N đếm được số nhiều  |  much + N không đếm được  |  some (khẳng định) / any (phủ định, nghi vấn)',
    explanation:
      'Dùng many cho danh từ đếm được số nhiều (many books), much cho danh từ không đếm được (much time, much water). A lot of dùng được cho cả hai.',
    commonMistakes: 'Thêm -s vào danh từ không đếm được như information, advice, luggage, homework.',
    examples: [
      { english: 'How much time do you spend practicing every day?', vietnamese: 'Bạn dành bao nhiêu thời gian luyện tập mỗi ngày?' },
      { english: 'She didn’t bring much luggage for the trip.', vietnamese: 'Cô ấy không mang nhiều hành lý cho chuyến đi.' },
    ],
  },
  {
    cefrLevel: 'B1',
    orderIndex: 16,
    title: 'Danh động từ (Gerund V-ing) vs Động từ nguyên mẫu có "to" (to-V)',
    pattern: 'enjoy / avoid / finish / suggest / practice + V-ing  |  decide / plan / hope / want + to-V',
    explanation:
      'Một số động từ đi kèm V-ing (enjoy learning, finish writing, suggest starting), trong khi nhóm khác đi kèm to-V (decide to study, hope to improve). Sau giới từ LUÔN dùng V-ing.',
    commonMistakes: 'Sau giới từ dùng to-V (Sai: good at to speak -> Đúng: good at speaking).',
    examples: [
      { english: 'I really enjoy practicing English with my friends.', vietnamese: 'Tôi thực sự thích luyện tiếng Anh cùng bạn bè.' },
      { english: 'She decided to focus on her pronunciation this month.', vietnamese: 'Cô ấy quyết định tập trung vào phát âm trong tháng này.' },
    ],
  },
  {
    cefrLevel: 'B1',
    orderIndex: 17,
    title: 'Câu tường thuật cơ bản (Reported Speech)',
    pattern: 'S + said (that) / told + O + Mệnh đề lùi 1 thì',
    explanation:
      'Khi tường thuật lại lời nói ở quá khứ, động từ lùi một thì (hiện tại đơn → quá khứ đơn, will → would, can → could) và đổi đại từ, trạng từ thời gian cho phù hợp.',
    commonMistakes: 'Dùng "said me" thay vì "told me" hoặc "said to me".',
    examples: [
      { english: 'The teacher told us that daily review was essential.', vietnamese: 'Giáo viên nói với chúng tôi rằng ôn tập hàng ngày rất cần thiết.' },
      { english: 'He said he would send me the report the next day.', vietnamese: 'Anh ấy nói anh ấy sẽ gửi báo cáo cho tôi vào ngày hôm sau.' },
    ],
  },
  {
    cefrLevel: 'B2',
    orderIndex: 18,
    title: 'Đảo ngữ nhấn mạnh (Inversion: Not only... but also / Never / Seldom)',
    pattern: 'Not only / Never / Seldom / Rarely + Trợ động từ + S + V',
    explanation:
      'Đặt trạng từ phủ định hoặc giới hạn lên đầu câu để nhấn mạnh trong văn phong B2 trang trọng, đồng thời đảo trợ động từ (do/did/have/can/will) lên trước chủ ngữ.',
    commonMistakes: 'Quên đảo trợ động từ lên trước chủ ngữ sau "Not only" ở đầu câu.',
    examples: [
      { english: 'Not only does reading expand your vocabulary, but it also improves your writing.', vietnamese: 'Đọc sách không chỉ mở rộng vốn từ mà còn cải thiện kỹ năng viết của bạn.' },
      { english: 'Never have I seen such a well-organized study plan.', vietnamese: 'Chưa bao giờ tôi thấy một kế hoạch học tập được sắp xếp tốt đến vậy.' },
    ],
  },
];
