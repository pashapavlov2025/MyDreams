import Dexie, { type Table } from 'dexie';
import type {
  Account,
  BalanceSnapshot,
  CurrencyRate,
  InvestmentProject,
  ProjectTransaction,
  ProjectValuation,
  Dream,
  Settings,
  Profile,
} from './models';

class MyDreamsDB extends Dexie {
  accounts!: Table<Account, number>;
  snapshots!: Table<BalanceSnapshot, number>;
  currencyRates!: Table<CurrencyRate, number>;
  projects!: Table<InvestmentProject, number>;
  projectTransactions!: Table<ProjectTransaction, number>;
  projectValuations!: Table<ProjectValuation, number>;
  dreams!: Table<Dream, number>;
  settings!: Table<Settings, number>;
  profiles!: Table<Profile, number>;

  constructor() {
    super('MyDreamsDB');

    // V1: original schema
    this.version(1).stores({
      accounts: '++id, name, type, currency, isArchived, sortOrder',
      snapshots: '++id, accountId, date',
      currencyRates: '++id, [from+to], date',
      projects: '++id, name, stage',
      projectTransactions: '++id, projectId, type, date',
      dreams: '++id',
      settings: '++id',
    });

    // V2: add profiles table + profileId indexes
    this.version(2).stores({
      profiles: '++id, name, isDemo',
      accounts: '++id, profileId, name, type, currency, isArchived, sortOrder',
      snapshots: '++id, accountId, date',
      currencyRates: '++id, [from+to], date',
      projects: '++id, profileId, name, stage',
      projectTransactions: '++id, projectId, type, date',
      dreams: '++id, profileId',
      settings: '++id, profileId',
    }).upgrade(async (tx) => {
      // Create default profile
      const profileId = await tx.table('profiles').add({
        name: 'My',
        icon: '👤',
        isDemo: false,
        createdAt: new Date(),
      });

      // Assign all existing data to the default profile
      await tx.table('accounts').toCollection().modify({ profileId });
      await tx.table('dreams').toCollection().modify({ profileId });
      await tx.table('settings').toCollection().modify({ profileId });
      await tx.table('projects').toCollection().modify({ profileId });
    });

    // V3: история оценок проектов. Раньше оценка была одним перезаписываемым
    // полем — предыдущие значения терялись, и проект не попадал в график капитала.
    this.version(3).stores({
      profiles: '++id, name, isDemo',
      accounts: '++id, profileId, name, type, currency, isArchived, sortOrder',
      snapshots: '++id, accountId, date',
      currencyRates: '++id, [from+to], date',
      projects: '++id, profileId, name, stage',
      projectTransactions: '++id, projectId, type, date',
      projectValuations: '++id, projectId, date',
      dreams: '++id, profileId',
      settings: '++id, profileId',
    }).upgrade(async (tx) => {
      // Переносим текущую оценку в первую запись истории, чтобы ничего не потерять
      const projects = await tx.table('projects').toArray();
      const rows = projects
        .filter((p: InvestmentProject) => typeof p.currentMarketValue === 'number' && p.currentMarketValue > 0)
        .map((p: InvestmentProject) => ({
          projectId: p.id!,
          date: p.createdAt ?? new Date(),
          value: p.currentMarketValue,
        }));
      if (rows.length > 0) {
        await tx.table('projectValuations').bulkAdd(rows);
      }

      // Схлопываем дубли снапшотов: до этой версии каждое нажатие «Сохранить»
      // добавляло новую запись, и за один вечер ввода данных накапливались
      // десятки копий с одной датой. Оставляем по одной на счёт и день.
      const snaps: BalanceSnapshot[] = await tx.table('snapshots').toArray();
      const keep = new Map<string, { id: number; ts: number }>();
      const drop: number[] = [];
      for (const s of snaps) {
        if (s.id == null) continue;
        const key = `${s.accountId}|${new Date(s.date).toISOString().slice(0, 10)}`;
        const ts = new Date(s.date).getTime();
        const prev = keep.get(key);
        if (!prev) {
          keep.set(key, { id: s.id, ts });
        } else if (ts >= prev.ts && s.id > prev.id) {
          drop.push(prev.id);
          keep.set(key, { id: s.id, ts });
        } else {
          drop.push(s.id);
        }
      }
      if (drop.length > 0) {
        await tx.table('snapshots').bulkDelete(drop);
      }
    });
  }
}

export const db = new MyDreamsDB();

export async function ensureDefaultProfile(): Promise<number> {
  const profiles = await db.profiles.toArray();
  if (profiles.length === 0) {
    return db.profiles.add({
      name: 'My',
      icon: '👤',
      isDemo: false,
      createdAt: new Date(),
    });
  }
  return profiles[0].id!;
}

export async function getSettings(profileId: number): Promise<Settings | undefined> {
  return db.settings.where('profileId').equals(profileId).first();
}

export async function ensureSettings(profileId: number): Promise<void> {
  const existing = await db.settings.where('profileId').equals(profileId).first();
  if (!existing) {
    await db.settings.add({
      profileId,
      baseCurrency: 'USD',
      lastRatesUpdate: null,
    });
  }
}

export async function getDream(profileId: number): Promise<Dream | undefined> {
  return db.dreams.where('profileId').equals(profileId).first();
}

export async function setDream(profileId: number, targetAmount: number, currency: string): Promise<void> {
  const existing = await db.dreams.where('profileId').equals(profileId).first();
  if (existing?.id) {
    await db.dreams.update(existing.id, { targetAmount, currency });
  } else {
    await db.dreams.add({ profileId, targetAmount, currency });
  }
}

export async function getLatestSnapshot(accountId: number): Promise<BalanceSnapshot | undefined> {
  const snaps = await db.snapshots
    .where('accountId')
    .equals(accountId)
    .sortBy('date');
  return snaps[snaps.length - 1];
}

export async function getAccountSnapshots(accountId: number): Promise<BalanceSnapshot[]> {
  return db.snapshots
    .where('accountId')
    .equals(accountId)
    .sortBy('date');
}

export async function getAllSnapshots(): Promise<BalanceSnapshot[]> {
  return db.snapshots.toArray();
}

export async function getProjectValuations(projectId: number): Promise<ProjectValuation[]> {
  return db.projectValuations.where('projectId').equals(projectId).sortBy('date');
}

export async function getLatestValuation(projectId: number): Promise<ProjectValuation | undefined> {
  const all = await getProjectValuations(projectId);
  return all[all.length - 1];
}

/** Одна оценка на проект в день: повторный ввод за сегодня перезаписывает. */
export async function setProjectValuation(projectId: number, value: number, date = new Date()): Promise<void> {
  const day = date.toISOString().slice(0, 10);
  const existing = (await getProjectValuations(projectId)).find(
    (v) => new Date(v.date).toISOString().slice(0, 10) === day
  );
  if (existing?.id) {
    await db.projectValuations.update(existing.id, { value, date });
  } else {
    await db.projectValuations.add({ projectId, value, date });
  }
}

export async function seedDemoProfile(): Promise<number> {
  // Check if demo profile already exists
  const existing = await db.profiles.filter((p) => p.isDemo).first();
  if (existing?.id) return existing.id;

  const profileId = await db.profiles.add({
    name: 'Demo',
    icon: '🎭',
    isDemo: true,
    createdAt: new Date(),
  });

  await db.settings.add({
    profileId,
    baseCurrency: 'USD',
    lastRatesUpdate: null,
  });

  // Demo accounts
  const accounts = [
    { profileId, name: 'Main Checking', type: 'bank' as const, currency: 'USD', icon: '🏦', bankGroup: 'Chase', sortOrder: 0, isArchived: false, createdAt: new Date() },
    { profileId, name: 'Savings', type: 'bank' as const, currency: 'USD', icon: '💰', bankGroup: 'Chase', sortOrder: 1, isArchived: false, createdAt: new Date() },
    { profileId, name: 'EUR Account', type: 'bank' as const, currency: 'EUR', icon: '🇪🇺', bankGroup: 'Revolut', sortOrder: 2, isArchived: false, createdAt: new Date() },
    { profileId, name: 'Stock Portfolio', type: 'broker' as const, currency: 'USD', icon: '📈', sortOrder: 3, isArchived: false, createdAt: new Date() },
    { profileId, name: 'Bitcoin', type: 'crypto' as const, currency: 'BTC', icon: '₿', sortOrder: 4, isArchived: false, createdAt: new Date() },
    { profileId, name: 'Cash USD', type: 'cash' as const, currency: 'USD', icon: '💵', sortOrder: 5, isArchived: false, createdAt: new Date() },
    { profileId, name: 'Mortgage', type: 'debt' as const, currency: 'USD', icon: '🏠', bankGroup: 'Wells Fargo', sortOrder: 6, isArchived: false, createdAt: new Date() },
  ];

  const accountIds = await db.accounts.bulkAdd(accounts, { allKeys: true });

  // Demo snapshots (3 months of history)
  const now = new Date();
  const snapshots: { accountId: number; date: Date; amount: number }[] = [];

  const baseAmounts = [15000, 85000, 12000, 180000, 1.5, 5000, 120000];
  const growthRates = [0.02, 0.03, 0.01, 0.05, 0.08, -0.01, -0.003];

  for (let month = 2; month >= 0; month--) {
    const date = new Date(now.getFullYear(), now.getMonth() - month, 15);
    accountIds.forEach((accId, idx) => {
      const factor = 1 + growthRates[idx] * (2 - month);
      snapshots.push({
        accountId: accId,
        date,
        amount: Math.round(baseAmounts[idx] * factor * 100) / 100,
      });
    });
  }

  await db.snapshots.bulkAdd(snapshots);

  // Demo dream
  await db.dreams.add({ profileId, targetAmount: 1000000, currency: 'USD' });

  return profileId;
}
