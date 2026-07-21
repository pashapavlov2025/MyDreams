'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, getLatestSnapshot } from '@/db/database';
import type { Account } from '@/db/models';
import { useCallback } from 'react';
import { useProfile } from './useProfile';

export interface AccountWithBalance extends Account {
  latestBalance: number;
  latestDate: Date | null;
}

export function useAccounts() {
  const { profileId } = useProfile();

  const accounts = useLiveQuery(
    () => db.accounts
      .where('profileId').equals(profileId)
      .filter((a) => !a.isArchived)
      .sortBy('sortOrder'),
    [profileId],
    []
  );

  const addAccount = useCallback(async (account: Omit<Account, 'id' | 'profileId' | 'createdAt' | 'sortOrder' | 'isArchived'>) => {
    const count = await db.accounts.where('profileId').equals(profileId).count();
    return db.accounts.add({
      ...account,
      profileId,
      sortOrder: count,
      isArchived: false,
      createdAt: new Date(),
    });
  }, [profileId]);

  const updateAccount = useCallback(async (id: number, data: Partial<Account>) => {
    return db.accounts.update(id, data);
  }, []);

  const archiveAccount = useCallback(async (id: number) => {
    return db.accounts.update(id, { isArchived: true });
  }, []);

  const unarchiveAccount = useCallback(async (id: number) => {
    return db.accounts.update(id, { isArchived: false });
  }, []);

  const deleteAccount = useCallback(async (id: number) => {
    await db.snapshots.where('accountId').equals(id).delete();
    await db.accounts.delete(id);
  }, []);

  return { accounts: accounts ?? [], addAccount, updateAccount, archiveAccount, unarchiveAccount, deleteAccount };
}

/** Архивные аккаунты с последним балансом — чтобы было видно, что возвращаешь. */
export function useArchivedAccounts() {
  const { profileId } = useProfile();

  const data = useLiveQuery(async () => {
    const accounts = await db.accounts
      .where('profileId').equals(profileId)
      .filter((a) => a.isArchived)
      .sortBy('sortOrder');

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
  }, [profileId], []);

  return data ?? [];
}

export function useAccountsWithBalances() {
  const { profileId } = useProfile();

  const data = useLiveQuery(async () => {
    const accounts = await db.accounts
      .where('profileId').equals(profileId)
      .filter((a) => !a.isArchived)
      .sortBy('sortOrder');
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
  }, [profileId], []);

  return data ?? [];
}

export function useAllAccounts() {
  const { profileId } = useProfile();

  const accounts = useLiveQuery(
    () => db.accounts.where('profileId').equals(profileId).toArray(),
    [profileId],
    []
  );
  return accounts ?? [];
}
