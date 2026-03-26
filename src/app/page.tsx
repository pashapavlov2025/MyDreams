'use client';

import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/LoadingScreen';

const DashboardContent = dynamic(() => import('@/components/DashboardContent'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Page() {
  return <DashboardContent />;
}
