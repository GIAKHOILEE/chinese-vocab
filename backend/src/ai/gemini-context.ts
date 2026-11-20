import { AsyncLocalStorage } from 'async_hooks';

export interface GeminiRequestContext {
  apiKey?: string;
  model?: string;
}

export const geminiContextStorage = new AsyncLocalStorage<GeminiRequestContext>();
