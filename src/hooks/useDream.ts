'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { getDream, setDream } from '@/db/database';
import { useCallback } from 'react';
import type { Dream } from '@/db/models';
import { useProfile } from './useProfile';

export function useDream() {
  const { profileId } = useProfile();

  const dream = useLiveQuery(() => getDream(profileId), [profileId], undefined);

  const updateDream = useCallback(async (targetAmount: number, currency: string) => {
    await setDream(profileId, targetAmount, currency);
  }, [profileId]);

  return { dream: dream as Dream | undefined, updateDream };
}
