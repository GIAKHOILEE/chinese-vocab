import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { geminiContextStorage } from './gemini-context';

@Injectable()
export class GeminiContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const rawKey = req.headers['x-gemini-api-key'];
    const rawModel = req.headers['x-gemini-model'];

    const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const model = Array.isArray(rawModel) ? rawModel[0] : rawModel;

    geminiContextStorage.run(
      {
        apiKey: apiKey?.trim() || undefined,
        model: model?.trim() || undefined,
      },
      () => next(),
    );
  }
}
