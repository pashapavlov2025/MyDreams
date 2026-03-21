'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const AccountHistoryContent = dynamic(
  () => import('@/components/AccountHistoryContent'),
  { ssr: false }
);

export default function AccountHistoryClient() {
  const params = useParams();
  const id = Number(params.id);
  if (!id) return null;
  return <AccountHistoryContent accountId={id} />;
}
