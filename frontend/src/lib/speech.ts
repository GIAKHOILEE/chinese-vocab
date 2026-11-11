// Tiện ích Web Speech API phát âm tiếng Trung chuẩn (zh-CN)

export interface SpeakOptions {
  rate?: number; // Tốc độ đọc: 0.5 - 2.0 (mặc định 0.85)
  pitch?: number; // Cao độ: 0.5 - 1.5 (mặc định 1.0)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

// Tải danh sách voice của trình duyệt
function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Tìm giọng đọc tiếng Trung phù hợp nhất từ hệ thống
 */
export function getBestChineseVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (voices.length === 0) return null;

  // Ưu tiên 1: zh-CN (tiếng Trung phổ thông đại lục)
  const zhCn = voices.find(
    (v) =>
      v.lang.toLowerCase() === 'zh-cn' ||
      v.lang.toLowerCase() === 'zh_cn' ||
      v.lang.toLowerCase().includes('cmn-hans-cn'),
  );
  if (zhCn) return zhCn;

  // Ưu tiên 2: Bất kỳ voice tiếng Trung nào (zh-*)
  const anyZh = voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
  if (anyZh) return anyZh;

  return null;
}

/**
 * Kiểm tra xem trình duyệt hiện tại có hỗ trợ Web Speech API không
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Đọc văn bản tiếng Trung bằng Web Speech API
 */
export function speakChinese(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSupported()) {
    console.warn('Trình duyệt không hỗ trợ Web Speech API.');
    options.onError?.('Trình duyệt không hỗ trợ phát âm');
    return;
  }

  // Dừng mọi âm thanh đang phát trước đó để tránh nói đè
  window.speechSynthesis.cancel();

  if (!text || !text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = 'zh-CN';
  utterance.rate = options.rate ?? 0.85; // 0.85x dễ nghe và chuẩn cho người học
  utterance.pitch = options.pitch ?? 1.0;

  const voice = getBestChineseVoice();
  if (voice) {
    utterance.voice = voice;
  }

  if (options.onStart) {
    utterance.onstart = () => {
      options.onStart?.();
    };
  }

  if (options.onEnd) {
    utterance.onend = () => {
      options.onEnd?.();
    };
  }

  utterance.onerror = (event) => {
    // Chrome phát sinh lỗi 'interrupted' hoặc 'canceled' khi gọi speechSynthesis.cancel(), bỏ qua lỗi này
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error('Lỗi khi phát âm SpeechSynthesis:', event);
      options.onError?.(event);
    }
    options.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Dừng phát âm ngay lập tức
 */
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
