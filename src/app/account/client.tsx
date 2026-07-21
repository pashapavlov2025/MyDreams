'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/LoadingScreen';

const AccountHistoryContent = dynamic(
  () => import('@/components/AccountHistoryContent'),
  { ssr: false }
);

function AccountHistoryInner() {
  const id = Number(useSearchParams().get('id'));
  if (!id) return null;
  return <AccountHistoryContent accountId={id} />;
}

export default function AccountHistoryClient() {
  // useSearchParams требует Suspense: страница пререндерится без параметров,
  // они приезжают только на клиенте
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AccountHistoryInner />
    </Suspense>
  );
}
