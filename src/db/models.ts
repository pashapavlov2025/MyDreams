export type AccountType = 'bank' | 'cash' | 'broker' | 'crypto' | 'realestate' | 'debt' | 'other';

export interface Profile {
  id?: number;
  name: string;
  icon: string;
  isDemo: boolean;
  createdAt: Date;
}

/**
 * Реквизиты и указатели для близких — "что если со мной что-то случится".
 * Здесь НЕТ паролей, seed-фраз и полных номеров карт (см. PLAN.md, фаза 6).
 */
export interface AccountMetadata {
  contractNumber?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  organizationAddress?: string;
  accessMethod?: string;
  country?: string;
  documentsLocation?: string;
  beneficiary?: string;
  notes?: string;
}

export interface Account {
  id?: number;
  profileId: number;
  name: string;
  type: AccountType;
  currency: string;
  icon: string;
  bankGroup?: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: Date;
  metadata?: AccountMetadata;
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
  profileId: number;
  name: string;
  description: string;
  stage: ProjectStage;
  /**
   * Когда проект переведён в эксплуатацию. Ставится вручную вместе со сменой
   * стадии. Нужна именно дата, а не только текущая стадия: без неё
   * исторический график не знает, с какого момента считать проект по оценке,
   * и переход пришлось бы выводить из данных — то есть угадывать.
   */
  operatingSince?: Date | null;
  currency: string;
  currentMarketValue: number;
  createdAt: Date;
}

/**
 * Оценка проекта на дату. Ровно та же идея, что и BalanceSnapshot у счетов,
 * только обновляется редко — раз в квартал, а не раз в месяц.
 */
export interface ProjectValuation {
  id?: number;
  projectId: number;
  date: Date;
  value: number;
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
  profileId: number;
  targetAmount: number;
  currency: string;
}

export interface Settings {
  id?: number;
  profileId: number;
  baseCurrency: string;
  lastRatesUpdate: Date | null;
}

// Translation keys for account types — use with t() from useTranslation
export const ACCOUNT_TYPE_KEYS: Record<AccountType, string> = {
  bank: 'accountType.bank',
  cash: 'accountType.cash',
  broker: 'accountType.broker',
  crypto: 'accountType.crypto',
  realestate: 'accountType.realestate',
  debt: 'accountType.debt',
  other: 'accountType.other',
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
