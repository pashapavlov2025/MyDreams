'use client';

import { formatMoney } from '@/lib/format';
import { useTranslation } from '@/i18n';

interface DreamProgressProps {
  currentNetWorth: number;
  targetAmount: number;
  currency: string;
}

export default function DreamProgress({ currentNetWorth, targetAmount, currency }: DreamProgressProps) {
  const progress = targetAmount > 0 ? Math.min((currentNetWorth / targetAmount) * 100, 100) : 0;
  const { t } = useTranslation();

  return (
    <div className="px-4 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
      <div className="text-sm font-medium opacity-80 mb-1">{t('dream.pathToDream')}</div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold">{formatMoney(currentNetWorth, currency)}</span>
        <span className="text-sm opacity-70">/ {formatMoney(targetAmount, currency)}</span>
      </div>

      <div className="w-full bg-white/20 rounded-full h-3 mb-2">
        <div
          className="bg-white rounded-full h-3 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs opacity-80">
        <span>{progress.toFixed(1)}%</span>
        <span>
          {t('dream.remaining')} {formatMoney(Math.max(targetAmount - currentNetWorth, 0), currency)}
        </span>
      </div>
    </div>
  );
}
