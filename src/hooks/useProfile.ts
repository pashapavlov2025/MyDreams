'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureDefaultProfile, seedDemoProfile } from '@/db/database';
import type { Profile } from '@/db/models';

export const PROFILE_STORAGE_KEY = 'mydreams_active_profile';

interface ProfileContextType {
  profileId: number;
  profile: Profile | undefined;
  profiles: Profile[];
  switchProfile: (id: number) => void;
  createProfile: (name: string, icon: string) => Promise<number>;
  deleteProfile: (id: number) => Promise<void>;
  createDemoProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profileId: 1,
  profile: undefined,
  profiles: [],
  switchProfile: () => {},
  createProfile: async () => 0,
  deleteProfile: async () => {},
  createDemoProfile: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profileId, setProfileId] = useState<number>(1);
  const [ready, setReady] = useState(false);

  const profiles = useLiveQuery(() => db.profiles.toArray(), [], []);
  const profile = profiles.find((p) => p.id === profileId);

  useEffect(() => {
    ensureDefaultProfile().then((defaultId) => {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      const savedId = saved ? Number(saved) : defaultId;
      setProfileId(savedId);
      setReady(true);
    });
  }, []);

  // If saved profile was deleted, fall back to first available
  useEffect(() => {
    if (ready && profiles.length > 0 && !profiles.find((p) => p.id === profileId)) {
      const fallback = profiles[0].id!;
      setProfileId(fallback);
      localStorage.setItem(PROFILE_STORAGE_KEY, String(fallback));
    }
  }, [ready, profiles, profileId]);

  const switchProfile = useCallback((id: number) => {
    setProfileId(id);
    localStorage.setItem(PROFILE_STORAGE_KEY, String(id));
  }, []);

  const createProfile = useCallback(async (name: string, icon: string): Promise<number> => {
    const id = await db.profiles.add({
      name,
      icon,
      isDemo: false,
      createdAt: new Date(),
    });
    return id;
  }, []);

  const deleteProfile = useCallback(async (id: number) => {
    // Delete all data for this profile
    const accounts = await db.accounts.where('profileId').equals(id).toArray();
    const accountIds = accounts.map((a) => a.id!);
    for (const accId of accountIds) {
      await db.snapshots.where('accountId').equals(accId).delete();
    }
    await db.accounts.where('profileId').equals(id).delete();
    await db.dreams.where('profileId').equals(id).delete();
    await db.settings.where('profileId').equals(id).delete();
    await db.projects.where('profileId').equals(id).delete();
    await db.profiles.delete(id);
  }, []);

  const createDemoProfile = useCallback(async () => {
    const id = await seedDemoProfile();
    switchProfile(id);
  }, [switchProfile]);

  if (!ready) {
    return React.createElement('div', {
      className: 'min-h-screen bg-gray-50 flex items-center justify-center',
    }, React.createElement('div', {
      className: 'w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin',
    }));
  }

  return React.createElement(
    ProfileContext.Provider,
    { value: { profileId, profile, profiles, switchProfile, createProfile, deleteProfile, createDemoProfile } },
    children
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
