'use client';

import { useEffect } from 'react';
import { useCurrencyRates } from '@/hooks/useCurrency';
import PinLock from '@/components/PinLock';
import { I18nProvider } from '@/i18n';
import { ProfileProvider } from '@/hooks/useProfile';

function useCapacitorPlugins() {
  useEffect(() => {
    async function init() {
      try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: 'LIGHT' as any });
      } catch {
        // Not running in Capacitor — web fallback
      }
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        Keyboard.addListener('keyboardWillShow', () => {
          document.body.classList.add('keyboard-open');
        });
        Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
        });
      } catch {
        // Not running in Capacitor
      }
    }
    init();
  }, []);
}

function Inner({ children }: { children: React.ReactNode }) {
  useCurrencyRates();
  useCapacitorPlugins();
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
