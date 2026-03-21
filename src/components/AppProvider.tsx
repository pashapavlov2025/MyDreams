'use client';

import { useCurrencyRates } from '@/hooks/useCurrency';
import PinLock from '@/components/PinLock';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  useCurrencyRates();
  return <PinLock>{children}</PinLock>;
}
