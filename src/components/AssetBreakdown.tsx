'use client';

import { useMemo } from 'react';
import type { AccountWithBalance } from '@/hooks/useAccounts';
import { convertToBase } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { ACCOUNT_TYPE_LABELS, type AccountType } from '@/db/models';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  accounts: AccountWithBalance[];
  baseCurrency: string;
}

const COLORS: Record<AccountType, string> = {
  bank: '#6366f1',
  cash: '#10b981',
  broker: '#f59e0b',
  crypto: '#f97316',
  realestate: '#8b5cf6',
  debt: '#ef4444',
  other: '#6b7280',
};

export default function AssetBreakdown({ accounts, baseCurrency }: Props) {
  const data = useMemo(() => {
    const typeMap = new Map<AccountType, number>();
    for (const acc of accounts) {
      const val = convertToBase(acc.latestBalance, acc.currency, baseCurrency);
      const amount = acc.type === 'debt' ? -Math.abs(val) : val;
      typeMap.set(acc.type, (typeMap.get(acc.type) || 0) + amount);
    }

    return Array.from(typeMap.entries())
      .filter(([, value]) => value > 0) // Only positive for pie
      .map(([type, value]) => ({
        name: ACCOUNT_TYPE_LABELS[type],
        value: Math.round(value),
        type,
        color: COLORS[type],
      }))
      .sort((a, b) => b.value - a.value);
  }, [accounts, baseCurrency]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return null;

  return (
    <div className="px-4 mb-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        Структура активов
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
                  {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
