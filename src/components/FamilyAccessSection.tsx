'use client';

import { useState } from 'react';
import { useAccountsWithBalances } from '@/hooks/useAccounts';
import { useSettings } from '@/hooks/useCurrency';
import { useProfile } from '@/hooks/useProfile';
import { useTranslation, getDateLocale } from '@/i18n';
import { generateFamilyAccessHtml, deliverFamilyAccessDocument, familyAccessFilename } from '@/lib/familyExport';
import type { FamilyExportKey } from '@/lib/familyExport';
import type { TranslationKey } from '@/i18n';

export default function FamilyAccessSection() {
  const accounts = useAccountsWithBalances();
  const { settings } = useSettings();
  const { profileId, profiles } = useProfile();
  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const profile = profiles.find((p) => p.id === profileId);
  const accountsWithMetadata = accounts.filter((a) => a.metadata && Object.keys(a.metadata).length > 0);

  const handleExport = async () => {
    if (!profile || accounts.length === 0) return;
    setExporting(true);
    setResult(null);
    try {
      const html = generateFamilyAccessHtml({
        profile,
        accounts,
        baseCurrency: settings?.baseCurrency ?? 'USD',
        locale: dateLocale,
        t: (key: FamilyExportKey) => t(key as TranslationKey),
      });
      const filename = familyAccessFilename();
      const delivery = await deliverFamilyAccessDocument(html, filename);
      setResult(delivery === 'shared' ? t('familyExport.shared') : t('familyExport.downloaded'));
    } catch {
      setResult(t('familyExport.failed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {t('familyExport.sectionTitle')}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-3">
            {t('familyExport.sectionHint')}
          </div>
          {accountsWithMetadata.length > 0 && (
            <div className="text-xs text-gray-400 mb-3">
              {t('familyExport.readyCount')}: {accountsWithMetadata.length} / {accounts.length}
            </div>
          )}
          <button
            onClick={handleExport}
            disabled={exporting || accounts.length === 0}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 active:bg-indigo-700 transition-colors"
          >
            {exporting ? t('familyExport.exporting') : t('familyExport.export')}
          </button>
          {result && (
            <div className="text-xs text-center mt-2 text-gray-500">{result}</div>
          )}
        </div>
      </div>
    </section>
  );
}
