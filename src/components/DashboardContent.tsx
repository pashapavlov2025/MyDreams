'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import DreamProgress from '@/components/DreamProgress';
import AccountRow from '@/components/AccountRow';
import NetWorthChart from '@/components/NetWorthChart';
import AssetBreakdown from '@/components/AssetBreakdown';
import BackupReminder from '@/components/BackupReminder';
import { useAccountsWithBalances, type AccountWithBalance } from '@/hooks/useAccounts';
import { useProjectsWithPnL } from '@/hooks/useProjects';
import { useDream } from '@/hooks/useDream';
import { useSettings } from '@/hooks/useCurrency';
import { convertToBase } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { ACCOUNT_TYPE_KEYS, type AccountType } from '@/db/models';
import { db } from '@/db/database';
import { useTranslation, type TranslationKey } from '@/i18n';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';

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
  const projectsWithPnL = useProjectsWithPnL();
  const { dream } = useDream();
  const { settings } = useSettings();
  const baseCurrency = settings?.baseCurrency ?? 'USD';
  const { t } = useTranslation();
  const { profileId, profile, profiles, switchProfile } = useProfile();
  const router = useRouter();

  const allSnapshots = useLiveQuery(async () => {
    const accs = await db.accounts.where('profileId').equals(profileId).toArray();
    const ids = accs.map((a) => a.id!);
    if (ids.length === 0) return [];
    return db.snapshots.where('accountId').anyOf(ids).toArray();
  }, [profileId], []);

  const allAccounts = useLiveQuery(
    () => db.accounts.where('profileId').equals(profileId).filter((a) => !a.isArchived).toArray(),
    [profileId],
    []
  );

  const projectsValue = useMemo(() => {
    return projectsWithPnL.reduce((sum, p) => {
      return sum + convertToBase(p.currentMarketValue, p.currency, baseCurrency);
    }, 0);
  }, [projectsWithPnL, baseCurrency]);

  const netWorth = useMemo(() => {
    const accountsTotal = accounts.reduce((sum, acc) => {
      const val = convertToBase(acc.latestBalance, acc.currency, baseCurrency);
      return acc.type === 'debt' ? sum - Math.abs(val) : sum + val;
    }, 0);
    return accountsTotal + projectsValue;
  }, [accounts, baseCurrency, projectsValue]);

  const delta = useMemo(() => {
    if (allSnapshots.length === 0 || allAccounts.length === 0) return null;

    const accountMap = new Map(allAccounts.filter((a) => a.id).map((a) => [a.id!, a]));

    const dateMap = new Map<string, Map<number, number>>();
    for (const snap of allSnapshots) {
      const dateKey = new Date(snap.date).toISOString().slice(0, 10);
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
      dateMap.get(dateKey)!.set(snap.accountId, snap.amount);
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    if (sortedDates.length < 2) return null;

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
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">{t('dashboard.title')}</h1>
          {profiles.length > 1 && (
            <select
              value={profileId}
              onChange={(e) => switchProfile(Number(e.target.value))}
              className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2 py-1 font-medium border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id!}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {dream && dream.targetAmount > 0 && (
        <DreamProgress
          currentNetWorth={netWorth}
          targetAmount={convertToBase(dream.targetAmount, dream.currency || baseCurrency, baseCurrency)}
          currency={baseCurrency}
        />
      )}

      <div className="px-4 py-5 text-center">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('dashboard.netWorth')}</div>
        <div className="text-3xl font-bold text-gray-900">
          {formatMoney(netWorth, baseCurrency)}
        </div>
        {delta !== null && (
          <div className={`text-sm font-medium mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta >= 0 ? '+' : ''}{formatMoney(delta, baseCurrency)} {t('dashboard.sinceLastUpdate')}
          </div>
        )}
      </div>

      <BackupReminder hasData={accounts.length > 0 || projectsWithPnL.length > 0} />

      <NetWorthChart baseCurrency={baseCurrency} />
      <AssetBreakdown accounts={accounts} baseCurrency={baseCurrency} />

      {groups.length > 0 ? (
        groups.map(({ type, subGroups }) => (
          <div key={type} className="mb-4">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t(ACCOUNT_TYPE_KEYS[type] as TranslationKey)}
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
          <p className="text-gray-500 font-medium">{t('dashboard.addFirstAccount')}</p>
          <p className="text-gray-400 text-sm mt-1">
            {t('dashboard.goToSettings')}
          </p>
        </div>
      )}

      {projectsWithPnL.length > 0 && (
        <div className="mb-4">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {t('projects.title')}
          </div>
          <div className="bg-white rounded-xl mx-4 overflow-hidden shadow-sm">
            {projectsWithPnL.map((project) => {
              const valueInBase = convertToBase(project.currentMarketValue, project.currency, baseCurrency);
              return (
                <button
                  key={project.id}
                  onClick={() => router.push(`/project?id=${project.id}`)}
                  className="w-full flex items-center px-4 py-3 border-b border-gray-50 last:border-0 text-left"
                >
                  <span className="text-xl mr-3">{project.stage === 'building' ? '🏗️' : '🏠'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    <div className={`text-xs font-medium ${project.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      P&L: {project.pnl >= 0 ? '+' : ''}{formatMoney(project.pnl, project.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{formatMoney(valueInBase, baseCurrency)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
