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
      <body className="bg-slate-50 text-slate-900 flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
