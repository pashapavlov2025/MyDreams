import { convertToBase } from '@/lib/currency';
import type {
  Account,
  BalanceSnapshot,
  InvestmentProject,
  ProjectTransaction,
  ProjectValuation,
} from '@/db/models';

export interface NetWorthPoint {
  date: string;
  netWorth: number;
  accountsValue: number;
  projectsValue: number;
}

export interface NetWorthInput {
  accounts: Account[];
  snapshots: BalanceSnapshot[];
  projects: InvestmentProject[];
  transactions: ProjectTransaction[];
  valuations: ProjectValuation[];
  baseCurrency: string;
}

const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

/**
 * Стоимость проекта на дату.
 *
 * Стройка — по накопленным вложениям на этот момент: актив ещё не твой.
 * Эксплуатация — по последней оценке не позже этой даты.
 *
 * Момент перехода берётся из `operatingSince`, который выставляется вручную
 * вместе со сменой стадии. Выводить его из данных (например, из даты первой
 * оценки) нельзя: оценку имеет смысл вести и на стройке — это сумма, которую
 * ещё предстоит внести, — и она не означает, что объект сдан.
 */
export function projectValueAt(
  project: InvestmentProject,
  transactions: ProjectTransaction[],
  valuations: ProjectValuation[],
  at: string
): number {
  const invested = transactions
    .filter((t) => (t.type === 'tranche' || t.type === 'construction_expense') && dayKey(t.date) <= at)
    .reduce((s, t) => s + t.amount, 0);

  if (project.stage === 'building') return invested;

  // Проект в эксплуатации, но на эту дату ещё строился
  if (project.operatingSince && at < dayKey(project.operatingSince)) return invested;

  const valuation = valuations
    .filter((v) => dayKey(v.date) <= at)
    .sort((a, b) => dayKey(a.date).localeCompare(dayKey(b.date)))
    .pop();

  // Оценки на эту дату ещё нет — честнее показать вложенное, чем ноль
  return valuation ? valuation.value : invested;
}

/**
 * Ряд капитала по времени.
 *
 * Точками служат все даты, где что-то произошло: снапшот счёта, транш
 * проекта, новая оценка. Но только начиная с первого снапшота счёта —
 * раньше него балансов просто нет, и график показывал бы капитал,
 * состоящий из одних проектов, что неверно.
 */
export function buildNetWorthSeries(input: NetWorthInput): NetWorthPoint[] {
  const { accounts, snapshots, projects, transactions, valuations, baseCurrency } = input;
  if (snapshots.length === 0) return [];

  const accountMap = new Map<number, Account>();
  for (const a of accounts) if (a.id) accountMap.set(a.id, a);

  // последний снапшот за день по каждому счёту
  const byDate = new Map<string, Map<number, number>>();
  for (const s of snapshots) {
    const key = dayKey(s.date);
    if (!byDate.has(key)) byDate.set(key, new Map());
    byDate.get(key)!.set(s.accountId, s.amount);
  }

  const firstAccountDate = Array.from(byDate.keys()).sort()[0];

  const dates = new Set<string>(byDate.keys());
  for (const t of transactions) {
    const k = dayKey(t.date);
    if (k >= firstAccountDate) dates.add(k);
  }
  for (const v of valuations) {
    const k = dayKey(v.date);
    if (k >= firstAccountDate) dates.add(k);
  }

  const sorted = Array.from(dates).sort();
  const running = new Map<number, number>();
  const result: NetWorthPoint[] = [];

  for (const date of sorted) {
    byDate.get(date)?.forEach((amount, accId) => running.set(accId, amount));

    let accountsValue = 0;
    running.forEach((balance, accId) => {
      const acc = accountMap.get(accId);
      if (!acc) return;
      const converted = convertToBase(balance, acc.currency, baseCurrency);
      accountsValue += acc.type === 'debt' ? -Math.abs(converted) : converted;
    });

    let projectsValue = 0;
    for (const p of projects) {
      const txs = transactions.filter((t) => t.projectId === p.id);
      const vals = valuations.filter((v) => v.projectId === p.id);
      projectsValue += convertToBase(projectValueAt(p, txs, vals, date), p.currency, baseCurrency);
    }

    result.push({
      date,
      accountsValue,
      projectsValue,
      netWorth: accountsValue + projectsValue,
    });
  }

  return result;
}
