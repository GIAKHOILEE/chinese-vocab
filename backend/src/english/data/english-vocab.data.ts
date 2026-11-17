export interface EnglishVocabSeed {
  word: string;
  ipa: string;
  meaning: string;
  partOfSpeech: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  topic: string;
  exampleEn: string;
  exampleVi: string;
}

export const ENGLISH_VOCAB_DATA: EnglishVocabSeed[] = [
  // ==================== A1 (CƠ BẢN NHẤT) ====================
  { word: 'introduce', ipa: '/ˌɪntrəˈdjuːs/', meaning: 'giới thiệu', partOfSpeech: 'Verb', cefrLevel: 'A1', topic: 'Daily Life & Greetings', exampleEn: 'Let me introduce my friend to you.', exampleVi: 'Để tôi giới thiệu bạn của tôi với bạn.' },
  { word: 'usually', ipa: '/ˈjuːʒuəli/', meaning: 'thường xuyên', partOfSpeech: 'Adverb', cefrLevel: 'A1', topic: 'Daily Life & Greetings', exampleEn: 'I usually wake up at 6:30 a.m.', exampleVi: 'Tôi thường thức dậy lúc 6 giờ 30 sáng.' },
  { word: 'schedule', ipa: '/ˈskedʒuːl/', meaning: 'lịch trình, thời khóa biểu', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Daily Life & Greetings', exampleEn: 'My schedule is very busy today.', exampleVi: 'Lịch trình của tôi hôm nay rất bận.' },
  { word: 'favorite', ipa: '/ˈfeɪvərɪt/', meaning: 'yêu thích nhất', partOfSpeech: 'Adjective', cefrLevel: 'A1', topic: 'Daily Life & Greetings', exampleEn: 'What is your favorite food?', exampleVi: 'Món ăn yêu thích của bạn là gì?' },
  { word: 'habit', ipa: '/ˈhæbɪt/', meaning: 'thói quen', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Daily Life & Greetings', exampleEn: 'Reading every day is a good habit.', exampleVi: 'Đọc sách mỗi ngày là một thói quen tốt.' },
  { word: 'neighbor', ipa: '/ˈneɪbər/', meaning: 'hàng xóm', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Daily Life & Greetings', exampleEn: 'Our neighbor is very friendly.', exampleVi: 'Hàng xóm của chúng tôi rất thân thiện.' },
  { word: 'breakfast', ipa: '/ˈbrekfəst/', meaning: 'bữa sáng', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Food & Shopping', exampleEn: 'I always have eggs for breakfast.', exampleVi: 'Tôi luôn ăn trứng vào bữa sáng.' },
  { word: 'delicious', ipa: '/dɪˈlɪʃəs/', meaning: 'ngon miệng', partOfSpeech: 'Adjective', cefrLevel: 'A1', topic: 'Food & Shopping', exampleEn: 'This soup is really delicious.', exampleVi: 'Món súp này thực sự rất ngon.' },
  { word: 'cheap', ipa: '/tʃiːp/', meaning: 'rẻ', partOfSpeech: 'Adjective', cefrLevel: 'A1', topic: 'Food & Shopping', exampleEn: 'This shirt is very cheap.', exampleVi: 'Chiếc áo này rất rẻ.' },
  { word: 'expensive', ipa: '/ɪkˈspensɪv/', meaning: 'đắt tiền', partOfSpeech: 'Adjective', cefrLevel: 'A1', topic: 'Food & Shopping', exampleEn: 'That phone is too expensive for me.', exampleVi: 'Chiếc điện thoại đó quá đắt đối với tôi.' },
  { word: 'order', ipa: '/ˈɔːrdər/', meaning: 'gọi món, đặt hàng', partOfSpeech: 'Verb', cefrLevel: 'A1', topic: 'Food & Shopping', exampleEn: 'Are you ready to order?', exampleVi: 'Bạn đã sẵn sàng gọi món chưa?' },
  { word: 'weekend', ipa: '/ˌwiːkˈend/', meaning: 'cuối tuần', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Time & Hobbies', exampleEn: 'I like to relax on the weekend.', exampleVi: 'Tôi thích thư giãn vào cuối tuần.' },
  { word: 'weather', ipa: '/ˈweðər/', meaning: 'thời tiết', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Time & Hobbies', exampleEn: 'The weather is sunny today.', exampleVi: 'Thời tiết hôm nay có nắng.' },
  { word: 'exercise', ipa: '/ˈeksərsaɪz/', meaning: 'tập thể dục, bài tập', partOfSpeech: 'Verb', cefrLevel: 'A1', topic: 'Health & Lifestyle', exampleEn: 'I exercise for thirty minutes every morning.', exampleVi: 'Tôi tập thể dục 30 phút mỗi sáng.' },
  { word: 'tired', ipa: '/ˈtaɪərd/', meaning: 'mệt mỏi', partOfSpeech: 'Adjective', cefrLevel: 'A1', topic: 'Health & Lifestyle', exampleEn: 'She feels tired after work.', exampleVi: 'Cô ấy cảm thấy mệt sau giờ làm.' },

  // ==================== A2 (SƠ TRUNG CẤP) ====================
  { word: 'improve', ipa: '/ɪmˈpruːv/', meaning: 'cải thiện, tiến bộ', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Learning & Work', exampleEn: 'I want to improve my English speaking.', exampleVi: 'Tôi muốn cải thiện kỹ năng nói tiếng Anh.' },
  { word: 'experience', ipa: '/ɪkˈspɪriəns/', meaning: 'kinh nghiệm, trải nghiệm', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Learning & Work', exampleEn: 'She has three years of work experience.', exampleVi: 'Cô ấy có ba năm kinh nghiệm làm việc.' },
  { word: 'colleague', ipa: '/ˈkɑːliːɡ/', meaning: 'đồng nghiệp', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Learning & Work', exampleEn: 'My colleagues are helpful and kind.', exampleVi: 'Đồng nghiệp của tôi rất nhiệt tình và tốt bụng.' },
  { word: 'explain', ipa: '/ɪkˈspleɪn/', meaning: 'giải thích', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Learning & Work', exampleEn: 'Could you explain this word again?', exampleVi: 'Bạn có thể giải thích lại từ này không?' },
  { word: 'prepare', ipa: '/prɪˈper/', meaning: 'chuẩn bị', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Learning & Work', exampleEn: 'We need to prepare for the meeting.', exampleVi: 'Chúng ta cần chuẩn bị cho cuộc họp.' },
  { word: 'decide', ipa: '/dɪˈsaɪd/', meaning: 'quyết định', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Learning & Work', exampleEn: 'I decided to study every evening.', exampleVi: 'Tôi đã quyết định học mỗi tối.' },
  { word: 'luggage', ipa: '/ˈlʌɡɪdʒ/', meaning: 'hành lý', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Travel & Transport', exampleEn: 'Do not leave your luggage unattended.', exampleVi: 'Đừng để hành lý của bạn không có người trông.' },
  { word: 'convenient', ipa: '/kənˈviːniənt/', meaning: 'thuận tiện, tiện lợi', partOfSpeech: 'Adjective', cefrLevel: 'A2', topic: 'Travel & Transport', exampleEn: 'Taking the subway is very convenient.', exampleVi: 'Đi tàu điện ngầm rất thuận tiện.' },
  { word: 'arrive', ipa: '/əˈraɪv/', meaning: 'đến nơi', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Travel & Transport', exampleEn: 'The train will arrive at 8 p.m.', exampleVi: 'Tàu sẽ đến lúc 8 giờ tối.' },
  { word: 'direction', ipa: '/dəˈrekʃn/', meaning: 'phương hướng, chỉ dẫn', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Travel & Transport', exampleEn: 'Can you give me directions to the station?', exampleVi: 'Bạn có thể chỉ đường cho tôi tới nhà ga không?' },
  { word: 'crowded', ipa: '/ˈkraʊdɪd/', meaning: 'đông đúc', partOfSpeech: 'Adjective', cefrLevel: 'A2', topic: 'Travel & Transport', exampleEn: 'The bus is always crowded in the morning.', exampleVi: 'Xe buýt luôn đông đúc vào buổi sáng.' },
  { word: 'healthy', ipa: '/ˈhelθi/', meaning: 'khỏe mạnh, lành mạnh', partOfSpeech: 'Adjective', cefrLevel: 'A2', topic: 'Health & Lifestyle', exampleEn: 'Eating vegetables keeps you healthy.', exampleVi: 'Ăn rau giúp bạn khỏe mạnh.' },
  { word: 'appointment', ipa: '/əˈpɔɪntmənt/', meaning: 'cuộc hẹn', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Health & Lifestyle', exampleEn: 'I have a doctor appointment tomorrow.', exampleVi: 'Tôi có lịch hẹn với bác sĩ vào ngày mai.' },
  { word: 'comfortable', ipa: '/ˈkʌmftəbl/', meaning: 'thoải mái', partOfSpeech: 'Adjective', cefrLevel: 'A2', topic: 'Health & Lifestyle', exampleEn: 'This chair is really comfortable.', exampleVi: 'Chiếc ghế này thực sự rất thoải mái.' },
  { word: 'suggest', ipa: '/səˈdʒest/', meaning: 'gợi ý, đề xuất', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Daily Life & Greetings', exampleEn: 'I suggest we start early.', exampleVi: 'Tôi đề xuất chúng ta bắt đầu sớm.' },

  // ==================== B1 (TRUNG CẤP) ====================
  { word: 'opportunity', ipa: '/ˌɑːpərˈtuːnəti/', meaning: 'cơ hội', partOfSpeech: 'Noun', cefrLevel: 'B1', topic: 'Career & Growth', exampleEn: 'This job is a great opportunity for me.', exampleVi: 'Công việc này là một cơ hội tuyệt vời cho tôi.' },
  { word: 'confident', ipa: '/ˈkɑːnfɪdənt/', meaning: 'tự tin', partOfSpeech: 'Adjective', cefrLevel: 'B1', topic: 'Career & Growth', exampleEn: 'Practice helps you feel more confident.', exampleVi: 'Luyện tập giúp bạn cảm thấy tự tin hơn.' },
  { word: 'achieve', ipa: '/əˈtʃiːv/', meaning: 'đạt được', partOfSpeech: 'Verb', cefrLevel: 'B1', topic: 'Career & Growth', exampleEn: 'You can achieve your goal if you stay consistent.', exampleVi: 'Bạn có thể đạt được mục tiêu nếu kiên trì.' },
  { word: 'responsible', ipa: '/rɪˈspɑːnsəbl/', meaning: 'có trách nhiệm', partOfSpeech: 'Adjective', cefrLevel: 'B1', topic: 'Career & Growth', exampleEn: 'He is responsible for the new project.', exampleVi: 'Anh ấy chịu trách nhiệm cho dự án mới.' },
  { word: 'communicate', ipa: '/kəˈmjuːnɪkeɪt/', meaning: 'giao tiếp, truyền đạt', partOfSpeech: 'Verb', cefrLevel: 'B1', topic: 'Communication & Opinions', exampleEn: 'We communicate with clients in English.', exampleVi: 'Chúng tôi giao tiếp với khách hàng bằng tiếng Anh.' },
  { word: 'opinion', ipa: '/əˈpɪnjən/', meaning: 'ý kiến, quan điểm', partOfSpeech: 'Noun', cefrLevel: 'B1', topic: 'Communication & Opinions', exampleEn: 'In my opinion, daily practice matters most.', exampleVi: 'Theo quan điểm của tôi, luyện tập hàng ngày quan trọng nhất.' },
  { word: 'agree', ipa: '/əˈɡriː/', meaning: 'đồng ý', partOfSpeech: 'Verb', cefrLevel: 'B1', topic: 'Communication & Opinions', exampleEn: 'I completely agree with your idea.', exampleVi: 'Tôi hoàn toàn đồng ý với ý tưởng của bạn.' },
  { word: 'advantage', ipa: '/ədˈvæntɪdʒ/', meaning: 'lợi thế, ưu điểm', partOfSpeech: 'Noun', cefrLevel: 'B1', topic: 'Communication & Opinions', exampleEn: 'Knowing two languages is a big advantage.', exampleVi: 'Biết hai ngôn ngữ là một lợi thế lớn.' },
  { word: 'solution', ipa: '/səˈluːʃn/', meaning: 'giải pháp', partOfSpeech: 'Noun', cefrLevel: 'B1', topic: 'Technology & Society', exampleEn: 'We need to find a practical solution.', exampleVi: 'Chúng ta cần tìm một giải pháp thực tế.' },
  { word: 'environment', ipa: '/ɪnˈvaɪrənmənt/', meaning: 'môi trường', partOfSpeech: 'Noun', cefrLevel: 'B1', topic: 'Technology & Society', exampleEn: 'We should protect the environment.', exampleVi: 'Chúng ta nên bảo vệ môi trường.' },
  { word: 'develop', ipa: '/dɪˈveləp/', meaning: 'phát triển', partOfSpeech: 'Verb', cefrLevel: 'B1', topic: 'Technology & Society', exampleEn: 'Technology helps develop new skills.', exampleVi: 'Công nghệ giúp phát triển những kỹ năng mới.' },
  { word: 'encourage', ipa: '/ɪnˈkɜːrɪdʒ/', meaning: 'khuyến khích, động viên', partOfSpeech: 'Verb', cefrLevel: 'B1', topic: 'Communication & Opinions', exampleEn: 'My teacher always encourages us to speak.', exampleVi: 'Giáo viên luôn khuyến khích chúng tôi nói.' },

  // ==================== B2 (TRUNG CAO CẤP) ====================
  { word: 'efficient', ipa: '/ɪˈfɪʃnt/', meaning: 'hiệu quả, năng suất', partOfSpeech: 'Adjective', cefrLevel: 'B2', topic: 'Career & Productivity', exampleEn: 'An efficient study plan saves a lot of time.', exampleVi: 'Một kế hoạch học hiệu quả tiết kiệm rất nhiều thời gian.' },
  { word: 'significant', ipa: '/sɪɡˈnɪfɪkənt/', meaning: 'đáng kể, quan trọng', partOfSpeech: 'Adjective', cefrLevel: 'B2', topic: 'Career & Productivity', exampleEn: 'There has been a significant improvement in her writing.', exampleVi: 'Kỹ năng viết của cô ấy đã có sự tiến bộ đáng kể.' },
  { word: 'perspective', ipa: '/pərˈspektɪv/', meaning: 'góc nhìn, quan điểm', partOfSpeech: 'Noun', cefrLevel: 'B2', topic: 'Critical Thinking', exampleEn: 'Traveling gives you a fresh perspective on life.', exampleVi: 'Đi du lịch mang lại cho bạn góc nhìn mới mẻ về cuộc sống.' },
  { word: 'consequence', ipa: '/ˈkɑːnsɪkwəns/', meaning: 'hậu quả, kết quả', partOfSpeech: 'Noun', cefrLevel: 'B2', topic: 'Critical Thinking', exampleEn: 'Every decision has its own consequences.', exampleVi: 'Mỗi quyết định đều có hệ quả riêng.' },
  { word: 'adapt', ipa: '/əˈdæpt/', meaning: 'thích nghi', partOfSpeech: 'Verb', cefrLevel: 'B2', topic: 'Career & Productivity', exampleEn: 'It takes time to adapt to a new environment.', exampleVi: 'Cần thời gian để thích nghi với môi trường mới.' },
  { word: 'maintain', ipa: '/meɪnˈteɪn/', meaning: 'duy trì', partOfSpeech: 'Verb', cefrLevel: 'B2', topic: 'Career & Productivity', exampleEn: 'It is important to maintain a balanced lifestyle.', exampleVi: 'Việc duy trì lối sống cân bằng rất quan trọng.' },
  { word: 'crucial', ipa: '/ˈkruːʃl/', meaning: 'cốt yếu, cực kỳ quan trọng', partOfSpeech: 'Adjective', cefrLevel: 'B2', topic: 'Critical Thinking', exampleEn: 'Consistent review is crucial for long-term memory.', exampleVi: 'Ôn tập đều đặn là yếu tố cốt yếu cho trí nhớ dài hạn.' },
  { word: 'negotiate', ipa: '/nɪˈɡoʊʃieɪt/', meaning: 'đàm phán, thương lượng', partOfSpeech: 'Verb', cefrLevel: 'B2', topic: 'Career & Productivity', exampleEn: 'They will negotiate the contract next week.', exampleVi: 'Họ sẽ đàm phán hợp đồng vào tuần tới.' },
  { word: 'implement', ipa: '/ˈɪmplɪment/', meaning: 'triển khai, thực hiện', partOfSpeech: 'Verb', cefrLevel: 'B2', topic: 'Career & Productivity', exampleEn: 'We plan to implement the new system soon.', exampleVi: 'Chúng tôi dự định sớm triển khai hệ thống mới.' },
  { word: 'reliable', ipa: '/rɪˈlaɪəbl/', meaning: 'đáng tin cậy', partOfSpeech: 'Adjective', cefrLevel: 'B2', topic: 'Critical Thinking', exampleEn: 'She is the most reliable person on our team.', exampleVi: 'Cô ấy là người đáng tin cậy nhất trong nhóm chúng tôi.' },
];
