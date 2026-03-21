import { db } from '@/db/database';

// Fallback rates (used when no live rates available)
const FALLBACK_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  RUB: 0.011,
  IDR: 0.000063,
  GBP: 1.27,
  THB: 0.028,
  AED: 0.27,
  USDT: 1,
  BTC: 67000,
  ETH: 3500,
};

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

export function convertToBase(amount: number, fromCurrency: string, baseCurrency: string): number {
  if (fromCurrency === baseCurrency) return amount;

  const rates = getRatesToUSD();
  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[baseCurrency] ?? 1;

  return (amount * fromRate) / toRate;
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
    // Fiat rates from frankfurter.app (base: USD)
    const fiatRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,RUB,THB,AED,IDR');
    if (fiatRes.ok) {
      const data = await fiatRes.json();
      // frankfurter gives USD -> X, we need X -> USD
      for (const [currency, rate] of Object.entries(data.rates as Record<string, number>)) {
        rates[currency] = 1 / rate;
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
