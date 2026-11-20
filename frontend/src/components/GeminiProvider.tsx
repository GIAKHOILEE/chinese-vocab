'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { setRuntimeGeminiKey, setRuntimeGeminiModel } from '@/lib/api';

export const GEMINI_MODELS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview (Nhanh & Chuẩn)' },
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (Siêu nhanh)' },
  { value: 'gemini-flash-latest', label: 'Gemini Flash Latest' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview (Chấm sâu)' },
];

interface GeminiContextValue {
  apiKey: string;
  model: string;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  clearApiKey: () => void;
}

const GeminiContext = createContext<GeminiContextValue | null>(null);

export function GeminiProvider({ children }: { children: React.ReactNode }) {
  // Luôn khởi tạo rỗng mỗi lần vào web / reload trang (không lưu localStorage hay DB)
  const [apiKey, setApiKeyState] = useState('');
  const [model, setModelState] = useState('gemini-3-flash-preview');

  const setApiKey = useCallback((nextKey: string) => {
    setApiKeyState(nextKey);
    setRuntimeGeminiKey(nextKey);
  }, []);

  const setModel = useCallback((nextModel: string) => {
    const clean = nextModel || 'gemini-3-flash-preview';
    setModelState(clean);
    setRuntimeGeminiModel(clean);
  }, []);

  const clearApiKey = useCallback(() => {
    setApiKeyState('');
    setRuntimeGeminiKey('');
  }, []);

  return (
    <GeminiContext.Provider value={{ apiKey, model, setApiKey, setModel, clearApiKey }}>
      {children}
    </GeminiContext.Provider>
  );
}

export function useGeminiConfig() {
  const ctx = useContext(GeminiContext);
  if (!ctx) throw new Error('useGeminiConfig must be used inside GeminiProvider');
  return ctx;
}
