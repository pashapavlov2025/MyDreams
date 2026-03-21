import type { Metadata, Viewport } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';

const TabBar = dynamic(() => import('@/components/TabBar'), { ssr: false });
const AppProvider = dynamic(() => import('@/components/AppProvider'), { ssr: false });

export const metadata: Metadata = {
  title: 'MyDreams',
  description: 'Путь к финансовой мечте',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ErrorBoundary>
          <AppProvider>
            <div className="min-h-screen pb-20">
              {children}
            </div>
            <TabBar />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
