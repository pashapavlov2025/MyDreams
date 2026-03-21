export type AccountType = 'bank' | 'cash' | 'broker' | 'crypto' | 'realestate' | 'debt' | 'other';

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
  currency: string;
  icon: string;
  bankGroup?: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: Date;
}

export interface BalanceSnapshot {
  id?: number;
  accountId: number;
  date: Date;
  amount: number;
}

export interface CurrencyRate {
  id?: number;
  from: string;
  to: string;
  rate: number;
  date: Date;
}

export type ProjectStage = 'building' | 'operating';

export interface InvestmentProject {
  id?: number;
  name: string;
  description: string;
  stage: ProjectStage;
  currency: string;
  currentMarketValue: number;
  createdAt: Date;
}

export type TransactionType = 'tranche' | 'construction_expense' | 'rental_income' | 'operating_expense' | 'sale';

export interface ProjectTransaction {
  id?: number;
  projectId: number;
  type: TransactionType;
  amount: number;
  date: Date;
  category: string;
  description: string;
}

export interface Dream {
  id?: number;
  targetAmount: number;
  currency: string;
}

export interface Settings {
  id?: number;
  baseCurrency: string;
  lastRatesUpdate: Date | null;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: 'Банки',
  cash: 'Наличные',
  broker: 'Брокер',
  crypto: 'Крипто',
  realestate: 'Недвижимость',
  debt: 'Долги',
  other: 'Другое',
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  bank: '🏦',
  cash: '💵',
  broker: '📈',
  crypto: '₿',
  realestate: '🏠',
  debt: '💳',
  other: '📦',
};
