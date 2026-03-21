'use client';

import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, ensureSettings, db } from '@/db/database';
import { useCallback } from 'react';

export function useSettings() {
  // Ensure default settings exist (write operation, outside liveQuery)
  useEffect(() => {
    ensureSettings();
  }, []);

  // Read-only liveQuery
  const settings = useLiveQuery(() => getSettings(), []);

  const updateBaseCurrency = useCallback(async (currency: string) => {
    const s = await getSettings();
    if (s?.id) {
      await db.settings.update(s.id, { baseCurrency: currency });
    }
  }, []);

  return { settings, updateBaseCurrency };
}
