// Захардкоженные курсы к USD (обновим на живые в Фазе 2)
const RATES_TO_USD: Record<string, number> = {
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

export function convertToBase(amount: number, fromCurrency: string, baseCurrency: string): number {
  if (fromCurrency === baseCurrency) return amount;

  const fromRate = RATES_TO_USD[fromCurrency] ?? 1;
  const toRate = RATES_TO_USD[baseCurrency] ?? 1;

  return (amount * fromRate) / toRate;
}

export function getAvailableCurrencies(): string[] {
  return Object.keys(RATES_TO_USD);
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    RUB: '₽',
    IDR: 'Rp',
    GBP: '£',
    THB: '฿',
    AED: 'د.إ',
    USDT: '₮',
    BTC: '₿',
    ETH: 'Ξ',
  };
  return symbols[currency] ?? currency;
}
