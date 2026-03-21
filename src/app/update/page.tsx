'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccountsWithBalances } from '@/hooks/useAccounts';
import { useSnapshots } from '@/hooks/useSnapshots';
import { formatMoney } from '@/lib/format';
import { ACCOUNT_TYPE_ICONS } from '@/db/models';

export default function UpdatePage() {
  const accounts = useAccountsWithBalances();
  const { bulkUpdate } = useSnapshots();
  const router = useRouter();

  const [balances, setBalances] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  // Pre-fill with latest balances
  useEffect(() => {
    const initial: Record<number, string> = {};
    for (const acc of accounts) {
      if (acc.id && !balances[acc.id]) {
        initial[acc.id] = acc.latestBalance ? String(acc.latestBalance) : '';
      }
    }
    if (Object.keys(initial).length > 0) {
      setBalances((prev) => ({ ...initial, ...prev }));
    }
  }, [accounts]);

  const handleSave = async () => {
    setSaving(true);
    const entries = Object.entries(balances)
      .filter(([, v]) => v !== '' && !isNaN(Number(v)))
      .map(([id, v]) => ({
        accountId: Number(id),
        amount: Number(v),
      }));

    if (entries.length > 0) {
      await bulkUpdate(entries);
    }
    setSaving(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <h1 className="text-lg font-bold text-center text-gray-900">Обновить балансы</h1>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500">Нет аккаунтов для обновления</p>
          <p className="text-gray-400 text-sm mt-1">Добавьте аккаунты в Настройках</p>
        </div>
      ) : (
        <>
          <div className="p-4 space-y-3">
            {accounts.map((acc) => {
              const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '📦';
              return (
                <div key={acc.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">{icon}</span>
                    <span className="font-medium text-gray-900">{acc.name}</span>
                    <span className="ml-auto text-xs text-gray-400">{acc.currency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={balances[acc.id!] ?? ''}
                      onChange={(e) =>
                        setBalances((prev) => ({ ...prev, [acc.id!]: e.target.value }))
                      }
                      placeholder="0"
                      className="flex-1 px-3 py-2.5 bg-gray-100 rounded-xl text-gray-900 text-lg font-medium placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {acc.latestBalance > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      Было: {formatMoney(acc.latestBalance, acc.currency)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 pb-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 active:bg-indigo-700 transition-colors"
            >
              {saving ? 'Сохраняю...' : 'Сохранить'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
