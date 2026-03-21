'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, getLatestSnapshot } from '@/db/database';
import type { Account, BalanceSnapshot } from '@/db/models';
import { useCallback } from 'react';

export interface AccountWithBalance extends Account {
  latestBalance: number;
  latestDate: Date | null;
}

export function useAccounts() {
  const accounts = useLiveQuery(
    () => db.accounts.where('isArchived').equals(0).sortBy('sortOrder'),
    [],
    []
  );

  const addAccount = useCallback(async (account: Omit<Account, 'id' | 'createdAt' | 'sortOrder' | 'isArchived'>) => {
    const count = await db.accounts.count();
    return db.accounts.add({
      ...account,
      sortOrder: count,
      isArchived: false,
      createdAt: new Date(),
    });
  }, []);

  const updateAccount = useCallback(async (id: number, data: Partial<Account>) => {
    return db.accounts.update(id, data);
  }, []);

  const archiveAccount = useCallback(async (id: number) => {
    return db.accounts.update(id, { isArchived: true });
  }, []);

  const deleteAccount = useCallback(async (id: number) => {
    await db.snapshots.where('accountId').equals(id).delete();
    await db.accounts.delete(id);
  }, []);

  return { accounts: accounts ?? [], addAccount, updateAccount, archiveAccount, deleteAccount };
}

export function useAccountsWithBalances() {
  const data = useLiveQuery(async () => {
    const accounts = await db.accounts.where('isArchived').equals(0).sortBy('sortOrder');
    const result: AccountWithBalance[] = [];

    for (const account of accounts) {
      const snap = await getLatestSnapshot(account.id!);
      result.push({
        ...account,
        latestBalance: snap?.amount ?? 0,
        latestDate: snap?.date ?? null,
      });
    }
    return result;
  }, [], []);

  return data ?? [];
}

export function useAllAccounts() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);
  return accounts ?? [];
}
