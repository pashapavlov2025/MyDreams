import { db } from '@/db/database';
import { isSupportedCurrency } from '@/lib/currency';
import type {
  Profile,
  Account,
  BalanceSnapshot,
  InvestmentProject,
  ProjectTransaction,
  ProjectValuation,
  Dream,
  Settings,
} from '@/db/models';

export const BACKUP_FORMAT = 'mydreams-backup';
export const BACKUP_VERSION = 2;

export interface BackupData {
  profiles: Profile[];
  accounts: Account[];
  snapshots: BalanceSnapshot[];
  projects: InvestmentProject[];
  projectTransactions: ProjectTransaction[];
  projectValuations: ProjectValuation[];
  dreams: Dream[];
  settings: Settings[];
}

export interface Backup {
  format: string;
  version: number;
  exportedAt: string;
  data: BackupData;
}

export interface BackupStats {
  profiles: number;
  accounts: number;
  snapshots: number;
  projects: number;
  transactions: number;
}

export type RestoreMode = 'replace' | 'merge';

// currencyRates не бэкапим — это кеш, он подтягивается из API заново

export async function createBackup(): Promise<Backup> {
  const [profiles, accounts, snapshots, projects, projectTransactions, projectValuations, dreams, settings] =
    await Promise.all([
      db.profiles.toArray(),
      db.accounts.toArray(),
      db.snapshots.toArray(),
      db.projects.toArray(),
      db.projectTransactions.toArray(),
      db.projectValuations.toArray(),
      db.dreams.toArray(),
      db.settings.toArray(),
    ]);

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { profiles, accounts, snapshots, projects, projectTransactions, projectValuations, dreams, settings },
  };
}

export function backupStats(backup: Backup): BackupStats {
  return {
    profiles: backup.data.profiles.length,
    accounts: backup.data.accounts.length,
    snapshots: backup.data.snapshots.length,
    projects: backup.data.projects.length,
    transactions: backup.data.projectTransactions.length,
  };
}

export const LAST_BACKUP_KEY = 'mydreams_last_backup';
export const BACKUP_SNOOZE_KEY = 'mydreams_backup_snooze';

/** Порог, после которого напоминаем сделать бэкап. */
export const BACKUP_STALE_DAYS = 30;

export function markBackupDone(): void {
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  localStorage.removeItem(BACKUP_SNOOZE_KEY);
}

export function getLastBackupAt(): Date | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function snoozeBackupReminder(days = 7): void {
  const until = new Date(Date.now() + days * 86400000);
  localStorage.setItem(BACKUP_SNOOZE_KEY, until.toISOString());
}

/**
 * Напоминать ли о бэкапе. Пустое приложение не трогаем — там нечего терять.
 */
export function shouldRemindBackup(hasData: boolean): boolean {
  if (!hasData || typeof localStorage === 'undefined') return false;

  const snoozeRaw = localStorage.getItem(BACKUP_SNOOZE_KEY);
  if (snoozeRaw && new Date(snoozeRaw).getTime() > Date.now()) return false;

  const last = getLastBackupAt();
  return last === null || daysSince(last) >= BACKUP_STALE_DAYS;
}

export function backupFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `mydreams-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

function toDate(value: unknown): Date {
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? new Date() : d;
}

function requireArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Backup is missing "${field}"`);
  return value;
}

/**
 * Парсит и валидирует JSON бэкапа. Даты после JSON.parse — строки,
 * поэтому сразу оживляем их в Date, чтобы дальше код работал с моделями как есть.
 */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON');
  }

  const obj = raw as Partial<Backup>;
  if (!obj || obj.format !== BACKUP_FORMAT) {
    throw new Error('Not a MyDreams backup file');
  }
  if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION) {
    throw new Error('Backup was made by a newer version of the app');
  }
  if (!obj.data || typeof obj.data !== 'object') {
    throw new Error('Backup has no data');
  }

  const d = obj.data as unknown as Record<string, unknown>;

  const profiles = (requireArray(d.profiles, 'profiles') as Profile[]).map((p) => ({
    ...p,
    createdAt: toDate(p.createdAt),
  }));
  const accounts = (requireArray(d.accounts, 'accounts') as Account[]).map((a) => ({
    ...a,
    createdAt: toDate(a.createdAt),
  }));
  const snapshots = (requireArray(d.snapshots, 'snapshots') as BalanceSnapshot[]).map((s) => ({
    ...s,
    date: toDate(s.date),
  }));
  const projects = (requireArray(d.projects, 'projects') as InvestmentProject[]).map((p) => ({
    ...p,
    createdAt: toDate(p.createdAt),
  }));
  const projectTransactions = (
    requireArray(d.projectTransactions, 'projectTransactions') as ProjectTransaction[]
  ).map((tx) => ({ ...tx, date: toDate(tx.date) }));
  // v1-бэкапы про оценки не знали — для них это просто пустой список
  const projectValuations = (Array.isArray(d.projectValuations) ? d.projectValuations : [] as unknown[])
    .map((v) => ({ ...(v as ProjectValuation), date: toDate((v as ProjectValuation).date) }));
  const dreams = requireArray(d.dreams, 'dreams') as Dream[];
  const settings = (requireArray(d.settings, 'settings') as Settings[]).map((s) => ({
    ...s,
    lastRatesUpdate: s.lastRatesUpdate ? toDate(s.lastRatesUpdate) : null,
  }));

  // Импорт — единственный путь, которым в базу может попасть валюта без курса.
  // Без этой проверки convertToBase посчитал бы её 1:1 к доллару.
  const unknown = new Set<string>();
  for (const c of [
    ...accounts.map((a) => a.currency),
    ...projects.map((p) => p.currency),
    ...dreams.map((d) => d.currency),
    ...settings.map((s) => s.baseCurrency),
  ]) {
    if (c && !isSupportedCurrency(c)) unknown.add(c);
  }
  if (unknown.size > 0) {
    throw new Error(`Unsupported currencies in backup: ${Array.from(unknown).sort().join(', ')}`);
  }

  return {
    format: obj.format,
    version: obj.version,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    data: { profiles, accounts, snapshots, projects, projectTransactions, projectValuations, dreams, settings },
  };
}

/**
 * Восстанавливает данные из бэкапа. Всегда перевыдаёт id заново и
 * перепривязывает ссылки — так merge не конфликтует с существующими данными,
 * а replace не зависит от счётчиков autoincrement.
 *
 * Возвращает id профиля, на который стоит переключиться после восстановления.
 */
export async function restoreBackup(backup: Backup, mode: RestoreMode): Promise<number | null> {
  const { profiles, accounts, snapshots, projects, projectTransactions, projectValuations, dreams, settings } =
    backup.data;

  return db.transaction(
    'rw',
    [db.profiles, db.accounts, db.snapshots, db.projects, db.projectTransactions, db.projectValuations, db.dreams, db.settings],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.snapshots.clear(),
          db.accounts.clear(),
          db.projectTransactions.clear(),
          db.projectValuations.clear(),
          db.projects.clear(),
          db.dreams.clear(),
          db.settings.clear(),
          db.profiles.clear(),
        ]);
      }

      const existingNames =
        mode === 'merge' ? new Set((await db.profiles.toArray()).map((p) => p.name)) : new Set<string>();

      // Profiles
      const profileIdMap = new Map<number, number>();
      const newProfiles = profiles.map(({ id, ...rest }) => ({
        ...rest,
        name: existingNames.has(rest.name) ? `${rest.name} (import)` : rest.name,
      }));
      const newProfileIds = await db.profiles.bulkAdd(newProfiles, { allKeys: true });
      profiles.forEach((p, i) => {
        if (p.id != null) profileIdMap.set(p.id, newProfileIds[i]);
      });

      // Accounts (пропускаем осиротевшие — профиля для них в бэкапе нет)
      const accountIdMap = new Map<number, number>();
      const liveAccounts = accounts.filter((a) => profileIdMap.has(a.profileId));
      const newAccountIds = await db.accounts.bulkAdd(
        liveAccounts.map(({ id, ...rest }) => ({ ...rest, profileId: profileIdMap.get(rest.profileId)! })),
        { allKeys: true }
      );
      liveAccounts.forEach((a, i) => {
        if (a.id != null) accountIdMap.set(a.id, newAccountIds[i]);
      });

      // Snapshots
      await db.snapshots.bulkAdd(
        snapshots
          .filter((s) => accountIdMap.has(s.accountId))
          .map(({ id, ...rest }) => ({ ...rest, accountId: accountIdMap.get(rest.accountId)! }))
      );

      // Projects
      const projectIdMap = new Map<number, number>();
      const liveProjects = projects.filter((p) => profileIdMap.has(p.profileId));
      const newProjectIds = await db.projects.bulkAdd(
        liveProjects.map(({ id, ...rest }) => ({ ...rest, profileId: profileIdMap.get(rest.profileId)! })),
        { allKeys: true }
      );
      liveProjects.forEach((p, i) => {
        if (p.id != null) projectIdMap.set(p.id, newProjectIds[i]);
      });

      // Project transactions
      await db.projectTransactions.bulkAdd(
        projectTransactions
          .filter((tx) => projectIdMap.has(tx.projectId))
          .map(({ id, ...rest }) => ({ ...rest, projectId: projectIdMap.get(rest.projectId)! }))
      );

      // Project valuations
      await db.projectValuations.bulkAdd(
        projectValuations
          .filter((v) => projectIdMap.has(v.projectId))
          .map(({ id, ...rest }) => ({ ...rest, projectId: projectIdMap.get(rest.projectId)! }))
      );

      // Dreams
      await db.dreams.bulkAdd(
        dreams
          .filter((d) => profileIdMap.has(d.profileId))
          .map(({ id, ...rest }) => ({ ...rest, profileId: profileIdMap.get(rest.profileId)! }))
      );

      // Settings
      await db.settings.bulkAdd(
        settings
          .filter((s) => profileIdMap.has(s.profileId))
          .map(({ id, ...rest }) => ({ ...rest, profileId: profileIdMap.get(rest.profileId)! }))
      );

      return newProfileIds.length > 0 ? newProfileIds[0] : null;
    }
  );
}

export type DeliveryResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Отдаёт файл пользователю. На iOS (в т.ч. в standalone PWA) `<a download>`
 * не работает — там нужен Web Share, который открывает системный шит
 * с "Save to Files" и AirDrop. На десктопе — обычное скачивание.
 */
export async function deliverBackupFile(json: string, filename: string): Promise<DeliveryResult> {
  const file = new File([json], filename, { type: 'application/json' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
      // иначе — падаем в обычное скачивание
    }
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
