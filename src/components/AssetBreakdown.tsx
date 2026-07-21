'use client';

import { useMemo } from 'react';
import type { AccountWithBalance } from '@/hooks/useAccounts';
import type { ProjectWithPnL } from '@/hooks/useProjects';
import { convertToBase } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { ACCOUNT_TYPE_KEYS, type AccountType } from '@/db/models';
import { useTranslation, type TranslationKey } from '@/i18n';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  accounts: AccountWithBalance[];
  projects?: ProjectWithPnL[];
  baseCurrency: string;
}

const COLORS: Record<string, string> = {
  bank: '#6366f1',
  cash: '#10b981',
  broker: '#f59e0b',
  crypto: '#f97316',
  realestate: '#8b5cf6',
  debt: '#ef4444',
  other: '#6b7280',
  projects: '#8b5cf6',
};

export default function AssetBreakdown({ accounts, projects = [], baseCurrency }: Props) {
  const { t } = useTranslation();

  const { data, assets, debts } = useMemo(() => {
    const typeMap = new Map<string, number>();
    let debtTotal = 0;

    for (const acc of accounts) {
      const val = convertToBase(acc.latestBalance, acc.currency, baseCurrency);
      if (acc.type === 'debt') {
        debtTotal += Math.abs(val);
      } else {
        typeMap.set(acc.type, (typeMap.get(acc.type) ?? 0) + val);
      }
    }

    // Проекты — отдельная доля. Раньше их в диаграмме не было вовсе, хотя
    // в капитал они входили, и структура не сходилась с итогом.
    const projectsTotal = projects.reduce(
      (sum, p) => sum + convertToBase(p.currentValue, p.currency, baseCurrency),
      0
    );
    if (projectsTotal > 0) typeMap.set('projects', projectsTotal);

    const rows = Array.from(typeMap.entries())
      .filter(([, value]) => value > 0)
      .map(([type, value]) => ({
        name: type === 'projects'
          ? t('projects.title')
          : t(ACCOUNT_TYPE_KEYS[type as AccountType] as TranslationKey),
        value: Math.round(value),
        type,
        color: COLORS[type] ?? COLORS.other,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      data: rows,
      assets: rows.reduce((s, d) => s + d.value, 0),
      debts: debtTotal,
    };
  }, [accounts, projects, baseCurrency, t]);

  if (data.length === 0) return null;

  return (
    <div className="px-4 mb-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {t('charts.assetBreakdown')}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d) => (
              <div key={d.type} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-gray-600 flex-1">{d.name}</span>
                <span className="text-sm font-medium text-gray-900">
                  {assets > 0 ? `${((d.value / assets) * 100).toFixed(0)}%` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Долги в круг не кладём — отрицательная доля в пироге бессмысленна.
            Но показать их надо, иначе диаграмма не сходится с капиталом. */}
        {debts > 0 && (
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('charts.totalAssets')}</span>
              <span className="font-medium text-gray-900">{formatMoney(assets, baseCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('accountType.debt')}</span>
              <span className="font-medium text-red-500">−{formatMoney(debts, baseCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
              <span className="text-gray-500">{t('dashboard.netWorth')}</span>
              <span className="font-semibold text-gray-900">
                {formatMoney(assets - debts, baseCurrency)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
