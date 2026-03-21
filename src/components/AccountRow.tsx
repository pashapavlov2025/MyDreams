'use client';

import type { AccountWithBalance } from '@/hooks/useAccounts';
import { formatMoney, formatDateShort } from '@/lib/format';
import { convertToBase } from '@/lib/currency';
import { ACCOUNT_TYPE_ICONS } from '@/db/models';

interface AccountRowProps {
  account: AccountWithBalance;
  baseCurrency: string;
  indented?: boolean;
}

export default function AccountRow({ account, baseCurrency, indented }: AccountRowProps) {
  const icon = account.icon || ACCOUNT_TYPE_ICONS[account.type] || '📦';
  const baseAmount = convertToBase(account.latestBalance, account.currency, baseCurrency);
  const showConverted = account.currency !== baseCurrency;
  const isImageIcon = icon.startsWith('data:');

  return (
    <div className={`flex items-center py-3 bg-white border-b border-gray-100 last:border-b-0 ${
      indented ? 'pl-7 pr-4' : 'px-4'
    }`}>
      {!indented && (
        <div className="text-2xl mr-3 flex-shrink-0">
          {isImageIcon ? (
            <img src={icon} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            icon
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{account.name}</div>
        <div className="text-xs text-gray-400">
          {account.latestDate ? formatDateShort(account.latestDate) : 'Нет данных'}
        </div>
      </div>
      <div className="text-right ml-2">
        <div className="font-semibold text-gray-900">
          {formatMoney(account.latestBalance, account.currency)}
        </div>
        {showConverted && (
          <div className="text-xs text-gray-400">
            {formatMoney(baseAmount, baseCurrency)}
          </div>
        )}
      </div>
    </div>
  );
}
