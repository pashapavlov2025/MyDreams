import 'fake-indexeddb/auto';
import assert from 'node:assert';

import { db, seedDemoProfile } from '@/db/database';
import { createBackup, parseBackup, restoreBackup, backupStats } from '@/lib/backup';

async function counts() {
  return {
    profiles: await db.profiles.count(),
    accounts: await db.accounts.count(),
    snapshots: await db.snapshots.count(),
    projects: await db.projects.count(),
    transactions: await db.projectTransactions.count(),
    dreams: await db.dreams.count(),
    settings: await db.settings.count(),
  };
}

async function main() {
  // --- Seed a realistic profile -------------------------------------------
  const demoId = await seedDemoProfile();

  const projId = await db.projects.add({
    profileId: demoId,
    name: 'Bali Villa',
    description: 'test',
    stage: 'building',
    currency: 'USD',
    currentMarketValue: 250000,
    createdAt: new Date('2025-01-10'),
  });
  await db.projectTransactions.bulkAdd([
    { projectId: projId, type: 'tranche', amount: 50000, date: new Date('2025-02-01'), category: 'Land', description: 'first' },
    { projectId: projId, type: 'rental_income', amount: 3000, date: new Date('2025-06-01'), category: 'Rent', description: 'june' },
  ]);

  const before = await counts();
  console.log('seeded:', before);
  assert.ok(before.accounts === 7 && before.snapshots === 21, 'demo seed looks wrong');

  // --- Export --------------------------------------------------------------
  const backup = await createBackup();
  const json = JSON.stringify(backup);
  const stats = backupStats(backup);
  console.log('backup stats:', stats);
  assert.deepStrictEqual(stats, {
    profiles: before.profiles,
    accounts: before.accounts,
    snapshots: before.snapshots,
    projects: before.projects,
    transactions: before.transactions,
  });

  // --- Round-trip through JSON (dates become strings and back) -------------
  const parsed = parseBackup(json);
  assert.ok(parsed.data.snapshots[0].date instanceof Date, 'snapshot.date must revive to Date');
  assert.ok(parsed.data.accounts[0].createdAt instanceof Date, 'account.createdAt must revive to Date');
  assert.ok(parsed.data.projectTransactions[0].date instanceof Date, 'tx.date must revive to Date');
  console.log('✓ dates revived');

  // --- Invalid input rejected ---------------------------------------------
  assert.throws(() => parseBackup('not json'), /valid JSON/);
  assert.throws(() => parseBackup('{"format":"something-else"}'), /MyDreams backup/);
  assert.throws(() => parseBackup(JSON.stringify({ format: 'mydreams-backup', version: 99, data: {} })), /newer version/);
  assert.throws(() => parseBackup(JSON.stringify({ format: 'mydreams-backup', version: 1, data: {} })), /missing "profiles"/);
  console.log('✓ invalid files rejected');

  // --- Валюта без курса не должна попасть в базу -----------------------------
  const withBadCurrency = JSON.parse(json);
  withBadCurrency.data.accounts[0].currency = 'ZWL';
  assert.throws(() => parseBackup(JSON.stringify(withBadCurrency)), /Unsupported currencies.*ZWL/);
  // ...а поддерживаемая проходит
  const withKzt = JSON.parse(json);
  withKzt.data.accounts[0].currency = 'KZT';
  assert.strictEqual(parseBackup(JSON.stringify(withKzt)).data.accounts[0].currency, 'KZT');
  console.log('✓ currency validation: ZWL rejected, KZT accepted');

  // --- MERGE ---------------------------------------------------------------
  await restoreBackup(parsed, 'merge');
  const merged = await counts();
  console.log('after merge:', merged);
  assert.strictEqual(merged.profiles, before.profiles * 2, 'merge should double profiles');
  assert.strictEqual(merged.accounts, before.accounts * 2, 'merge should double accounts');
  assert.strictEqual(merged.snapshots, before.snapshots * 2, 'merge should double snapshots');
  assert.strictEqual(merged.transactions, before.transactions * 2, 'merge should double transactions');

  const names = (await db.profiles.toArray()).map((p) => p.name).sort();
  assert.ok(names.includes('Demo (import)'), `collision suffix missing: ${names}`);
  console.log('✓ merge: name collision suffixed ->', names);

  // Imported accounts must point at the NEW profile, not the original id
  const importedProfile = (await db.profiles.toArray()).find((p) => p.name === 'Demo (import)')!;
  const importedAccounts = await db.accounts.where('profileId').equals(importedProfile.id!).toArray();
  assert.strictEqual(importedAccounts.length, before.accounts, 'imported accounts not remapped to new profile');

  // ...and their snapshots must follow them
  const importedSnaps = await db.snapshots.where('accountId').equals(importedAccounts[0].id!).toArray();
  assert.strictEqual(importedSnaps.length, 3, 'imported snapshots not remapped');
  console.log('✓ merge: ids remapped, no cross-profile leakage');

  // --- REPLACE -------------------------------------------------------------
  const activeId = await restoreBackup(parsed, 'replace');
  const replaced = await counts();
  console.log('after replace:', replaced);
  assert.deepStrictEqual(replaced, before, 'replace should restore exactly the original counts');
  assert.ok(activeId != null, 'replace should return a profile id to activate');
  const activeProfile = await db.profiles.get(activeId!);
  assert.ok(activeProfile, 'returned profile id must exist');
  console.log('✓ replace: exact restore, active profile =', activeProfile!.name);

  // Data integrity after replace: no orphans
  const accountIds = new Set((await db.accounts.toArray()).map((a) => a.id));
  const orphanSnaps = (await db.snapshots.toArray()).filter((s) => !accountIds.has(s.accountId));
  assert.strictEqual(orphanSnaps.length, 0, 'orphan snapshots after replace');

  const profileIds = new Set((await db.profiles.toArray()).map((p) => p.id));
  const orphanAccounts = (await db.accounts.toArray()).filter((a) => !profileIds.has(a.profileId));
  assert.strictEqual(orphanAccounts.length, 0, 'orphan accounts after replace');

  const projectIds = new Set((await db.projects.toArray()).map((p) => p.id));
  const orphanTx = (await db.projectTransactions.toArray()).filter((t) => !projectIds.has(t.projectId));
  assert.strictEqual(orphanTx.length, 0, 'orphan transactions after replace');
  console.log('✓ replace: no orphaned rows');

  // Values survived intact
  const villa = (await db.projects.toArray()).find((p) => p.name === 'Bali Villa')!;
  assert.strictEqual(villa.currentMarketValue, 250000);
  const villaTx = await db.projectTransactions.where('projectId').equals(villa.id!).toArray();
  assert.strictEqual(villaTx.length, 2);
  assert.strictEqual(villaTx.find((t) => t.type === 'tranche')!.amount, 50000);
  assert.ok(villaTx[0].date instanceof Date && !isNaN(villaTx[0].date.getTime()), 'tx date corrupted');
  const dream = await db.dreams.toArray();
  assert.strictEqual(dream[0].targetAmount, 1000000);
  console.log('✓ replace: values and dates intact');

  console.log('\nALL PASS');
}

main().then(() => process.exit(0)).catch((e) => { console.error('\nFAIL:', e.message); process.exit(1); });
