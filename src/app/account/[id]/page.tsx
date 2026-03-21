'use client';

import dynamic from 'next/dynamic';

const AccountHistoryContent = dynamic(
  () => import('@/components/AccountHistoryContent'),
  { ssr: false }
);

export default function AccountHistoryPage({ params }: { params: { id: string } }) {
  return <AccountHistoryContent accountId={Number(params.id)} />;
}
