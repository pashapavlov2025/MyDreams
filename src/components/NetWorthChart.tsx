'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { convertToBase } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import type { Account } from '@/db/models';
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
  baseCurrency: string;
}

export default function NetWorthChart({ baseCurrency }: Props) {
  const { profileId } = useProfile();
  const accounts = useLiveQuery(
    () => db.accounts.where('profileId').equals(profileId).filter((a) => !a.isArchived).toArray(),
    [profileId],
    []
  );
  const allSnapshots = useLiveQuery(async () => {
    const accs = await db.accounts.where('profileId').equals(profileId).toArray();
    const ids = accs.map((a) => a.id!);
    if (ids.length === 0) return [];
    return db.snapshots.where('accountId').anyOf(ids).toArray();
  }, [profileId], []);
  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);

  const chartData = useMemo(() => {
    if (allSnapshots.length === 0 || accounts.length === 0) return [];

    const accountMap = new Map<number, Account>();
    for (const a of accounts) {
      if (a.id) accountMap.set(a.id, a);
    }

    const dateMap = new Map<string, Map<number, number>>();
    for (const snap of allSnapshots) {
      const dateKey = new Date(snap.date).toISOString().slice(0, 10);
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
      dateMap.get(dateKey)!.set(snap.accountId, snap.amount);
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    const latestBalances = new Map<number, number>();
    const result: { date: string; label: string; netWorth: number }[] = [];

    for (let di = 0; di < sortedDates.length; di++) {
      const dateKey = sortedDates[di];
      const daySnaps = dateMap.get(dateKey)!;
      daySnaps.forEach((amount, accId) => {
        latestBalances.set(accId, amount);
      });

      let netWorth = 0;
      latestBalances.forEach((balance, accId) => {
        const acc = accountMap.get(accId);
        if (!acc) return;
        const converted = convertToBase(balance, acc.currency, baseCurrency);
        netWorth += acc.type === 'debt' ? -Math.abs(converted) : converted;
      });

      const d = new Date(dateKey);
      result.push({
        date: dateKey,
        label: d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }),
        netWorth: Math.round(netWorth),
      });
    }

    return result;
  }, [allSnapshots, accounts, baseCurrency, dateLocale]);

  if (chartData.length < 2) return null;

  return (
    <div className="px-4 mb-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {t('charts.netWorth')}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorNW" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              width={50}
              tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
            />
            <Tooltip
              formatter={(value) => [formatMoney(Number(value), baseCurrency), t('charts.netWorth')]}
              labelStyle={{ color: '#6b7280' }}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorNW)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
