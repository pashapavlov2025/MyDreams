'use client';

import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/LoadingScreen';

const PortfolioHistoryContent = dynamic(
  () => import('@/components/PortfolioHistoryContent'),
  { ssr: false, loading: () => <LoadingScreen /> }
);

export default function PortfolioHistoryClient() {
  return <PortfolioHistoryContent />;
}
