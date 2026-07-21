'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { formatMoney, formatDate } from '@/lib/format';
import { buildNetWorthSeries } from '@/lib/netWorth';
import { useTranslation, getDateLocale } from '@/i18n';
import { useProfile } from '@/hooks/useProfile';
import { useSettings } from '@/hooks/useCurrency';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function PortfolioHistoryContent() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);
  const { profileId } = useProfile();
  const { settings } = useSettings();
  const baseCurrency = settings?.baseCurrency ?? 'USD';

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

  // Тот же ряд, что и под графиком на дашборде: сумма трендов всех счетов
  // (плюс проекты), ровно как история одного счёта, только по всему капиталу.
  const series = useMemo(() => {
    return buildNetWorthSeries({
      accounts,
      snapshots: allSnapshots,
      projects,
      transactions: projectData.transactions,
      valuations: projectData.valuations,
      baseCurrency,
    });
  }, [accounts, allSnapshots, projects, projectData, baseCurrency]);

  const chartData = useMemo(() => {
    return series.map((p) => ({
      date: new Date(p.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }),
      amount: Math.round(p.netWorth),
    }));
  }, [series, dateLocale]);

  const latestAmount = series.length > 0 ? series[series.length - 1].netWorth : 0;
  const prevAmount = series.length > 1 ? series[series.length - 2].netWorth : null;
  const delta = prevAmount !== null ? latestAmount - prevAmount : null;

  const reversedSeries = [...series].reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="text-indigo-600 font-medium mr-3" aria-label={t('common.goBack')}>
            &#8592;
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{t('dashboard.netWorth')}</h1>
          <span className="text-sm text-gray-400">{baseCurrency}</span>
        </div>
      </div>

      <div className="px-4 py-5 text-center">
        <div className="text-3xl font-bold text-gray-900">
          {formatMoney(latestAmount, baseCurrency)}
        </div>
        {delta !== null && (
          <div className={`text-sm font-medium mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta >= 0 ? '+' : ''}{formatMoney(delta, baseCurrency)} {t('dashboard.sinceLastUpdate')}
          </div>
        )}
      </div>

      {chartData.length >= 2 && (
        <div className="px-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                />
                <Tooltip
                  formatter={(value) => [formatMoney(Number(value), baseCurrency), t('charts.netWorth')]}
                  labelStyle={{ color: '#6b7280' }}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorPortfolio)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="px-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          {t('accountHistory.history')} ({series.length})
        </div>
        {series.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {reversedSeries.map((point, i) => {
              const prevPoint = i < reversedSeries.length - 1 ? reversedSeries[i + 1] : null;
              const d = prevPoint ? point.netWorth - prevPoint.netWorth : null;
              return (
                <div key={point.date} className="flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">{formatDate(new Date(point.date), dateLocale)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatMoney(point.netWorth, baseCurrency)}
                    </div>
                    {d !== null && (
                      <div className={`text-xs ${d >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {d >= 0 ? '+' : ''}{formatMoney(d, baseCurrency)}
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
