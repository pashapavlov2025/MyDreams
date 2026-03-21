'use client';

import { useMemo } from 'react';
import DreamProgress from '@/components/DreamProgress';
import AccountRow from '@/components/AccountRow';
import { useAccountsWithBalances } from '@/hooks/useAccounts';
import { useDream } from '@/hooks/useDream';
import { useSettings } from '@/hooks/useCurrency';
import { convertToBase } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { ACCOUNT_TYPE_LABELS, type AccountType } from '@/db/models';

export default function Dashboard() {
  const accounts = useAccountsWithBalances();
  const { dream } = useDream();
  const { settings } = useSettings();
  const baseCurrency = settings?.baseCurrency ?? 'USD';

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const val = convertToBase(acc.latestBalance, acc.currency, baseCurrency);
      return acc.type === 'debt' ? sum - Math.abs(val) : sum + val;
    }, 0);
  }, [accounts, baseCurrency]);

  // Group accounts by type
  const groups = useMemo(() => {
    const map = new Map<AccountType, typeof accounts>();
    for (const acc of accounts) {
      const arr = map.get(acc.type) || [];
      arr.push(acc);
      map.set(acc.type, arr);
    }
    return Array.from(map.entries());
  }, [accounts]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <h1 className="text-lg font-bold text-center text-gray-900">MyDreams</h1>
      </div>

      {/* Dream progress */}
      {dream && dream.targetAmount > 0 && (
        <DreamProgress
          currentNetWorth={netWorth}
          targetAmount={dream.targetAmount}
          currency={dream.currency || baseCurrency}
        />
      )}

      {/* Net Worth */}
      <div className="px-4 py-5 text-center">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net Worth</div>
        <div className="text-3xl font-bold text-gray-900">
          {formatMoney(netWorth, baseCurrency)}
        </div>
      </div>

      {/* Accounts by group */}
      {groups.length > 0 ? (
        groups.map(([type, accs]) => (
          <div key={type} className="mb-4">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {ACCOUNT_TYPE_LABELS[type]}
            </div>
            <div className="bg-white rounded-xl mx-4 overflow-hidden shadow-sm">
              {accs.map((acc) => (
                <AccountRow key={acc.id} account={acc} baseCurrency={baseCurrency} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 px-4">
          <div className="text-5xl mb-4">✨</div>
          <p className="text-gray-500 font-medium">Добавьте первый аккаунт</p>
          <p className="text-gray-400 text-sm mt-1">
            Перейдите в Настройки → Аккаунты
          </p>
        </div>
      )}
    </div>
  );
}
