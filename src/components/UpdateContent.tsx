'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccountsWithBalances } from '@/hooks/useAccounts';
import { useAccounts, useAllAccounts, useArchivedAccounts } from '@/hooks/useAccounts';
import { useSnapshots } from '@/hooks/useSnapshots';
import { formatMoney } from '@/lib/format';
import { ACCOUNT_TYPE_ICONS, type AccountType, type Account } from '@/db/models';
import AccountForm from '@/components/AccountForm';
import { useTranslation } from '@/i18n';

export default function UpdateContent() {
  const accountsWithBalances = useAccountsWithBalances();
  const { addAccount, updateAccount, archiveAccount, unarchiveAccount, deleteAccount } = useAccounts();
  const allAccounts = useAllAccounts();
  const { bulkUpdate } = useSnapshots();
  const router = useRouter();
  const { t } = useTranslation();

  const [balances, setBalances] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const archivedAccounts = useArchivedAccounts();

  useEffect(() => {
    const initial: Record<number, string> = {};
    for (const acc of accountsWithBalances) {
      if (acc.id && !balances[acc.id]) {
        initial[acc.id] = acc.latestBalance ? String(acc.latestBalance) : '';
      }
    }
    if (Object.keys(initial).length > 0) {
      setBalances((prev) => ({ ...initial, ...prev }));
    }
  }, [accountsWithBalances]);

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

  const existingGroups = Array.from(new Set(allAccounts.map((a) => a.bankGroup).filter(Boolean))) as string[];

  // Full-screen account form
  if (showAccountForm || editingAccount) {
    return (
      <AccountForm
        initialData={editingAccount ? {
          name: editingAccount.name,
          type: editingAccount.type,
          currency: editingAccount.currency,
          icon: editingAccount.icon,
          bankGroup: editingAccount.bankGroup,
          metadata: editingAccount.metadata,
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
      {/* Header with + button */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center justify-between">
          <div className="w-10" />
          <h1 className="text-lg font-bold text-gray-900">{t('update.title')}</h1>
          <button
            onClick={() => setShowAccountForm(true)}
            className="w-10 h-10 flex items-center justify-center text-indigo-600 text-2xl font-light"
            aria-label={t('common.addAccount')}
          >
            +
          </button>
        </div>
      </div>

      {accountsWithBalances.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500">{t('update.noAccounts')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('update.addFirst')}</p>
        </div>
      ) : (
        <>
          {/* Accounts: balance input + actions behind a menu */}
          <div className="px-4 pt-4 mb-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              {t('update.updateBalances')} ({accountsWithBalances.length})
            </div>
          </div>

          <div className="px-4 space-y-3">
            {accountsWithBalances.map((acc) => {
              const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '📦';
              const original = allAccounts.find((a) => a.id === acc.id);
              const isMenuOpen = menuOpen === acc.id;
              return (
                <div key={acc.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2 flex-shrink-0">
                      {icon.startsWith('data:') ? (
                        <img src={icon} alt="" className="w-6 h-6 rounded-md object-cover" />
                      ) : icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{acc.name}</div>
                      {acc.bankGroup && (
                        <div className="text-xs text-gray-400 truncate">{acc.bankGroup}</div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 mr-1">{acc.currency}</span>
                    {/* Редактирование, архив и удаление спрятаны за меню:
                        со списком в десяток счетов их слишком легко задеть */}
                    <button
                      onClick={() => {
                        setMenuOpen(isMenuOpen ? null : acc.id ?? null);
                        setConfirmDelete(null);
                        setConfirmArchive(null);
                      }}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-colors ${
                        isMenuOpen ? 'bg-gray-200 text-gray-700' : 'text-gray-300'
                      }`}
                      aria-label={t('update.accountActions')}
                      aria-expanded={isMenuOpen}
                    >
                      ⋯
                    </button>
                  </div>

                  <input
                    type="number"
                    inputMode="decimal"
                    value={balances[acc.id!] ?? ''}
                    onChange={(e) =>
                      setBalances((prev) => ({ ...prev, [acc.id!]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-gray-900 text-lg font-medium placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {acc.latestBalance !== 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {t('update.was')}: {formatMoney(acc.latestBalance, acc.currency)}
                    </div>
                  )}

                  {isMenuOpen && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {confirmArchive === acc.id ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <div className="text-sm text-amber-900">
                            {t('archive.hasBalance')}: {formatMoney(acc.latestBalance, acc.currency)}
                          </div>
                          <div className="text-xs text-amber-700 mt-0.5">{t('archive.hint')}</div>
                          <div className="flex gap-2 mt-2.5">
                            <button
                              onClick={() => {
                                if (acc.id) archiveAccount(acc.id);
                                setConfirmArchive(null);
                                setMenuOpen(null);
                              }}
                              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium"
                            >
                              {t('archive.confirm')}
                            </button>
                            <button
                              onClick={() => setConfirmArchive(null)}
                              className="px-3 py-1.5 text-amber-700 text-xs font-medium"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : confirmDelete === acc.id ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <div className="text-sm text-red-900">{t('update.deleteWarning')}</div>
                          <div className="flex gap-2 mt-2.5">
                            <button
                              onClick={() => {
                                if (acc.id) deleteAccount(acc.id);
                                setConfirmDelete(null);
                                setMenuOpen(null);
                              }}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium"
                            >
                              {t('common.delete')}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 text-red-600 text-xs font-medium"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { if (original) setEditingAccount(original); }}
                            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                          >
                            ✏️ {t('accountForm.edit')}
                          </button>
                          <button
                            onClick={() => {
                              if (!acc.id) return;
                              if (acc.latestBalance !== 0) setConfirmArchive(acc.id);
                              else { archiveAccount(acc.id); setMenuOpen(null); }
                            }}
                            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                          >
                            📥 {t('settings.archive')}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(acc.id ?? null)}
                            className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium"
                          >
                            🗑 {t('common.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 py-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 active:bg-indigo-700 transition-colors"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>

          {/* Archived accounts */}
          {archivedAccounts.length > 0 && (
            <div className="px-4 mb-6">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {t('settings.archive')} ({archivedAccounts.length})
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-500 truncate">{acc.name}</div>
                      <div className="text-xs text-gray-400">
                        {formatMoney(acc.latestBalance, acc.currency)}
                      </div>
                    </div>
                    <button
                      onClick={() => acc.id && unarchiveAccount(acc.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium ml-2 shrink-0"
                    >
                      {t('archive.restore')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
