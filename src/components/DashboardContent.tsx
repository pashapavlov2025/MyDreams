'use client';

import { useMemo } from 'react';
import DreamProgress from '@/components/DreamProgress';
import AccountRow from '@/components/AccountRow';
import { useAccountsWithBalances, type AccountWithBalance } from '@/hooks/useAccounts';
import { useDream } from '@/hooks/useDream';
import { useSettings } from '@/hooks/useCurrency';
import { convertToBase } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { ACCOUNT_TYPE_LABELS, type AccountType } from '@/db/models';

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

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const val = convertToBase(acc.latestBalance, acc.currency, baseCurrency);
      return acc.type === 'debt' ? sum - Math.abs(val) : sum + val;
    }, 0);
  }, [accounts, baseCurrency]);

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
      </div>

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
