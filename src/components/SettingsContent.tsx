'use client';

import { useState } from 'react';
import { useDream } from '@/hooks/useDream';
import { useSettings } from '@/hooks/useCurrency';
import { useAccounts, useAllAccounts } from '@/hooks/useAccounts';
import AccountForm from '@/components/AccountForm';
import { formatMoney } from '@/lib/format';
import { getAvailableCurrencies } from '@/lib/currency';
import { ACCOUNT_TYPE_ICONS, type AccountType, type Account } from '@/db/models';

export default function SettingsContent() {
  const { dream, updateDream } = useDream();
  const { settings, updateBaseCurrency } = useSettings();
  const { addAccount, updateAccount, archiveAccount, deleteAccount } = useAccounts();
  const allAccounts = useAllAccounts();
  const currencies = getAvailableCurrencies();

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingDream, setEditingDream] = useState(false);
  const [dreamInput, setDreamInput] = useState('');
  const [dreamCurrency, setDreamCurrency] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const activeAccounts = allAccounts.filter((a) => !a.isArchived);
  const archivedAccounts = allAccounts.filter((a) => a.isArchived);

  const startEditDream = () => {
    setDreamInput(dream?.targetAmount?.toString() ?? '');
    setDreamCurrency(dream?.currency ?? settings?.baseCurrency ?? 'USD');
    setEditingDream(true);
  };

  const saveDream = async () => {
    const amount = Number(dreamInput);
    if (amount > 0) {
      await updateDream(amount, dreamCurrency);
    }
    setEditingDream(false);
  };

  const existingGroups = Array.from(new Set(allAccounts.map((a) => a.bankGroup).filter(Boolean))) as string[];

  if (showAccountForm || editingAccount) {
    return (
      <AccountForm
        initialData={editingAccount ? {
          name: editingAccount.name,
          type: editingAccount.type,
          currency: editingAccount.currency,
          icon: editingAccount.icon,
          bankGroup: editingAccount.bankGroup,
        } : undefined}
        existingGroups={existingGroups}
        onSave={async (data) => {
          if (editingAccount?.id) {
            await updateAccount(editingAccount.id, data);
            setEditingAccount(null);
          } else {
            await addAccount(data);
            setShowAccountForm(false);
          }
        }}
        onCancel={() => {
          setShowAccountForm(false);
          setEditingAccount(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <h1 className="text-lg font-bold text-center text-gray-900">Настройки</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Dream Section */}
        <section>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Мечта
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {editingDream ? (
              <div className="p-4 space-y-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={dreamInput}
                  onChange={(e) => setDreamInput(e.target.value)}
                  placeholder="1000000"
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-lg font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <select
                  value={dreamCurrency}
                  onChange={(e) => setDreamCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingDream(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={saveDream}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={startEditDream}
                className="w-full p-4 flex items-center text-left"
              >
                <span className="text-2xl mr-3">⭐</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {dream?.targetAmount
                      ? formatMoney(dream.targetAmount, dream.currency)
                      : 'Установить цель'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {dream?.targetAmount ? 'Нажмите чтобы изменить' : 'Какова ваша мечта?'}
                  </div>
                </div>
                <span className="text-gray-300">›</span>
              </button>
            )}
          </div>
        </section>

        {/* Base Currency */}
        <section>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Базовая валюта
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <select
              value={settings?.baseCurrency ?? 'USD'}
              onChange={(e) => updateBaseCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Accounts */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Аккаунты ({activeAccounts.length})
            </div>
            <button
              onClick={() => setShowAccountForm(true)}
              className="text-indigo-600 text-sm font-semibold"
            >
              + Добавить
            </button>
          </div>

          {activeAccounts.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {activeAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <button
                    onClick={() => setEditingAccount(acc)}
                    className="flex items-center flex-1 min-w-0 text-left"
                  >
                    <span className="text-xl mr-3 flex-shrink-0">
                      {acc.icon?.startsWith('data:') ? (
                        <img src={acc.icon} alt="" className="w-6 h-6 rounded-md object-cover" />
                      ) : (
                        acc.icon || ACCOUNT_TYPE_ICONS[acc.type as AccountType] || '📦'
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{acc.name}</div>
                      <div className="text-xs text-gray-400">
                        {acc.bankGroup ? `${acc.bankGroup} · ` : ''}{acc.currency}
                      </div>
                    </div>
                    <span className="text-gray-300 ml-2">›</span>
                  </button>
                  {confirmDelete === acc.id ? (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => {
                          if (acc.id) deleteAccount(acc.id);
                          setConfirmDelete(null);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg font-medium"
                      >
                        Удалить
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-lg font-medium"
                      >
                        Нет
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => acc.id && archiveAccount(acc.id)}
                        className="px-2 py-1 text-xs text-gray-400"
                        title="Архивировать"
                      >
                        📥
                      </button>
                      <button
                        onClick={() => setConfirmDelete(acc.id ?? null)}
                        className="px-2 py-1 text-xs text-gray-400"
                        title="Удалить"
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-gray-400 text-sm">Нет аккаунтов</p>
            </div>
          )}
        </section>

        {archivedAccounts.length > 0 && (
          <section>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
              Архив ({archivedAccounts.length})
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden opacity-60">
              {archivedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-xl mr-3 flex-shrink-0">
                    {acc.icon?.startsWith('data:') ? (
                      <img src={acc.icon} alt="" className="w-6 h-6 rounded-md object-cover" />
                    ) : (
                      acc.icon || ACCOUNT_TYPE_ICONS[acc.type as AccountType] || '📦'
                    )}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-500">{acc.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
