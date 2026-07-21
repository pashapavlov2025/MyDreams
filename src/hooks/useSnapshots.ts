'use client';

import { useCallback } from 'react';
import { saveBalances, dedupeSnapshots } from '@/lib/snapshots';

export function useSnapshots() {
  const bulkUpdate = useCallback(
    (balances: { accountId: number; amount: number }[]) => saveBalances(balances),
    []
  );

  return { bulkUpdate, dedupeSnapshots };
}
