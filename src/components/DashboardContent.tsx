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
import { buildNetWorthSeries } from '@/lib/netWorth';
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
      return sum + convertToBase(p.currentValue, p.currency, baseCurrency);
    }, 0);
  }, [projectsWithPnL, baseCurrency]);

  const netWorth = useMemo(() => {
    const accountsTotal = accounts.reduce((sum, acc) => {
      const val = convertToBase(acc.latestBalance, acc.currency, baseCurrency);
      return acc.type === 'debt' ? sum - Math.abs(val) : sum + val;
    }, 0);
    return accountsTotal + projectsValue;
  }, [accounts, baseCurrency, projectsValue]);

  const projectData = useLiveQuery(async () => {
    const ids = (await db.projects.where('profileId').equals(profileId).toArray()).map((p) => p.id!);
    if (ids.length === 0) return { transactions: [], valuations: [] };
    return {
      transactions: await db.projectTransactions.where('projectId').anyOf(ids).toArray(),
      valuations: await db.projectValuations.where('projectId').anyOf(ids).toArray(),
    };
  }, [profileId], { transactions: [], valuations: [] });

  // Тот же ряд, что и под графиком: дельта обязана считаться по тем же
  // правилам, иначе число над графиком не совпадёт с его последним шагом
  const delta = useMemo(() => {
    const series = buildNetWorthSeries({
      accounts: allAccounts,
      snapshots: allSnapshots,
      projects: projectsWithPnL,
      transactions: projectData.transactions,
      valuations: projectData.valuations,
      baseCurrency,
    });
    if (series.length < 2) return null;
    return series[series.length - 1].netWorth - series[series.length - 2].netWorth;
  }, [allSnapshots, allAccounts, projectsWithPnL, projectData, baseCurrency]);

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

      <button
        onClick={() => router.push('/portfolio')}
        className="w-full px-4 py-5 text-center active:bg-gray-100 transition-colors"
      >
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
          {t('dashboard.netWorth')}
          <span className="text-gray-300">&#8250;</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {formatMoney(netWorth, baseCurrency)}
        </div>
        {delta !== null && (
          <div className={`text-sm font-medium mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta >= 0 ? '+' : ''}{formatMoney(delta, baseCurrency)} {t('dashboard.sinceLastUpdate')}
          </div>
        )}
      </button>

      <BackupReminder hasData={accounts.length > 0 || projectsWithPnL.length > 0} />

      <NetWorthChart baseCurrency={baseCurrency} />
      <AssetBreakdown accounts={accounts} projects={projectsWithPnL} baseCurrency={baseCurrency} />

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
              const valueInBase = convertToBase(project.currentValue, project.currency, baseCurrency);
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
