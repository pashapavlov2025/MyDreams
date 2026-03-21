import { getCurrencySymbol } from './currency';

export function formatMoney(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const abs = Math.abs(amount);

  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = (abs / 1_000_000).toFixed(2) + 'M';
  } else if (abs >= 1_000) {
    formatted = abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
  } else {
    formatted = abs.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

export function formatMoneyShort(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const abs = Math.abs(amount);

  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = (abs / 1_000_000).toFixed(1) + 'M';
  } else if (abs >= 1_000) {
    formatted = (abs / 1_000).toFixed(0) + 'K';
  } else {
    formatted = abs.toFixed(0);
  }

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}
