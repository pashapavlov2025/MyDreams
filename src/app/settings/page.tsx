'use client';

import dynamic from 'next/dynamic';

const SettingsContent = dynamic(() => import('@/components/SettingsContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Загрузка...</div>
    </div>
  ),
});

export default function Page() {
  return <SettingsContent />;
}
