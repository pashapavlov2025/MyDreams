'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { formatMoney } from '@/lib/format';
import { buildNetWorthSeries } from '@/lib/netWorth';
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

  const projects = useLiveQuery(
    () => db.projects.where('profileId').equals(profileId).toArray(),
    [profileId],
    []
  );
  const projectData = useLiveQuery(async () => {
    const ids = (await db.projects.where('profileId').equals(profileId).toArray()).map((p) => p.id!);
    if (ids.length === 0) return { transactions: [], valuations: [] };
    return {
      transactions: await db.projectTransactions.where('projectId').anyOf(ids).toArray(),
      valuations: await db.projectValuations.where('projectId').anyOf(ids).toArray(),
    };
  }, [profileId], { transactions: [], valuations: [] });

  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);

  const chartData = useMemo(() => {
    return buildNetWorthSeries({
      accounts,
      snapshots: allSnapshots,
      projects,
      transactions: projectData.transactions,
      valuations: projectData.valuations,
      baseCurrency,
    }).map((p) => ({
      ...p,
      netWorth: Math.round(p.netWorth),
      label: new Date(p.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }),
    }));
  }, [allSnapshots, accounts, projects, projectData, baseCurrency, dateLocale]);

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
