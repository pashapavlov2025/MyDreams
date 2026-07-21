import assert from 'node:assert';
import { buildNetWorthSeries, projectValueAt } from '@/lib/netWorth';
import type { Account, BalanceSnapshot, InvestmentProject, ProjectTransaction, ProjectValuation } from '@/db/models';

const acc = (id: number, type: Account['type'], currency = 'USD'): Account => ({
  id, profileId: 1, name: `A${id}`, type, currency, icon: '', sortOrder: id,
  isArchived: false, createdAt: new Date('2026-01-01'),
});
const snap = (accountId: number, date: string, amount: number): BalanceSnapshot =>
  ({ accountId, date: new Date(date), amount });
const proj = (stage: InvestmentProject['stage']): InvestmentProject => ({
  id: 1, profileId: 1, name: 'Villa', description: '', stage,
  currency: 'USD', currentMarketValue: 0, createdAt: new Date('2026-01-01'),
});
const tranche = (date: string, amount: number): ProjectTransaction =>
  ({ projectId: 1, type: 'tranche', amount, date: new Date(date), category: '', description: '' });
const val = (date: string, value: number): ProjectValuation =>
  ({ projectId: 1, date: new Date(date), value });

// --- projectValueAt --------------------------------------------------------
const txs = [tranche('2026-02-23', 1492), tranche('2026-05-27', 27838), tranche('2026-06-09', 29330)];

assert.strictEqual(projectValueAt(proj('building'), txs, [], '2026-01-01'), 0, 'до первого транша — ноль');
assert.strictEqual(projectValueAt(proj('building'), txs, [], '2026-02-23'), 1492, 'в день транша он уже учтён');
assert.strictEqual(projectValueAt(proj('building'), txs, [], '2026-05-31'), 29330, 'накопительно');
assert.strictEqual(projectValueAt(proj('building'), txs, [], '2026-07-21'), 58660, 'все транши');
// оценка на стройке игнорируется
assert.strictEqual(projectValueAt(proj('building'), txs, [val('2026-07-01', 209500)], '2026-07-21'), 58660,
  'на стройке оценка не влияет');
// на эксплуатации — по последней оценке не позже даты
assert.strictEqual(projectValueAt(proj('operating'), txs, [val('2026-07-01', 209500)], '2026-06-30'), 58660,
  'до первой оценки — по вложенному');
assert.strictEqual(projectValueAt(proj('operating'), txs, [val('2026-07-01', 209500)], '2026-07-21'), 209500);
assert.strictEqual(
  projectValueAt(proj('operating'), txs, [val('2026-07-01', 209500), val('2026-10-01', 250000)], '2026-09-15'),
  209500, 'берётся последняя оценка НЕ позже даты, будущая игнорируется');
console.log('✓ стоимость проекта на дату');

// --- ряд капитала ----------------------------------------------------------
const accounts = [acc(1, 'bank'), acc(2, 'debt')];
const snapshots = [
  snap(1, '2026-06-01', 100000),
  snap(1, '2026-07-01', 110000),
  snap(2, '2026-07-01', 40000),
];

let series = buildNetWorthSeries({
  accounts, snapshots, projects: [proj('building')], transactions: txs, valuations: [], baseCurrency: 'USD',
});

// точки: 2026-06-01 (снапшот), 2026-06-09 (транш), 2026-07-01 (снапшот)
assert.deepStrictEqual(series.map(p => p.date), ['2026-06-01', '2026-06-09', '2026-07-01'],
  `даты ряда: ${series.map(p=>p.date)}`);
console.log('✓ точки ряда включают даты траншей');

// февральский и майский транши раньше первого снапшота — точками не становятся,
// но в сумму на 1 июня входят
assert.strictEqual(series[0].projectsValue, 29330, 'транши до начала истории всё равно накоплены');
assert.strictEqual(series[0].accountsValue, 100000);
assert.strictEqual(series[0].netWorth, 129330);
console.log('✓ ранние транши не создают точек, но учитываются в сумме');

assert.strictEqual(series[1].projectsValue, 58660, 'транш 9 июня добавился');
assert.strictEqual(series[1].accountsValue, 100000, 'баланс счёта тянется с прошлой точки');

// долг вычитается
assert.strictEqual(series[2].accountsValue, 110000 - 40000, 'долг вычитается по модулю');
assert.strictEqual(series[2].netWorth, 70000 + 58660);
console.log('✓ долг вычитается, балансы переносятся вперёд');

// --- эксплуатация: скачок в день первой оценки -----------------------------
series = buildNetWorthSeries({
  accounts, snapshots, projects: [proj('operating')], transactions: txs,
  valuations: [val('2026-07-01', 209500)], baseCurrency: 'USD',
});
const jun9 = series.find(p => p.date === '2026-06-09')!;
const jul1 = series.find(p => p.date === '2026-07-01')!;
assert.strictEqual(jun9.projectsValue, 58660, 'до оценки — по вложенному');
assert.strictEqual(jul1.projectsValue, 209500, 'с даты оценки — по ней');
console.log('✓ переход на рыночную оценку происходит в дату первой оценки');

// --- вырожденные случаи ----------------------------------------------------
assert.deepStrictEqual(
  buildNetWorthSeries({ accounts, snapshots: [], projects: [proj('building')], transactions: txs, valuations: [], baseCurrency: 'USD' }),
  [], 'без снапшотов счетов ряда нет — иначе капитал состоял бы из одних проектов');
console.log('✓ без истории счетов ряд пустой');

console.log('\nALL PASS');
