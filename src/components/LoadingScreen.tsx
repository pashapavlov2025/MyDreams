'use client';

import { useTranslation } from '@/i18n';

export default function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">{t('common.loading')}</div>
    </div>
  );
}
