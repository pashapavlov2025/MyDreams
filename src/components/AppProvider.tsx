'use client';

import { useCurrencyRates } from '@/hooks/useCurrency';
import PinLock from '@/components/PinLock';
import { I18nProvider } from '@/i18n';
import { ProfileProvider } from '@/hooks/useProfile';

function Inner({ children }: { children: React.ReactNode }) {
  useCurrencyRates();
  return <PinLock>{children}</PinLock>;
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ProfileProvider>
        <Inner>{children}</Inner>
      </ProfileProvider>
    </I18nProvider>
  );
}
