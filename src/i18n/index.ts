'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import React from 'react';
import ru, { type TranslationKey } from './ru';
import en from './en';

export type Locale = 'ru' | 'en';

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { ru, en };

const LOCALE_STORAGE_KEY = 'mydreams_locale';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ru',
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_STORAGE_KEY, l);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return dictionaries[locale][key] ?? key;
  }, [locale]);

  return React.createElement(I18nContext.Provider, { value: { locale, setLocale, t } }, children);
}

export function useTranslation() {
  return useContext(I18nContext);
}

export function getDateLocale(locale: Locale): string {
  return locale === 'ru' ? 'ru-RU' : 'en-US';
}

export type { TranslationKey };
