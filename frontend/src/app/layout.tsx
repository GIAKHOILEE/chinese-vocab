import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import { AuthProvider } from '@/components/AuthProvider';
import { GeminiProvider } from '@/components/GeminiProvider';
import { SlowServerBanner } from '@/components/LoadingPrimitives';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chinese & English Studio - Lộ trình HSK 1→3 & CEFR A1→B2',
  description: 'Ứng dụng học từ vựng, ngữ pháp và luyện viết đa người dùng với AI Google Gemini',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="text-cocoa-800 flex flex-col min-h-screen selection:bg-peach-200/70 selection:text-cocoa-900">
        <AuthProvider>
          <GeminiProvider>
            <Navigation />
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
              {children}
            </main>
            <SlowServerBanner />
          </GeminiProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
