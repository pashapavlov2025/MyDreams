'use client';

import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/LoadingScreen';

const SettingsContent = dynamic(() => import('@/components/SettingsContent'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Page() {
  return <SettingsContent />;
}
