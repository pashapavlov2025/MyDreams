'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import DreamProgress from '@/components/DreamProgress';
import AccountRow from '@/components/AccountRow';
import NetWorthChart from '@/components/NetWorthChart';
import AssetBreakdown from '@/components/AssetBreakdown';
import { useAccountsWithBalances, type AccountWithBalance } from '@/hooks/useAccounts';
import { useDream } from '@/hooks/useDream';
import { useSettings } from '@/hooks/useCurrency';
import { convertToBase } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { ACCOUNT_TYPE_LABELS, type AccountType } from '@/db/models';
import { db } from '@/db/database';

interface BankSubGroup {
  bankGroup: string;
  icon: string;
  accounts: AccountWithBalance[];
}

interface TypeGroup {
  type: AccountType;
  subGroups: BankSubGroup[];
}

export default function DashboardContent() {
  const accounts = useAccountsWithBalances();
  const { dream } = useDream();
  const { settings } = useSettings();
  const baseCurrency = settings?.baseCurrency ?? 'USD';

  // Get all snapshots to compute delta
  const allSnapshots = useLiveQuery(() => db.snapshots.toArray(), [], []);
  const allAccounts = useLiveQuery(() => db.accounts.filter((a) => !a.isArchived).toArray(), [], []);

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const val = convertToBase(acc.latestBalance, acc.currency, baseCurrency);
      return acc.type === 'debt' ? sum - Math.abs(val) : sum + val;
    }, 0);
  }, [accounts, baseCurrency]);

  // Compute delta: difference between latest and previous snapshot dates
  const delta = useMemo(() => {
    if (allSnapshots.length === 0 || allAccounts.length === 0) return null;

    const accountMap = new Map(allAccounts.filter((a) => a.id).map((a) => [a.id!, a]));

    // Group by date (day precision)
    const dateMap = new Map<string, Map<number, number>>();
    for (const snap of allSnapshots) {
      const dateKey = new Date(snap.date).toISOString().slice(0, 10);
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
      dateMap.get(dateKey)!.set(snap.accountId, snap.amount);
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    if (sortedDates.length < 2) return null;

    // Build net worth for the two latest dates
    const calcNetWorth = (upToDateIndex: number) => {
      const balances = new Map<number, number>();
      for (let i = 0; i <= upToDateIndex; i++) {
        const daySnaps = dateMap.get(sortedDates[i])!;
        daySnaps.forEach((amount, accId) => {
          balances.set(accId, amount);
        });
      }
      let nw = 0;
      balances.forEach((balance, accId) => {
        const acc = accountMap.get(accId);
        if (!acc) return;
        const converted = convertToBase(balance, acc.currency, baseCurrency);
        nw += acc.type === 'debt' ? -Math.abs(converted) : converted;
      });
      return nw;
    };

    const currentNW = calcNetWorth(sortedDates.length - 1);
    const prevNW = calcNetWorth(sortedDates.length - 2);
    return currentNW - prevNW;
  }, [allSnapshots, allAccounts, baseCurrency]);

  const groups = useMemo((): TypeGroup[] => {
    const typeMap = new Map<AccountType, AccountWithBalance[]>();
    for (const acc of accounts) {
      const arr = typeMap.get(acc.type) || [];
      arr.push(acc);
      typeMap.set(acc.type, arr);
    }

    return Array.from(typeMap.entries()).map(([type, accs]) => {
      const bankMap = new Map<string, AccountWithBalance[]>();
      for (const acc of accs) {
        const key = acc.bankGroup || '';
        const arr = bankMap.get(key) || [];
        arr.push(acc);
        bankMap.set(key, arr);
      }

      const subGroups: BankSubGroup[] = Array.from(bankMap.entries()).map(([bankGroup, bankAccs]) => ({
        bankGroup,
        icon: bankAccs[0].icon,
        accounts: bankAccs,
      }));

      return { type, subGroups };
    });
  }, [accounts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <h1 className="text-lg font-bold text-center text-gray-900">MyDreams</h1>
      </div>

      {dream && dream.targetAmount > 0 && (
        <DreamProgress
          currentNetWorth={netWorth}
          targetAmount={dream.targetAmount}
          currency={dream.currency || baseCurrency}
        />
      )}

      <div className="px-4 py-5 text-center">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net Worth</div>
        <div className="text-3xl font-bold text-gray-900">
          {formatMoney(netWorth, baseCurrency)}
        </div>
        {delta !== null && (
          <div className={`text-sm font-medium mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta >= 0 ? '+' : ''}{formatMoney(delta, baseCurrency)} с прошлого обновления
          </div>
        )}
      </div>

      <NetWorthChart baseCurrency={baseCurrency} />
      <AssetBreakdown accounts={accounts} baseCurrency={baseCurrency} />

      {groups.length > 0 ? (
        groups.map(({ type, subGroups }) => (
          <div key={type} className="mb-4">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {ACCOUNT_TYPE_LABELS[type]}
            </div>
            <div className="bg-white rounded-xl mx-4 overflow-hidden shadow-sm">
              {subGroups.map(({ bankGroup, icon, accounts: bankAccs }) => (
                <div key={bankGroup}>
                  {bankGroup && (
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                      <span className="flex-shrink-0">
                        {icon?.startsWith('data:') ? (
                          <img src={icon} alt="" className="w-5 h-5 rounded object-cover" />
                        ) : (
                          <span className="text-sm">{icon}</span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">{bankGroup}</span>
                    </div>
                  )}
                  {bankAccs.map((acc) => (
                    <AccountRow
                      key={acc.id}
                      account={acc}
                      baseCurrency={baseCurrency}
                      indented={!!bankGroup}
                    />
                  ))}
                </div>
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
