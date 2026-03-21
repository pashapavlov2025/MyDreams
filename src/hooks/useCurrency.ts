'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, ensureSettings, db } from '@/db/database';
import { useCallback } from 'react';
import { loadCachedRates, updateAndCacheRates } from '@/lib/currency';

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

export function useCurrencyRates() {
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Load cached rates on mount
    loadCachedRates().then(() => {
      // Check if rates are stale (> 4 hours old)
      db.settings.toCollection().first().then((s) => {
        const lastRatesUpdate = s?.lastRatesUpdate;
        if (lastRatesUpdate) setLastUpdate(new Date(lastRatesUpdate));

        const staleMs = 4 * 60 * 60 * 1000;
        const isStale = !lastRatesUpdate || (Date.now() - new Date(lastRatesUpdate).getTime() > staleMs);
        if (isStale) {
          refreshRates();
        }
      });
    });
  }, []);

  const refreshRates = async () => {
    setLoading(true);
    try {
      await updateAndCacheRates();
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  return { loading, lastUpdate, refreshRates };
}
