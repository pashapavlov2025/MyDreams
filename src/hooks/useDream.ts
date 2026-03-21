'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { getDream, setDream } from '@/db/database';
import { useCallback } from 'react';
import type { Dream } from '@/db/models';

export function useDream() {
  const dream = useLiveQuery(() => getDream(), [], undefined);

  const updateDream = useCallback(async (targetAmount: number, currency: string) => {
    await setDream(targetAmount, currency);
  }, []);

  return { dream: dream as Dream | undefined, updateDream };
}
