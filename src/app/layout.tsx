import type { Metadata, Viewport } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';

const TabBar = dynamic(() => import('@/components/TabBar'), { ssr: false });
const AppProvider = dynamic(() => import('@/components/AppProvider'), { ssr: false });

export const metadata: Metadata = {
  title: 'MyDreams',
  description: 'Personal finance tracker',
  manifest: '/manifest.json',
  // apple-touch-icon нужен явно: iOS не читает icons из manifest при
  // добавлении на домашний экран
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'MyDreams',
    statusBarStyle: 'default',
  },
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
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ErrorBoundary>
          <AppProvider>
            <main className="min-h-screen pb-20">
              {children}
            </main>
            <TabBar />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
