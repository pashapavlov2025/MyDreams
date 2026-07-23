'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getAccountSnapshots } from '@/db/database';
import { formatMoney, formatDate } from '@/lib/format';
import { ACCOUNT_TYPE_ICONS } from '@/db/models';
import type { Account, AccountMetadata } from '@/db/models';
import { useTranslation, getDateLocale } from '@/i18n';
import { useProfile } from '@/hooks/useProfile';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface Props {
  accountId: number;
}

export default function AccountHistoryContent({ accountId }: Props) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);
  const { profileId } = useProfile();

  const account = useLiveQuery(
    async () => {
      const acc = await db.accounts.get(accountId);
      // Only show account if it belongs to current profile
      return acc && acc.profileId === profileId ? acc : undefined;
    },
    [accountId, profileId]
  );

  const snapshots = useLiveQuery(
    () => getAccountSnapshots(accountId),
    [accountId],
    []
  );

  const chartData = useMemo(() => {
    return snapshots.map((s) => ({
      date: new Date(s.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }),
      amount: s.amount,
    }));
  }, [snapshots, dateLocale]);

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  const icon = account.icon || ACCOUNT_TYPE_ICONS[account.type] || '📦';
  const isImageIcon = icon.startsWith('data:');
  const latestAmount = snapshots.length > 0 ? snapshots[snapshots.length - 1].amount : 0;
  const prevAmount = snapshots.length > 1 ? snapshots[snapshots.length - 2].amount : null;
  const delta = prevAmount !== null ? latestAmount - prevAmount : null;

  const reversedSnapshots = [...snapshots].reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="text-indigo-600 font-medium mr-3" aria-label={t('common.goBack')}>
            &#8592;
          </button>
          <div className="flex items-center gap-2 flex-1">
            {isImageIcon ? (
              <img src={icon} alt="" className="w-6 h-6 rounded-md object-cover" />
            ) : (
              <span className="text-xl">{icon}</span>
            )}
            <h1 className="text-lg font-bold text-gray-900 truncate">{account.name}</h1>
          </div>
          <span className="text-sm text-gray-400">{account.currency}</span>
        </div>
      </div>

      <div className="px-4 py-5 text-center">
        <div className="text-3xl font-bold text-gray-900">
          {formatMoney(latestAmount, account.currency)}
        </div>
        {delta !== null && (
          <div className={`text-sm font-medium mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta >= 0 ? '+' : ''}{formatMoney(delta, account.currency)}
          </div>
        )}
      </div>

      <AccountMetadataSection account={account} />

      {chartData.length >= 2 && (
        <div className="px-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  width={50}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                />
                <Tooltip
                  formatter={(value) => [formatMoney(Number(value), account.currency), t('accountHistory.balance')]}
                  labelStyle={{ color: '#6b7280' }}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="px-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          {t('accountHistory.history')} ({snapshots.length})
        </div>
        {snapshots.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {reversedSnapshots.map((snap, i) => {
              const prevSnap = i < reversedSnapshots.length - 1 ? reversedSnapshots[i + 1] : null;
              const d = prevSnap ? snap.amount - prevSnap.amount : null;
              return (
                <div key={snap.id} className="flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">{formatDate(snap.date, dateLocale)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatMoney(snap.amount, account.currency)}
                    </div>
                    {d !== null && (
                      <div className={`text-xs ${d >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {d >= 0 ? '+' : ''}{formatMoney(d, account.currency)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-400 text-sm">{t('accountHistory.noRecords')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountMetadataSection({ account }: { account: Account }) {
  const { t } = useTranslation();
  const meta = account.metadata;
  if (!meta) return null;

  const fields: { key: keyof AccountMetadata; label: string }[] = [
    { key: 'contractNumber', label: t('accountForm.contractNumber') },
    { key: 'managerName', label: t('accountForm.managerName') },
    { key: 'managerPhone', label: t('accountForm.managerPhone') },
    { key: 'managerEmail', label: t('accountForm.managerEmail') },
    { key: 'organizationAddress', label: t('accountForm.organizationAddress') },
    { key: 'accessMethod', label: t('accountForm.accessMethod') },
    { key: 'country', label: t('accountForm.country') },
    { key: 'documentsLocation', label: t('accountForm.documentsLocation') },
    { key: 'beneficiary', label: t('accountForm.beneficiary') },
    { key: 'notes', label: t('accountForm.notes') },
  ];

  const rows = fields.filter((f) => typeof meta[f.key] === 'string' && (meta[f.key] as string).trim());
  if (rows.length === 0) return null;

  return (
    <div className="px-4 mb-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('accountForm.metadataTitle')}
        </div>
        <div className="space-y-2">
          {rows.map(({ key, label }) => (
            <div key={key} className="text-sm">
              <span className="text-gray-400">{label}: </span>
              <span className="text-gray-900 whitespace-pre-wrap">{meta[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
