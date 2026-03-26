'use client';

import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/LoadingScreen';

const UpdateContent = dynamic(() => import('@/components/UpdateContent'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Page() {
  return <UpdateContent />;
}
