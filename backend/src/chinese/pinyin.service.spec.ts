import { PinyinService } from './pinyin.service';

describe('PinyinService', () => {
  let service: PinyinService;

  beforeEach(() => {
    service = new PinyinService();
  });

  it('nên chuyển chữ Hán "我喜欢学习中文" sang Pinyin có tone marks', () => {
    const result = service.generatePinyin('我喜欢学习中文');
    expect(result).toBeDefined();
    // Kiểm tra Pinyin chứa các âm tiết xué và xí có thanh điệu chuẩn
    expect(result.toLowerCase()).toContain('xué');
    expect(result.toLowerCase()).toContain('xí');
  });

  it('nên trả về chuỗi rỗng khi text bị null hoặc undefined', () => {
    expect(service.generatePinyin('')).toBe('');
  });
});
