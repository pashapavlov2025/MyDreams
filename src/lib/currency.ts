import { db } from '@/db/database';

// Fallback rates (used when no live rates available)
const FALLBACK_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.14,
  RUB: 0.0128,
  KZT: 0.00213,
  IDR: 0.000056,
  GBP: 1.34,
  THB: 0.0297,
  AED: 0.2723,
  USDT: 1,
  BTC: 67000,
  ETH: 3500,
};

// Фиатные валюты, которые тянем живыми. Список закрытый: он же определяет
// выпадающие списки через getAvailableCurrencies(), а API отдаёт 160+ валют.
const LIVE_FIAT = ['EUR', 'GBP', 'RUB', 'KZT', 'THB', 'AED', 'IDR'] as const;

// Live rates cache (loaded from IndexedDB or API)
let liveRates: Record<string, number> | null = null;

export function setLiveRates(rates: Record<string, number>) {
  liveRates = rates;
}

function getRatesToUSD(): Record<string, number> {
  if (liveRates) {
    return { ...FALLBACK_RATES_TO_USD, ...liveRates };
  }
  return FALLBACK_RATES_TO_USD;
}

const warnedCurrencies = new Set<string>();

function rateToUSD(currency: string, rates: Record<string, number>): number {
  const rate = rates[currency];
  if (rate !== undefined) return rate;

  // Курс 1 для неизвестной валюты молча искажает Net Worth в разы
  // (1 000 000 ₸ превратились бы в $1 000 000), поэтому шумим в консоль.
  // Единственный путь попадания такой валюты в базу — импорт, он валидируется
  // в isSupportedCurrency (см. lib/backup.ts).
  if (!warnedCurrencies.has(currency)) {
    warnedCurrencies.add(currency);
    console.warn(`[currency] Нет курса для "${currency}" — считаю 1:1 к USD, сумма будет неверной`);
  }
  return 1;
}

export function convertToBase(amount: number, fromCurrency: string, baseCurrency: string): number {
  if (fromCurrency === baseCurrency) return amount;

  const rates = getRatesToUSD();
  return (amount * rateToUSD(fromCurrency, rates)) / rateToUSD(baseCurrency, rates);
}

export function isSupportedCurrency(currency: string): boolean {
  return currency in FALLBACK_RATES_TO_USD;
}

export function getAvailableCurrencies(): string[] {
  return Object.keys(getRatesToUSD());
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '\u20AC',
    RUB: '\u20BD',
    IDR: 'Rp',
    GBP: '\u00A3',
    THB: '\u0E3F',
    AED: '\u062F.\u0625',
    KZT: '\u20B8',
    USDT: '\u20AE',
    BTC: '\u20BF',
    ETH: '\u039E',
  };
  return symbols[currency] ?? currency;
}

// Fetch live rates from frankfurter.app (fiat) and coingecko (crypto)
export async function fetchLiveRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = { USD: 1 };

  try {
    // Фиат: open.er-api.com (без ключа). Раньше был frankfurter.app, но он
    // отдаёт курсы ЕЦБ — там нет ни рубля (с 2022), ни тенге, ни дирхама,
    // и они молча оставались захардкоженными.
    const fiatRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (fiatRes.ok) {
      const data = await fiatRes.json();
      const apiRates = (data?.rates ?? {}) as Record<string, number>;
      // API отдаёт USD -> X, нам нужно X -> USD. Берём только свой список:
      // иначе 160+ валют утекут в getAvailableCurrencies() и раздуют UI.
      for (const currency of LIVE_FIAT) {
        const rate = apiRates[currency];
        if (typeof rate === 'number' && rate > 0) {
          rates[currency] = 1 / rate;
        }
      }
    }
  } catch {
    // Use fallback rates for fiat
  }

  try {
    // Crypto rates from coingecko
    const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd');
    if (cryptoRes.ok) {
      const data = await cryptoRes.json();
      if (data.bitcoin?.usd) rates.BTC = data.bitcoin.usd;
      if (data.ethereum?.usd) rates.ETH = data.ethereum.usd;
      if (data.tether?.usd) rates.USDT = data.tether.usd;
    }
  } catch {
    // Use fallback for crypto
  }

  return rates;
}

export async function updateAndCacheRates(): Promise<void> {
  const rates = await fetchLiveRates();
  setLiveRates(rates);

  // Update lastRatesUpdate on all settings records (rates are global)
  const now = new Date();
  await db.settings.toCollection().modify({ lastRatesUpdate: now });

  // Cache rates in IndexedDB (upsert by currency pair)
  for (const [currency, rate] of Object.entries(rates)) {
    if (currency === 'USD') continue;
    const existing = await db.currencyRates
      .where('[from+to]')
      .equals([currency, 'USD'])
      .first();
    if (existing?.id) {
      await db.currencyRates.update(existing.id, { rate, date: now });
    } else {
      await db.currencyRates.add({ from: currency, to: 'USD', rate, date: now });
    }
  }
}

export async function loadCachedRates(): Promise<void> {
  const cached = await db.currencyRates.toArray();
  if (cached.length > 0) {
    const rates: Record<string, number> = { USD: 1 };
    for (const r of cached) {
      rates[r.from] = r.rate;
    }
    setLiveRates(rates);
  }
}
