import Dexie, { type Table } from 'dexie';
import type {
  Account,
  BalanceSnapshot,
  CurrencyRate,
  InvestmentProject,
  ProjectTransaction,
  Dream,
  Settings,
} from './models';

class MyDreamsDB extends Dexie {
  accounts!: Table<Account, number>;
  snapshots!: Table<BalanceSnapshot, number>;
  currencyRates!: Table<CurrencyRate, number>;
  projects!: Table<InvestmentProject, number>;
  projectTransactions!: Table<ProjectTransaction, number>;
  dreams!: Table<Dream, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('MyDreamsDB');

    this.version(1).stores({
      accounts: '++id, name, type, currency, isArchived, sortOrder',
      snapshots: '++id, accountId, date',
      currencyRates: '++id, [from+to], date',
      projects: '++id, name, stage',
      projectTransactions: '++id, projectId, type, date',
      dreams: '++id',
      settings: '++id',
    });
  }
}

export const db = new MyDreamsDB();

export async function getSettings(): Promise<Settings | undefined> {
  return db.settings.toCollection().first();
}

export async function ensureSettings(): Promise<void> {
  const existing = await db.settings.toCollection().first();
  if (!existing) {
    await db.settings.add({
      baseCurrency: 'USD',
      lastRatesUpdate: null,
    });
  }
}

export async function getDream(): Promise<Dream | undefined> {
  return db.dreams.toCollection().first();
}

export async function setDream(targetAmount: number, currency: string): Promise<void> {
  const existing = await db.dreams.toCollection().first();
  if (existing?.id) {
    await db.dreams.update(existing.id, { targetAmount, currency });
  } else {
    await db.dreams.add({ targetAmount, currency });
  }
}

export async function getLatestSnapshot(accountId: number): Promise<BalanceSnapshot | undefined> {
  return db.snapshots
    .where('accountId')
    .equals(accountId)
    .reverse()
    .sortBy('date')
    .then((snaps) => snaps[0]);
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
