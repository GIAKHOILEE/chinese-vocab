import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.5-flash';
  }

  /**
   * Gửi prompt tới Google Gemini Cloud API và nhận phản hồi văn bản định dạng JSON
   * @param prompt Văn bản prompt gửi cho Gemini AI
   * @returns Phản hồi JSON văn bản từ model Gemini
   */
  async generateText(prompt: string): Promise<string> {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new BadRequestException(
        'Chưa cấu hình GEMINI_API_KEY trong file backend/.env. Vui lòng kiểm tra lại biến môi trường.',
      );
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey.trim()}`;

      const response = await axios.post(
        url,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: 'You are a Chinese language exercise generator. You MUST output your response strictly as a valid JSON object.',
              },
            ],
          },
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 180000,
        },
      );

      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
        return candidates[0].content.parts[0].text;
      }

      throw new InternalServerErrorException('Google Gemini API trả về phản hồi rỗng.');
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data?.error || {};
        const errorMsg =
          typeof errorData === 'object'
            ? errorData.message || JSON.stringify(errorData)
            : errorData;

        if (status === 429 || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          console.warn('Google Gemini API Rate limit:', errorMsg);
          throw new BadRequestException(
            'Hệ thống AI Gemini đang tạm thời bận (Rate Limit). Vui lòng đợi vài giây rồi thử lại.',
          );
        }

        console.error(`Lỗi Google Gemini API (${status}):`, errorMsg);
        throw new InternalServerErrorException(`Lỗi Google Gemini API: ${errorMsg}`);
      }

      console.error('Lỗi khi kết nối Google Gemini API:', error.message);
      throw new InternalServerErrorException('Không thể kết nối tới dịch vụ Google Gemini Cloud AI.');
    }
  }
}
