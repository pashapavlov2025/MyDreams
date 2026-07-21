import assert from 'node:assert';

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

async function main() {
  const {
    shouldRemindBackup, markBackupDone, snoozeBackupReminder,
    LAST_BACKUP_KEY, BACKUP_SNOOZE_KEY, BACKUP_STALE_DAYS,
  } = await import('@/lib/backup');

  assert.strictEqual(shouldRemindBackup(false), false, 'пустое приложение не должно напоминать');
  assert.strictEqual(shouldRemindBackup(true), true, 'без бэкапа должно напоминать');

  markBackupDone();
  assert.strictEqual(shouldRemindBackup(true), false, 'сразу после бэкапа молчим');

  store[LAST_BACKUP_KEY] = new Date(Date.now() - 29 * 86400000).toISOString();
  assert.strictEqual(shouldRemindBackup(true), false, '29 дней — рано');

  store[LAST_BACKUP_KEY] = new Date(Date.now() - BACKUP_STALE_DAYS * 86400000 - 1000).toISOString();
  assert.strictEqual(shouldRemindBackup(true), true, '30 дней — пора');

  snoozeBackupReminder();
  assert.strictEqual(shouldRemindBackup(true), false, 'после «Позже» молчим');

  store[BACKUP_SNOOZE_KEY] = new Date(Date.now() - 1000).toISOString();
  assert.strictEqual(shouldRemindBackup(true), true, 'снуз истёк — снова напоминаем');

  store[LAST_BACKUP_KEY] = 'мусор';
  delete store[BACKUP_SNOOZE_KEY];
  assert.strictEqual(shouldRemindBackup(true), true, 'битая дата = считаем, что бэкапа не было');

  console.log('ALL PASS');
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
