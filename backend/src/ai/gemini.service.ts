import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { geminiContextStorage } from './gemini-context';

@Injectable()
export class GeminiService {
  private readonly defaultModel = 'gemini-3-flash-preview';

  /**
   * Gửi prompt tới Google Gemini Cloud API sử dụng API Key của người dùng gửi qua header bảo mật
   */
  async generateText(
    prompt: string,
    options?: {
      apiKey?: string;
      model?: string;
      systemInstruction?: string;
      temperature?: number;
    },
  ): Promise<string> {
    const ctx = geminiContextStorage.getStore();
    const apiKey = (options?.apiKey || ctx?.apiKey || '').trim();

    if (!apiKey) {
      throw new BadRequestException(
        'Bạn chưa nhập Gemini API Key. Hãy dán key lấy từ Google AI Studio (aistudio.google.com) vào thanh công cụ phía trên để sử dụng tính năng AI.',
      );
    }

    if (apiKey.length < 20 || apiKey.length > 200 || /[\r\n\s]/.test(apiKey)) {
      throw new BadRequestException(
        'Định dạng Gemini API Key không hợp lệ. Vui lòng kiểm tra lại key lấy từ Google AI Studio.',
      );
    }

    const requestedModel = (options?.model || ctx?.model || this.defaultModel).trim();
    const candidateModels = Array.from(
      new Set([
        requestedModel,
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-flash-latest',
        'gemini-3.1-pro-preview',
      ]),
    );

    const systemText =
      options?.systemInstruction ||
      'You are a language learning exercise generator and tutor. You MUST output your response strictly as a valid JSON object.';
    const temperature = options?.temperature ?? 0.3;

    let lastError: any;

    for (const model of candidateModels) {
      try {
        const safeModel = encodeURIComponent(model);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent`;

        const response = await axios.post(
          url,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            systemInstruction: {
              parts: [{ text: systemText }],
            },
            generationConfig: {
              temperature,
              responseMimeType: 'application/json',
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            timeout: 60000,
          },
        );

        const candidates = response.data?.candidates;
        if (candidates && candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
          return candidates[0].content.parts[0].text;
        }

        throw new InternalServerErrorException('Google Gemini API trả về phản hồi rỗng.');
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        if (status === 404 || status === 503 || status === 429 || error.code === 'ECONNABORTED') {
          console.warn(`Model ${model} gặp lỗi (${status || error.code}), thử fallback...`);
          continue;
        }
        break;
      }
    }

    const error = lastError;
    if (error?.response) {
      const status = error.response.status;
      const errorData = error.response.data?.error || {};
      const errorMsg =
        typeof errorData === 'object'
          ? errorData.message || JSON.stringify(errorData)
          : errorData;

      if (
        status === 400 ||
        status === 401 ||
        status === 403 ||
        String(errorMsg).toUpperCase().includes('API_KEY_INVALID')
      ) {
        throw new BadRequestException(
          'Gemini API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại key lấy từ Google AI Studio (aistudio.google.com).',
        );
      }

      if (status === 429 || String(errorMsg).includes('RESOURCE_EXHAUSTED')) {
        console.warn('Google Gemini API Rate limit');
        throw new BadRequestException(
          'Gemini API Key của bạn đang tạm thời chạm giới hạn (Rate Limit). Vui lòng đợi vài giây rồi thử lại.',
        );
      }

      console.error(`Lỗi Google Gemini API (${status})`);
      throw new InternalServerErrorException(`Lỗi Google Gemini API (${status}). Vui lòng thử lại sau.`);
    }

    console.error('Lỗi khi kết nối Google Gemini API:', error?.code || 'NETWORK_ERROR');
    throw new InternalServerErrorException('Không thể kết nối tới dịch vụ Google Gemini Cloud AI.');
  }
}
