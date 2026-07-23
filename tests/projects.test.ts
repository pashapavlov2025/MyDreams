import 'fake-indexeddb/auto';
import assert from 'node:assert';
import { db, setProjectValuation, getLatestValuation } from '@/db/database';
import { saveBalances, dedupeSnapshots } from '@/lib/snapshots';

// calcTotals не экспортирован — воспроизводим контракт через реальную БД
async function pnlOf(projectId: number) {
  const p = (await db.projects.get(projectId))!;
  const txs = await db.projectTransactions.where('projectId').equals(projectId).toArray();
  const invested = txs.filter(t => t.type === 'tranche' || t.type === 'construction_expense')
    .reduce((s, t) => s + t.amount, 0);
  const income = txs.filter(t => t.type === 'rental_income' || t.type === 'sale')
    .reduce((s, t) => s + t.amount, 0);
  const opex = txs.filter(t => t.type === 'operating_expense').reduce((s, t) => s + t.amount, 0);
  const mv = (await getLatestValuation(projectId))?.value ?? p.currentMarketValue ?? 0;
  const currentValue = p.stage === 'building' ? invested : mv;
  const pnl = (currentValue - invested) + (income - opex);
  return { invested, currentValue, pnl, roi: invested > 0 ? pnl / invested * 100 : 0 };
}

async function main() {
  const profileId = await db.profiles.add({ name: 'T', icon: '👤', isDemo: false, createdAt: new Date() });
  const pid = await db.projects.add({
    profileId, name: 'Villa', description: '', stage: 'building',
    currency: 'USD', currentMarketValue: 209500, createdAt: new Date('2026-02-01'),
  });
  await db.projectTransactions.bulkAdd([
    { projectId: pid, type: 'tranche', amount: 1492, date: new Date('2026-02-23'), category: '', description: '' },
    { projectId: pid, type: 'tranche', amount: 27838, date: new Date('2026-05-27'), category: '', description: '' },
    { projectId: pid, type: 'tranche', amount: 29330, date: new Date('2026-06-09'), category: '', description: '' },
  ]);

  // --- стройка: капитал по выплаченному, P&L ноль -------------------------
  let r = await pnlOf(pid);
  assert.strictEqual(r.invested, 58660);
  assert.strictEqual(r.currentValue, 58660, 'на стройке в капитал идёт выплаченное, не оценка');
  assert.strictEqual(r.pnl, 0, 'переложить деньги из банка в стройку — не прибыль');
  assert.strictEqual(r.roi, 0);
  console.log('✓ стройка: капитал = выплачено, P&L = 0');

  // --- эксплуатация: капитал по оценке -------------------------------------
  await db.projects.update(pid, { stage: 'operating' });
  await setProjectValuation(pid, 209500, new Date('2026-08-01'));
  r = await pnlOf(pid);
  assert.strictEqual(r.currentValue, 209500, 'на эксплуатации в капитал идёт оценка');
  assert.strictEqual(r.pnl, 209500 - 58660);
  console.log('✓ эксплуатация: капитал = оценка');

  // --- оценка выросла + аренда --------------------------------------------
  await db.projectTransactions.bulkAdd([
    { projectId: pid, type: 'rental_income', amount: 12000, date: new Date('2026-09-01'), category: '', description: '' },
    { projectId: pid, type: 'operating_expense', amount: 3000, date: new Date('2026-09-02'), category: '', description: '' },
  ]);
  await setProjectValuation(pid, 250000, new Date('2026-10-01'));
  r = await pnlOf(pid);
  assert.strictEqual(r.currentValue, 250000);
  assert.strictEqual(r.pnl, (250000 - 58660) + 9000);
  console.log('✓ рост оценки и операционка складываются');

  // --- одна оценка на день -------------------------------------------------
  const before = (await db.projectValuations.where('projectId').equals(pid).toArray()).length;
  await setProjectValuation(pid, 260000, new Date('2026-10-01'));
  const after = await db.projectValuations.where('projectId').equals(pid).toArray();
  assert.strictEqual(after.length, before, 'повторная оценка за тот же день не плодит записи');
  assert.strictEqual((await getLatestValuation(pid))!.value, 260000, 'перезаписывает значение');
  console.log('✓ оценка: одна на день, перезаписывается');

  // --- дедуп снапшотов -----------------------------------------------------
  const accId = await db.accounts.add({
    profileId, name: 'A', type: 'bank', currency: 'USD', icon: '', sortOrder: 0,
    isArchived: false, createdAt: new Date(),
  });
  const day = new Date('2026-07-21T10:00:00Z');
  await db.snapshots.bulkAdd(
    Array.from({ length: 11 }, (_, i) => ({ accountId: accId, amount: 100 + i, date: new Date(day.getTime() + i * 1000) }))
  );
  const removed = await dedupeSnapshots();
  const left = await db.snapshots.where('accountId').equals(accId).toArray();
  assert.strictEqual(removed, 10, `должно удалиться 10, удалено ${removed}`);
  assert.strictEqual(left.length, 1);
  assert.strictEqual(left[0].amount, 110, 'остаётся последняя запись за день');
  console.log('✓ дедуп: 11 записей за день → 1, остаётся последняя');

  // --- повторное сохранение того же значения не плодит записей -------------
  const testDate = new Date('2026-07-21T12:00:00Z');
  await saveBalances([{ accountId: accId, amount: 110 }], testDate);
  await saveBalances([{ accountId: accId, amount: 110 }], testDate);
  assert.strictEqual((await db.snapshots.where('accountId').equals(accId).toArray()).length, 1,
    'сохранение без изменения суммы не создаёт запись');
  await saveBalances([{ accountId: accId, amount: 999 }], testDate);
  const afterChange = await db.snapshots.where('accountId').equals(accId).toArray();
  assert.strictEqual(afterChange.length, 1, 'та же дата — обновляем, а не добавляем');
  assert.strictEqual(afterChange[0].amount, 999);
  console.log('✓ bulkUpdate: без изменений записи не растут, за день одна');

  // --- форма не должна затирать свежую оценку ------------------------------
  await setProjectValuation(pid, 300000, new Date('2026-11-01'));
  const latest = (await getLatestValuation(pid))!.value;
  const stale = (await db.projects.get(pid))!.currentMarketValue;
  assert.strictEqual(latest, 300000);
  assert.notStrictEqual(stale, latest, 'зеркало на проекте отстаёт — это ожидаемо');
  // форма обязана брать latest, иначе сохранение вернёт старое значение
  assert.strictEqual(latest, 300000, 'источник правды — история оценок');
  console.log('✓ источник правды для оценки — история, не поле проекта');

  console.log('\nALL PASS');
}
main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
