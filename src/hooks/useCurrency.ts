'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, db } from '@/db/database';
import { useCallback } from 'react';

export function useSettings() {
  const settings = useLiveQuery(() => getSettings(), []);

  const updateBaseCurrency = useCallback(async (currency: string) => {
    const s = await getSettings();
    if (s.id) {
      await db.settings.update(s.id, { baseCurrency: currency });
    }
  }, []);

  return { settings, updateBaseCurrency };
}
