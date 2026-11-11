import { Injectable } from '@nestjs/common';
import { pinyin } from 'pinyin-pro';

@Injectable()
export class PinyinService {
  /**
   * Chuyển đổi văn bản tiếng Trung sang Pinyin có dấu thanh điệu (Ví dụ: 我喜欢学习 -> Wǒ xǐhuan xuéxí)
   * @param text Văn bản tiếng Trung cần chuyển đổi
   * @returns Chuỗi Pinyin tương ứng
   */
  generatePinyin(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    try {
      // pinyin-pro chuyển đổi chữ Hán với lựa chọn mặc định tone marks
      const result = pinyin(text, {
        toneType: 'symbol', // Hiển thị dấu thanh điệu trên nguyên âm (xuéxí)
        type: 'string',     // Trả về dạng string ghép khoảng trắng giữa các từ
        nonZh: 'consecutive', // Giữ nguyên các ký tự không phải chữ Hán (dấu câu, số)
      });
      
      return result;
    } catch (error) {
      console.error('Lỗi khi sinh Pinyin cho text:', text, error);
      return text;
    }
  }
}
