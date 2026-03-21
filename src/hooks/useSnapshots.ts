'use client';

import { useCallback } from 'react';
import { db } from '@/db/database';

export function useSnapshots() {
  const bulkUpdate = useCallback(async (balances: { accountId: number; amount: number }[]) => {
    const now = new Date();
    const entries = balances
      .filter((b) => b.amount !== null && b.amount !== undefined)
      .map((b) => ({
        accountId: b.accountId,
        amount: b.amount,
        date: now,
      }));

    await db.snapshots.bulkAdd(entries);
  }, []);

  return { bulkUpdate };
}
