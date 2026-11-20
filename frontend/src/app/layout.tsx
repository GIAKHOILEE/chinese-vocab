import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chinese Writing Practice - Web App Học Viết Tiếng Trung Cá Nhân',
  description: 'Ứng dụng tạo bài tập luyện viết chữ Hán cá nhân với AI Google Gemini',
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
        <Navigation />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
