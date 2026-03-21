import AccountHistoryClient from './client';

export async function generateStaticParams() {
  return [{ id: '0' }];
}

export default function AccountHistoryPage() {
  return <AccountHistoryClient />;
}
