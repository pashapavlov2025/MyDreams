import { db } from '@/db/database';

function dayKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

/**
 * Одна запись на счёт в день. Раньше каждое нажатие «Сохранить» добавляло
 * новый снапшот — за один вечер ввода данных накапливались десятки копий
 * с одной датой, из-за чего пропадала дельта на дашборде (она считается
 * между разными датами) и распухал бэкап.
 *
 * Записи, не меняющие сумму, не создаются вовсе.
 */
export async function saveBalances(balances: { accountId: number; amount: number }[]): Promise<void> {
  const now = new Date();
  const today = dayKey(now);

  const valid = balances.filter(
    (b) => b.amount !== null && b.amount !== undefined && !isNaN(b.amount)
  );
  if (valid.length === 0) return;

  await db.transaction('rw', db.snapshots, async () => {
    for (const b of valid) {
      const existing = await db.snapshots.where('accountId').equals(b.accountId).sortBy('date');

      const todays = existing.find((s) => dayKey(s.date) === today);
      if (todays?.id) {
        if (todays.amount !== b.amount) {
          await db.snapshots.update(todays.id, { amount: b.amount, date: now });
        }
        continue;
      }

      // Ничего не изменилось с прошлого раза — новая запись не несёт информации
      const last = existing[existing.length - 1];
      if (last && last.amount === b.amount) continue;

      await db.snapshots.add({ accountId: b.accountId, amount: b.amount, date: now });
    }
  });
}

/**
 * Схлопывает уже накопившиеся дубли: на каждый счёт и день остаётся
 * последняя запись. Возвращает, сколько записей удалено.
 */
export async function dedupeSnapshots(): Promise<number> {
  let removed = 0;
  await db.transaction('rw', db.snapshots, async () => {
    const all = await db.snapshots.toArray();
    const keep = new Map<string, { id: number; ts: number }>();
    const drop: number[] = [];

    for (const s of all) {
      if (s.id == null) continue;
      const key = `${s.accountId}|${dayKey(s.date)}`;
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

    if (drop.length > 0) await db.snapshots.bulkDelete(drop);
    removed = drop.length;
  });
  return removed;
}
